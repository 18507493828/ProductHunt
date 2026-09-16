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
    deployId: "",
    recommended: false,
    sponsored: false,
    incentive: 0,
    enabled: true,
    sort,
  };
}

function emptyDeploy(sort = 1) {
  return {
    id: "",
    name: "",
    emoji: "☁️",
    desc: "",
    url: "",
    promo: "",
    promoDesc: "",
    enabled: true,
    sort,
  };
}

export default function BuildTools() {
  const [scenes, setScenes] = useState([]);
  const [tools, setTools] = useState([]);
  const [deploys, setDeploys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [form, setForm] = useState(emptyTool());
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [editingDeployIndex, setEditingDeployIndex] = useState(-1);
  const [deployForm, setDeployForm] = useState(emptyDeploy());

  async function load() {
    try {
      setLoading(true);
      setError("");
      const data = await fetchAdminBuildConfig();
      setScenes(Array.isArray(data?.scenes) ? data.scenes : []);
      setTools(Array.isArray(data?.tools) ? data.tools : []);
      setDeploys(Array.isArray(data?.deploys) ? data.deploys : []);
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

  function openDeployModal(deploy = null, index = -1) {
    setEditingDeployIndex(index);
    setDeployForm(
      deploy
        ? { ...emptyDeploy(), ...deploy }
        : emptyDeploy(deploys.length + 1),
    );
    setMessage("");
    setError("");
    setDeployModalOpen(true);
  }

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateDeployForm(key, value) {
    setDeployForm((prev) => ({ ...prev, [key]: value }));
  }

  async function persist({ nextTools, nextDeploys, successMsg }) {
    const result = await updateAdminBuildConfig({
      scenes,
      tools: nextTools ?? tools,
      deploys: nextDeploys ?? deploys,
    });
    setScenes(result.config?.scenes || scenes);
    setTools(result.config?.tools || nextTools || tools);
    setDeploys(result.config?.deploys || nextDeploys || deploys);
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
      deployId: String(form.deployId || "").trim(),
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
      await persist({
        nextTools: next,
        successMsg: editingIndex >= 0 ? "工具已更新" : "工具已新增",
      });
      setModalOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeploySubmit(e) {
    e.preventDefault();
    const name = deployForm.name.trim();
    if (!name) {
      setError("请填写云厂商名称");
      return;
    }
    const nextDeploy = {
      ...deployForm,
      id: deployForm.id || undefined,
      name,
      emoji: deployForm.emoji || "☁️",
      desc: String(deployForm.desc || "").trim(),
      url: String(deployForm.url || "").trim(),
      promo: String(deployForm.promo || "").trim(),
      promoDesc: String(deployForm.promoDesc || "").trim(),
      enabled: deployForm.enabled !== false,
      sort: Number(deployForm.sort) || deploys.length + 1,
    };

    try {
      setSaving(true);
      setError("");
      const next = [...deploys];
      if (editingDeployIndex >= 0) next[editingDeployIndex] = nextDeploy;
      else next.push(nextDeploy);
      await persist({
        nextDeploys: next,
        successMsg:
          editingDeployIndex >= 0 ? "云部署激励已更新" : "云厂商已新增",
      });
      setDeployModalOpen(false);
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
      await persist({ nextTools: next, successMsg: "显示状态已更新" });
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleDeployEnabled(index) {
    try {
      setError("");
      const next = deploys.map((d, i) =>
        i === index ? { ...d, enabled: !(d.enabled !== false) } : d,
      );
      await persist({ nextDeploys: next, successMsg: "云部署显示状态已更新" });
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(index, name) {
    if (!window.confirm(`确定删除构建工具「${name}」？`)) return;
    try {
      setError("");
      await persist({
        nextTools: tools.filter((_, i) => i !== index),
        successMsg: "工具已删除",
      });
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeployDelete(index, name) {
    if (!window.confirm(`确定删除云厂商「${name}」？`)) return;
    try {
      setError("");
      await persist({
        nextDeploys: deploys.filter((_, i) => i !== index),
        successMsg: "云厂商已删除",
      });
    } catch (err) {
      setError(err.message);
    }
  }

  const deployNameById = Object.fromEntries(
    deploys.map((d) => [d.id, d.name]),
  );

  return (
    <>
      <div className="admin-toolbar">
        <button type="button" className="add-banner-btn" onClick={() => openModal()}>
          新增工具
        </button>
        <button
          type="button"
          className="add-banner-btn"
          onClick={() => openDeployModal()}
        >
          新增云厂商
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {message && <div className="admin-success">{message}</div>}

      {loading ? (
        <div className="dash-loading">加载中...</div>
      ) : (
        <>
          <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>构建工具</h3>
          {tools.length === 0 ? (
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
                    {tool.deployId
                      ? ` · 绑定云：${deployNameById[tool.deployId] || tool.deployId}`
                      : ""}
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

          <h3 style={{ margin: "28px 0 8px", fontSize: 16 }}>
            云部署激励
          </h3>
          <p className="admin-hint" style={{ marginBottom: 12 }}>
            配置前台「我要构建 → 云部署」卡片角标与说明文案（如限时免费、限时5折）
          </p>
          {deploys.length === 0 ? (
            <EmptyState title="还没有云厂商" />
          ) : (
            <div className="admin-masonry">
              {deploys.map((deploy, index) => (
                <article
                  key={deploy.id || deploy.name}
                  className={
                    "admin-masonry-card" +
                    (deploy.enabled !== false ? "" : " is-off")
                  }
                >
                  <div className="admin-masonry-card-top">
                    <span
                      className={
                        "status-badge " +
                        (deploy.enabled !== false
                          ? "status-approved"
                          : "status-rejected")
                      }
                    >
                      {deploy.enabled !== false ? "启用中" : "已停用"}
                    </span>
                    {deploy.promo ? (
                      <span className="status-badge status-pending">
                        {deploy.promo}
                      </span>
                    ) : null}
                  </div>
                  <h2 className="admin-masonry-title">
                    <span aria-hidden>{deploy.emoji || "☁️"}</span> {deploy.name}
                  </h2>
                  <p className="admin-masonry-id">{deploy.id}</p>
                  <p className="admin-hint">{deploy.desc || "暂无描述"}</p>
                  <p className="admin-hint">
                    激励角标：{deploy.promo || "（无）"}
                  </p>
                  {deploy.promoDesc ? (
                    <p className="admin-hint">{deploy.promoDesc}</p>
                  ) : null}
                  <div className="admin-masonry-actions">
                    <button
                      type="button"
                      className="admin-btn admin-btn-primary"
                      onClick={() => openDeployModal(deploy, index)}
                    >
                      编辑激励
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn-ghost"
                      onClick={() => toggleDeployEnabled(index)}
                    >
                      {deploy.enabled !== false ? "停用" : "启用"}
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn-danger"
                      onClick={() => handleDeployDelete(index, deploy.name)}
                    >
                      删除
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
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

              <label className="modal-field">
                <span>绑定云部署</span>
                <select
                  value={form.deployId || ""}
                  onChange={(e) => updateForm("deployId", e.target.value)}
                  disabled={saving}
                >
                  <option value="">不绑定</option>
                  {deploys.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.emoji} {d.name}
                      {d.promo ? `（${d.promo}）` : ""}
                    </option>
                  ))}
                </select>
              </label>

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

      {deployModalOpen && (
        <div className="modal-overlay">
          <form className="modal-card" onSubmit={handleDeploySubmit}>
            <div className="modal-header">
              <div>
                <p className="modal-eyebrow">云部署激励</p>
                <h2>
                  {editingDeployIndex >= 0 ? "编辑云厂商" : "新增云厂商"}
                </h2>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => !saving && setDeployModalOpen(false)}
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
                    value={deployForm.emoji}
                    onChange={(e) => updateDeployForm("emoji", e.target.value)}
                    maxLength={4}
                    disabled={saving}
                  />
                </label>
                <label className="modal-field">
                  <span>云厂商名称 *</span>
                  <input
                    value={deployForm.name}
                    onChange={(e) => updateDeployForm("name", e.target.value)}
                    required
                    disabled={saving}
                  />
                </label>
                <label className="modal-field">
                  <span>排序</span>
                  <input
                    type="number"
                    value={deployForm.sort}
                    onChange={(e) => updateDeployForm("sort", e.target.value)}
                    disabled={saving}
                  />
                </label>
              </div>

              <label className="modal-field">
                <span>简介</span>
                <textarea
                  value={deployForm.desc}
                  onChange={(e) => updateDeployForm("desc", e.target.value)}
                  rows={2}
                  disabled={saving}
                />
              </label>

              <label className="modal-field">
                <span>云部署链接</span>
                <input
                  value={deployForm.url}
                  onChange={(e) => updateDeployForm("url", e.target.value)}
                  placeholder="https://"
                  disabled={saving}
                />
              </label>

              <div className="admin-topic-form-row">
                <label className="modal-field">
                  <span>激励角标</span>
                  <input
                    value={deployForm.promo}
                    onChange={(e) => updateDeployForm("promo", e.target.value)}
                    placeholder="例如：限时免费 / 限时5折"
                    maxLength={16}
                    disabled={saving}
                  />
                </label>
              </div>

              <label className="modal-field">
                <span>激励说明</span>
                <textarea
                  value={deployForm.promoDesc}
                  onChange={(e) =>
                    updateDeployForm("promoDesc", e.target.value)
                  }
                  rows={3}
                  placeholder="展示在选中卡片下方的详细说明"
                  disabled={saving}
                />
              </label>

              <label className="banner-toggle">
                <input
                  type="checkbox"
                  checked={deployForm.enabled !== false}
                  onChange={(e) =>
                    updateDeployForm("enabled", e.target.checked)
                  }
                  disabled={saving}
                />
                <span>启用（前台云部署步骤可见）</span>
              </label>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="modal-btn secondary"
                onClick={() => !saving && setDeployModalOpen(false)}
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
