import { useEffect, useState } from "react";
import EmptyState from "../../components/EmptyState";
import {
  fetchAdminBuildConfig,
  updateAdminBuildConfig,
} from "../../api";

function emptyTool(sort = 1) {
  return {
    id: "",
    name: "",
    emoji: "🛠️",
    desc: "",
    downloadUrl: "",
    inviteCode: "",
    recommended: false,
    sponsored: false,
    incentive: 0,
    enabled: true,
    sort,
  };
}

export default function BuildTools() {
  const [scenes, setScenes] = useState([]);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [form, setForm] = useState(emptyTool());

  async function load() {
    try {
      setLoading(true);
      setError("");
      const data = await fetchAdminBuildConfig();
      setScenes(Array.isArray(data?.scenes) ? data.scenes : []);
      setTools(Array.isArray(data?.tools) ? data.tools : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openModal(tool = null, index = -1) {
    setEditingIndex(index);
    setForm(tool ? { ...emptyTool(), ...tool } : emptyTool(tools.length + 1));
    setMessage("");
    setError("");
    setModalOpen(true);
  }

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function persist(nextTools, successMsg) {
    const result = await updateAdminBuildConfig({
      scenes,
      tools: nextTools,
    });
    setScenes(result.config?.scenes || scenes);
    setTools(result.config?.tools || nextTools);
    setMessage(successMsg || result.message || "已保存");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setError("请填写工具名称");
      return;
    }
    const nextTool = {
      ...form,
      id: form.id || undefined,
      name,
      emoji: form.emoji || "🛠️",
      desc: String(form.desc || "").trim(),
      downloadUrl: String(form.downloadUrl || "").trim(),
      inviteCode: String(form.inviteCode || "").trim(),
      recommended: Boolean(form.recommended),
      sponsored: Boolean(form.sponsored),
      incentive: Number(form.incentive) || 0,
      enabled: form.enabled !== false,
      sort: Number(form.sort) || tools.length + 1,
    };

    try {
      setSaving(true);
      setError("");
      const next = [...tools];
      if (editingIndex >= 0) next[editingIndex] = nextTool;
      else next.push(nextTool);
      await persist(next, editingIndex >= 0 ? "工具已更新" : "工具已新增");
      setModalOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleEnabled(index) {
    try {
      setError("");
      const next = tools.map((t, i) =>
        i === index ? { ...t, enabled: !(t.enabled !== false) } : t,
      );
      await persist(next, "显示状态已更新");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(index, name) {
    if (!window.confirm(`确定删除构建工具「${name}」？`)) return;
    try {
      setError("");
      await persist(
        tools.filter((_, i) => i !== index),
        "工具已删除",
      );
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="admin-toolbar">
        <button type="button" className="add-banner-btn" onClick={() => openModal()}>
          新增工具
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {message && <div className="admin-success">{message}</div>}

      {loading ? (
        <div className="dash-loading">加载中...</div>
      ) : tools.length === 0 ? (
        <EmptyState title="还没有构建工具" />
      ) : (
        <div className="admin-masonry">
          {tools.map((tool, index) => (
            <article
              key={tool.id || tool.name}
              className={
                "admin-masonry-card" +
                (tool.enabled !== false ? "" : " is-off")
              }
            >
              <div className="admin-masonry-card-top">
                <span
                  className={
                    "status-badge " +
                    (tool.enabled !== false
                      ? "status-approved"
                      : "status-rejected")
                  }
                >
                  {tool.enabled !== false ? "启用中" : "已停用"}
                </span>
                {tool.sponsored && (
                  <span className="status-badge status-pending">赞助</span>
                )}
                {tool.recommended && (
                  <span className="status-badge status-approved">推荐</span>
                )}
              </div>
              <h2 className="admin-masonry-title">
                <span aria-hidden>{tool.emoji || "🛠️"}</span> {tool.name}
              </h2>
              <p className="admin-masonry-id">{tool.id}</p>
              <p className="admin-hint">{tool.desc || "暂无描述"}</p>
              <p className="admin-hint">
                邀请码：{tool.inviteCode || "—"}
                {tool.sponsored
                  ? ` · 激励 ¥${Number(tool.incentive || 0).toFixed(1)}`
                  : ""}
              </p>
              <div className="admin-masonry-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  onClick={() => openModal(tool, index)}
                >
                  编辑
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-ghost"
                  onClick={() => toggleEnabled(index)}
                >
                  {tool.enabled !== false ? "停用" : "启用"}
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-danger"
                  onClick={() => handleDelete(index, tool.name)}
                >
                  删除
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay">
          <form className="modal-card" onSubmit={handleSubmit}>
            <div className="modal-header">
              <div>
                <p className="modal-eyebrow">构建工具</p>
                <h2>{editingIndex >= 0 ? "编辑工具" : "新增工具"}</h2>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => !saving && setModalOpen(false)}
                aria-label="关闭"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="admin-topic-form-row">
                <label className="modal-field">
                  <span>Emoji</span>
                  <input
                    value={form.emoji}
                    onChange={(e) => updateForm("emoji", e.target.value)}
                    maxLength={4}
                    disabled={saving}
                  />
                </label>
                <label className="modal-field">
                  <span>工具名称 *</span>
                  <input
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    required
                    disabled={saving}
                  />
                </label>
                <label className="modal-field">
                  <span>排序</span>
                  <input
                    type="number"
                    value={form.sort}
                    onChange={(e) => updateForm("sort", e.target.value)}
                    disabled={saving}
                  />
                </label>
              </div>

              <label className="modal-field">
                <span>简介</span>
                <textarea
                  value={form.desc}
                  onChange={(e) => updateForm("desc", e.target.value)}
                  rows={3}
                  disabled={saving}
                />
              </label>

              <label className="modal-field">
                <span>下载 / 入口链接</span>
                <input
                  value={form.downloadUrl}
                  onChange={(e) => updateForm("downloadUrl", e.target.value)}
                  placeholder="https://"
                  disabled={saving}
                />
              </label>

              <div className="admin-topic-form-row">
                <label className="modal-field">
                  <span>邀请码</span>
                  <input
                    value={form.inviteCode}
                    onChange={(e) => updateForm("inviteCode", e.target.value)}
                    disabled={saving}
                  />
                </label>
                <label className="modal-field">
                  <span>激励金额（¥）</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={form.incentive}
                    onChange={(e) => updateForm("incentive", e.target.value)}
                    disabled={saving}
                  />
                </label>
              </div>

              <label className="banner-toggle">
                <input
                  type="checkbox"
                  checked={form.recommended}
                  onChange={(e) => updateForm("recommended", e.target.checked)}
                  disabled={saving}
                />
                <span>推荐位</span>
              </label>
              <label className="banner-toggle">
                <input
                  type="checkbox"
                  checked={form.sponsored}
                  onChange={(e) => updateForm("sponsored", e.target.checked)}
                  disabled={saving}
                />
                <span>赞助工具（展示激励）</span>
              </label>
              <label className="banner-toggle">
                <input
                  type="checkbox"
                  checked={form.enabled !== false}
                  onChange={(e) => updateForm("enabled", e.target.checked)}
                  disabled={saving}
                />
                <span>启用</span>
              </label>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="modal-btn secondary"
                onClick={() => !saving && setModalOpen(false)}
                disabled={saving}
              >
                取消
              </button>
              <button type="submit" className="modal-btn primary" disabled={saving}>
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
