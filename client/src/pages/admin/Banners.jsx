import { useEffect, useState } from "react";
import EmptyState from "../../components/EmptyState";
import {
  createBanner,
  deleteBanner,
  fetchAdminBanners,
  updateBanner,
  uploadImage,
} from "../../api";

const EMPTY_BANNER_FORM = {
  title: "",
  subtitle: "",
  imageUrl: "",
  linkUrl: "",
  sort: 0,
  enabled: true,
};

export default function Banners() {
  const [banners, setBanners] = useState([]);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_BANNER_FORM);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function loadBanners() {
    try {
      setError("");
      const list = await fetchAdminBanners();
      setBanners(list);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadBanners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openModal(banner = null) {
    setEditingId(banner ? banner.id : null);
    setForm(
      banner
        ? {
            title: banner.title || "",
            subtitle: banner.subtitle || "",
            imageUrl: banner.imageUrl || "",
            linkUrl: banner.linkUrl || "",
            sort: banner.sort ?? 0,
            enabled: banner.enabled !== false,
          }
        : EMPTY_BANNER_FORM
    );
    setError("");
    setModalOpen(true);
  }

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      setError("");
      const { url } = await uploadImage(file);
      updateForm("imageUrl", url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const { title, subtitle, imageUrl, linkUrl, sort, enabled } = form;

    if (!title.trim()) {
      setError("请填写轮播图标题");
      return;
    }
    if (!imageUrl.trim()) {
      setError("请选择或填写图片地址");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const payload = {
        title,
        subtitle,
        imageUrl,
        linkUrl,
        sort: Number(sort) || 0,
        enabled,
      };
      if (editingId) {
        await updateBanner(editingId, payload);
      } else {
        await createBanner(payload);
      }
      setModalOpen(false);
      await loadBanners();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`确定删除轮播图「${title}」吗？`)) return;
    try {
      setActionId(id);
      setError("");
      await deleteBanner(id);
      await loadBanners();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId("");
    }
  }

  async function handleToggle(banner) {
    try {
      setActionId(banner.id);
      setError("");
      await updateBanner(banner.id, { enabled: !banner.enabled });
      await loadBanners();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId("");
    }
  }

  return (
    <>
      <div className="admin-toolbar">
        <span className="admin-toolbar-hint">
          首页轮播图会按排序值从小到大展示，共 {banners.length} 张
        </span>
        <button
          type="button"
          className="add-banner-btn"
          onClick={() => openModal()}
        >
          + 新增轮播图
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {banners.length === 0 ? (
        <EmptyState title="还没有轮播图" description="点击「新增轮播图」创建第一张" />
      ) : (
        <div className="ph-card-masonry">
          {banners.map((banner) => (
            <article className="ph-card banner-card" key={banner.id}>
              <div className="ph-card-thumb">
                {banner.imageUrl ? (
                  <img src={banner.imageUrl} alt={banner.title} />
                ) : (
                  <span className="ph-card-thumb-empty">无图</span>
                )}
                <span
                  className={
                    "ph-card-badge " +
                    (banner.enabled ? "on" : "off")
                  }
                >
                  {banner.enabled ? "启用中" : "已停用"}
                </span>
              </div>
              <div className="ph-card-body">
                <h2 className="ph-card-title" title={banner.title}>
                  {banner.title}
                </h2>
                {banner.subtitle && <p className="ph-card-desc">{banner.subtitle}</p>}
                <div className="ph-card-meta">
                  <span>排序：{banner.sort ?? 0}</span>
                  {banner.linkUrl && (
                    <a
                      href={banner.linkUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      跳转链接
                    </a>
                  )}
                </div>
                <div className="ph-card-actions">
                  <button
                    type="button"
                    className={banner.enabled ? "card-btn off" : "card-btn on"}
                    disabled={actionId === banner.id}
                    onClick={() => handleToggle(banner)}
                  >
                    {banner.enabled ? "停用" : "启用"}
                  </button>
                  <button
                    type="button"
                    className="card-btn edit"
                    disabled={actionId === banner.id}
                    onClick={() => openModal(banner)}
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    className="card-btn del"
                    disabled={actionId === banner.id}
                    onClick={() => handleDelete(banner.id, banner.title)}
                  >
                    删除
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay">
          <form className="modal" onSubmit={handleSubmit}>
            <div className="modal-header">
              <div>
                <p className="modal-eyebrow">轮播图管理</p>
                <h2>{editingId ? "编辑轮播图" : "新增轮播图"}</h2>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setModalOpen(false)}
                aria-label="关闭"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-field">
                <span>标题 *</span>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => updateForm("title", e.target.value)}
                  placeholder="例如：AI 工具专区"
                  maxLength={40}
                />
              </div>

              <div className="modal-field">
                <span>副标题</span>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => updateForm("subtitle", e.target.value)}
                  placeholder="一句话介绍（选填）"
                  maxLength={80}
                />
              </div>

              <div className="modal-field">
                <span>图片 *</span>
                <div className="banner-upload">
                  {form.imageUrl ? (
                    <div className="banner-upload-preview">
                      <img src={form.imageUrl} alt="轮播图预览" />
                      <button
                        type="button"
                        className="ph-upload-remove"
                        onClick={() => updateForm("imageUrl", "")}
                        aria-label="移除图片"
                        title="移除图片"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <label
                      className={
                        uploading ? "ph-upload-trigger uploading" : "ph-upload-trigger"
                      }
                    >
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleImageChange}
                        disabled={saving || uploading}
                        hidden
                      />
                      <span className="ph-upload-text">
                        {uploading ? "上传中..." : "点击上传图片"}
                      </span>
                      <span className="ph-upload-sub">
                        JPG / PNG / GIF / WebP，不超过 2MB
                      </span>
                    </label>
                  )}
                </div>
                <input
                  type="text"
                  value={form.imageUrl}
                  onChange={(e) => updateForm("imageUrl", e.target.value)}
                  placeholder="或直接粘贴图片地址（/banners/xxx.png 或 https://...）"
                />
              </div>

              <div className="modal-field">
                <span>跳转链接</span>
                <input
                  type="text"
                  value={form.linkUrl}
                  onChange={(e) => updateForm("linkUrl", e.target.value)}
                  placeholder="https://... （点击轮播图时打开的链接，选填）"
                />
              </div>

              <div className="modal-row">
                <div className="modal-field">
                  <span>排序值</span>
                  <input
                    type="number"
                    value={form.sort}
                    onChange={(e) => updateForm("sort", e.target.value)}
                    placeholder="数字越小越靠前"
                  />
                </div>
                <div className="modal-field">
                  <span>状态</span>
                  <label className="banner-toggle">
                    <input
                      type="checkbox"
                      checked={form.enabled}
                      onChange={(e) => updateForm("enabled", e.target.checked)}
                    />
                    <span>{form.enabled ? "启用（展示在首页）" : "停用"}</span>
                  </label>
                </div>
              </div>

              {error && <div className="modal-error">{error}</div>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-btn secondary"
                  onClick={() => setModalOpen(false)}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="modal-btn primary"
                  disabled={saving || uploading}
                >
                  {saving ? "保存中..." : editingId ? "保存修改" : "添加轮播图"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
