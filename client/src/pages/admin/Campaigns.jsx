import { useEffect, useState } from "react";
import { Upload } from "lucide-react";
import EmptyState from "../../components/EmptyState";
import {
  createCampaign,
  deleteCampaign,
  fetchAdminCampaigns,
  updateCampaign,
  uploadImage,
} from "../../api";

const EMPTY_FORM = {
  title: "",
  rankLabel: "",
  description: "",
  coverImage: "",
  timeText: "",
  rules: "",
  rewards: "",
  sort: 0,
  enabled: true,
};

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  async function loadCampaigns() {
    try {
      setError("");
      const list = await fetchAdminCampaigns();
      setCampaigns(list);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadCampaigns();
  }, []);

  function openModal(campaign = null) {
    setEditingId(campaign ? campaign.id : null);
    setForm(
      campaign
        ? {
            title: campaign.title || "",
            rankLabel: campaign.rankLabel || "",
            description: campaign.description || "",
            coverImage: campaign.coverImage || "",
            timeText: campaign.timeText || "",
            rules: campaign.rules || "",
            rewards: campaign.rewards || "",
            sort: campaign.sort ?? 0,
            enabled: campaign.enabled !== false,
          }
        : EMPTY_FORM,
    );
    setError("");
    setModalOpen(true);
  }

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCoverUpload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setCoverUploading(true);
      setError("");
      const { url } = await uploadImage(file);
      updateForm("coverImage", url);
    } catch (err) {
      setError(err.message || "封面上传失败");
    } finally {
      setCoverUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) {
      setError("请填写活动名称");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const payload = {
        title,
        rankLabel: form.rankLabel.trim() || title,
        description: form.description.trim(),
        coverImage: form.coverImage.trim(),
        timeText: form.timeText.trim(),
        rules: form.rules.trim(),
        rewards: form.rewards.trim(),
        sort: Number(form.sort) || 0,
        enabled: form.enabled !== false,
      };
      if (editingId) {
        await updateCampaign(editingId, payload);
      } else {
        await createCampaign(payload);
      }
      setModalOpen(false);
      await loadCampaigns();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`确定删除活动「${title}」吗？`)) return;
    try {
      setActionId(id);
      setError("");
      await deleteCampaign(id);
      await loadCampaigns();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId("");
    }
  }

  async function toggleEnabled(campaign) {
    try {
      setActionId(campaign.id);
      setError("");
      await updateCampaign(campaign.id, {
        ...campaign,
        enabled: !(campaign.enabled !== false),
      });
      await loadCampaigns();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId("");
    }
  }

  return (
    <>
      <div className="admin-toolbar">
        <p className="admin-toolbar-hint">
          配置活动封面、时间/规则/奖励与首页「活动专区」入口，作品按活动聚合展示。
        </p>
        <button type="button" className="add-banner-btn" onClick={() => openModal()}>
          新增活动
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {campaigns.length === 0 ? (
        <EmptyState title="还没有活动配置" />
      ) : (
        <div className="admin-list">
          {campaigns.map((campaign) => (
            <article className="admin-item" key={campaign.id}>
              <div className="admin-item-main">
                <div className="admin-item-top">
                  <h2>{campaign.title}</h2>
                  <span
                    className={
                      "status-badge " +
                      (campaign.enabled !== false
                        ? "status-approved"
                        : "status-rejected")
                    }
                  >
                    {campaign.enabled !== false ? "展示中" : "已隐藏"}
                  </span>
                </div>
                <div className="admin-meta">
                  <span>ID：{campaign.id}</span>
                  <span>榜单名：{campaign.rankLabel || campaign.title}</span>
                  <span>排序：{campaign.sort ?? 0}</span>
                  {campaign.timeText && <span>时间：{campaign.timeText}</span>}
                  <span>作品：{campaign.productCount ?? 0}</span>
                  <span>已上架：{campaign.approvedCount ?? 0}</span>
                  <span>待审：{campaign.pendingCount ?? 0}</span>
                  <span>参与人：{campaign.participantCount ?? 0}</span>
                  <span>评分：{campaign.voteCount ?? 0}</span>
                </div>
                {campaign.description && (
                  <p className="admin-item-desc">{campaign.description}</p>
                )}
              </div>
              <div className="admin-actions">
                <button
                  type="button"
                  className="approve-btn"
                  disabled={actionId === campaign.id}
                  onClick={() => openModal(campaign)}
                >
                  编辑
                </button>
                <button
                  type="button"
                  className={
                    campaign.enabled !== false ? "special-btn off" : "special-btn"
                  }
                  disabled={actionId === campaign.id}
                  onClick={() => toggleEnabled(campaign)}
                >
                  {campaign.enabled !== false ? "隐藏" : "展示"}
                </button>
                <button
                  type="button"
                  className="delete-btn"
                  disabled={actionId === campaign.id}
                  onClick={() => handleDelete(campaign.id, campaign.title)}
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
          <form
            className="modal-card modal-card-wide"
            onSubmit={handleSubmit}
          >
            <div className="modal-header">
              <div>
                <p className="modal-eyebrow">活动</p>
                <h2>{editingId ? "编辑活动" : "新增活动"}</h2>
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
              <label className="modal-field">
                <span>活动名称 *</span>
                <input
                  value={form.title}
                  onChange={(e) => updateForm("title", e.target.value)}
                  placeholder="例如：码道创作活动"
                  maxLength={40}
                  required
                />
              </label>
              <label className="modal-field">
                <span>榜单简称</span>
                <input
                  value={form.rankLabel}
                  onChange={(e) => updateForm("rankLabel", e.target.value)}
                  placeholder="例如：码道活动"
                  maxLength={20}
                />
              </label>
              <label className="modal-field">
                <span>活动介绍</span>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                  placeholder="一句话说明活动目的与参与方式"
                  maxLength={300}
                />
              </label>
              <label className="modal-field">
                <span>活动时间</span>
                <input
                  value={form.timeText}
                  onChange={(e) => updateForm("timeText", e.target.value)}
                  placeholder="例如：2026.09.01 - 2026.10.24"
                  maxLength={80}
                />
              </label>
              <label className="modal-field">
                <span>活动规则</span>
                <textarea
                  rows={4}
                  value={form.rules}
                  onChange={(e) => updateForm("rules", e.target.value)}
                  placeholder="参与条件、提交要求、禁止事项等"
                  maxLength={1200}
                />
              </label>
              <label className="modal-field">
                <span>活动奖励</span>
                <textarea
                  rows={3}
                  value={form.rewards}
                  onChange={(e) => updateForm("rewards", e.target.value)}
                  placeholder="曝光、礼品、证书等奖励说明"
                  maxLength={600}
                />
              </label>
              <div className="modal-field">
                <span>活动封面</span>
                <div className="banner-upload">
                  {form.coverImage ? (
                    <div className="banner-upload-preview">
                      <img src={form.coverImage} alt="活动封面预览" />
                      <button
                        type="button"
                        className="ph-upload-remove"
                        onClick={() => updateForm("coverImage", "")}
                        aria-label="移除封面"
                        title="移除封面"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <label
                      className={
                        coverUploading
                          ? "ph-upload-trigger uploading"
                          : "ph-upload-trigger"
                      }
                    >
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleCoverUpload}
                        disabled={coverUploading || saving}
                        hidden
                      />
                      <Upload
                        className="ph-upload-icon"
                        size={26}
                        aria-hidden="true"
                      />
                      <span className="ph-upload-text">
                        {coverUploading ? "上传中..." : "点击上传封面"}
                      </span>
                      <span className="ph-upload-sub">
                        JPG / PNG / GIF / WebP，建议横图
                      </span>
                    </label>
                  )}
                </div>
                <input
                  value={form.coverImage}
                  onChange={(e) => updateForm("coverImage", e.target.value)}
                  placeholder="或粘贴封面图片 URL"
                />
              </div>
              <label className="modal-field">
                <span>排序</span>
                <input
                  type="number"
                  value={form.sort}
                  onChange={(e) => updateForm("sort", e.target.value)}
                />
              </label>
              <label className="banner-toggle">
                <input
                  type="checkbox"
                  checked={form.enabled !== false}
                  onChange={(e) => updateForm("enabled", e.target.checked)}
                />
                <span>启用展示</span>
              </label>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="modal-btn secondary"
                disabled={saving}
                onClick={() => setModalOpen(false)}
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
