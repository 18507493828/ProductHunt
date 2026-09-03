import { useEffect, useState } from "react";
import EmptyState from "../../components/EmptyState";
import {
  createCampaign,
  deleteCampaign,
  fetchAdminCampaigns,
  updateCampaign,
} from "../../api";

const EMPTY_FORM = {
  title: "",
  rankLabel: "",
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

  async function handleSubmit(e) {
    e.preventDefault();
    const title = form.title.trim();
    const rankLabel = form.rankLabel.trim();
    if (!title) {
      setError("请填写活动名称");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const payload = {
        title,
        rankLabel: rankLabel || title,
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
        title: campaign.title,
        rankLabel: campaign.rankLabel,
        sort: campaign.sort,
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
          配置首页活动分区与热门榜单活动入口。当前先全部展示。
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
                      (campaign.enabled !== false ? "status-approved" : "status-rejected")
                    }
                  >
                    {campaign.enabled !== false ? "展示中" : "已隐藏"}
                  </span>
                </div>
                <div className="admin-meta">
                  <span>ID：{campaign.id}</span>
                  <span>榜单名：{campaign.rankLabel || campaign.title}</span>
                  <span>排序：{campaign.sort ?? 0}</span>
                </div>
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
        <div className="modal-overlay" onClick={() => !saving && setModalOpen(false)}>
          <form
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
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
