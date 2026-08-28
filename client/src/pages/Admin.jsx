import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  approveProduct,
  createBanner,
  createNav,
  deleteBanner,
  deleteNav,
  deleteProduct,
  fetchAdminBanners,
  fetchAdminNavs,
  fetchAdminProducts,
  rejectProduct,
  reorderNavs,
  updateBanner,
  updateNav,
  uploadImage,
} from "../api";
import "../App.css";
import { useAuth } from "../AuthContext";

const STATUS_TABS = [
  { key: "pending", label: "待审核" },
  { key: "approved", label: "已上架" },
  { key: "rejected", label: "已拒绝" },
  { key: "all", label: "全部" },
];

const STATUS_LABEL = {
  pending: "待审核",
  approved: "已上架",
  rejected: "已拒绝",
};

const EMPTY_BANNER_FORM = {
  title: "",
  subtitle: "",
  imageUrl: "",
  linkUrl: "",
  sort: 0,
  enabled: true,
};

const EMPTY_NAV_FORM = {
  title: "",
  url: "",
  enabled: true,
};

export default function Admin() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [adminView, setAdminView] = useState("products");
  const [activeStatus, setActiveStatus] = useState("pending");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");

  // 轮播图管理状态
  const [banners, setBanners] = useState([]);
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState(null);
  const [bannerForm, setBannerForm] = useState(EMPTY_BANNER_FORM);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerSaving, setBannerSaving] = useState(false);

  // 导航管理状态
  const [navs, setNavs] = useState([]);
  const [navModalOpen, setNavModalOpen] = useState(false);
  const [editingNavId, setEditingNavId] = useState(null);
  const [navForm, setNavForm] = useState(EMPTY_NAV_FORM);
  const [navSaving, setNavSaving] = useState(false);

  async function loadProducts(status = activeStatus) {
    try {
      setLoading(true);
      setError("");
      const list = await fetchAdminProducts(status);
      setProducts(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin && adminView === "products") {
      loadProducts(activeStatus);
    }
  }, [activeStatus, isAdmin, adminView]);

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
    if (isAdmin && adminView === "banners") {
      loadBanners();
    }
  }, [adminView, isAdmin]);

  async function handleApprove(id) {
    try {
      setActionId(id);
      setError("");
      await approveProduct(id);
      await loadProducts(activeStatus);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId("");
    }
  }

  async function handleReject(id) {
    const reason = window.prompt("拒绝原因（可选）") || "";
    try {
      setActionId(id);
      setError("");
      await rejectProduct(id, reason);
      await loadProducts(activeStatus);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId("");
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`确定删除产品「${name}」吗？此操作不可恢复。`)) return;

    try {
      setActionId(id);
      setError("");
      await deleteProduct(id);
      await loadProducts(activeStatus);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId("");
    }
  }

  /* ---------- 轮播图操作 ---------- */

  function openBannerModal(banner = null) {
    setEditingBannerId(banner ? banner.id : null);
    setBannerForm(
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
    setBannerModalOpen(true);
  }

  function updateBannerForm(key, value) {
    setBannerForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleBannerImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setBannerUploading(true);
      setError("");
      const { url } = await uploadImage(file);
      updateBannerForm("imageUrl", url);
    } catch (err) {
      setError(err.message);
    } finally {
      setBannerUploading(false);
      e.target.value = "";
    }
  }

  async function handleBannerSubmit(e) {
    e.preventDefault();
    const { title, subtitle, imageUrl, linkUrl, sort, enabled } = bannerForm;

    if (!title.trim()) {
      setError("请填写轮播图标题");
      return;
    }
    if (!imageUrl.trim()) {
      setError("请选择或填写图片地址");
      return;
    }

    try {
      setBannerSaving(true);
      setError("");
      const payload = {
        title,
        subtitle,
        imageUrl,
        linkUrl,
        sort: Number(sort) || 0,
        enabled,
      };
      if (editingBannerId) {
        await updateBanner(editingBannerId, payload);
      } else {
        await createBanner(payload);
      }
      setBannerModalOpen(false);
      await loadBanners();
    } catch (err) {
      setError(err.message);
    } finally {
      setBannerSaving(false);
    }
  }

  async function handleBannerDelete(id, title) {
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

  async function handleBannerToggle(banner) {
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

  /* ---------- 导航操作 ---------- */

  async function loadNavs() {
    try {
      setError("");
      const list = await fetchAdminNavs();
      setNavs(list);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (isAdmin && adminView === "navs") {
      loadNavs();
    }
  }, [adminView, isAdmin]);

  function openNavModal(nav = null) {
    setEditingNavId(nav ? nav.id : null);
    setNavForm(
      nav
        ? {
            title: nav.title || "",
            url: nav.url || "",
            enabled: nav.enabled !== false,
          }
        : EMPTY_NAV_FORM
    );
    setError("");
    setNavModalOpen(true);
  }

  function updateNavForm(key, value) {
    setNavForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleNavSubmit(e) {
    e.preventDefault();
    const { title, url, enabled } = navForm;

    if (!title.trim()) {
      setError("请填写导航名称");
      return;
    }
    if (!/^https?:\/\/.+/i.test(url.trim())) {
      setError("链接需以 http:// 或 https:// 开头");
      return;
    }

    try {
      setNavSaving(true);
      setError("");
      const payload = { title, url, enabled };
      if (editingNavId) {
        await updateNav(editingNavId, payload);
      } else {
        await createNav(payload);
      }
      setNavModalOpen(false);
      await loadNavs();
    } catch (err) {
      setError(err.message);
    } finally {
      setNavSaving(false);
    }
  }

  async function handleNavDelete(id, title) {
    if (!window.confirm(`确定删除导航「${title}」吗？`)) return;
    try {
      setActionId(id);
      setError("");
      await deleteNav(id);
      await loadNavs();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId("");
    }
  }

  async function handleNavToggle(nav) {
    try {
      setActionId(nav.id);
      setError("");
      await updateNav(nav.id, { enabled: !nav.enabled });
      await loadNavs();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId("");
    }
  }

  async function handleNavMove(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= navs.length) return;
    const next = [...navs];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    try {
      setError("");
      await reorderNavs(next.map((nav) => nav.id));
      await loadNavs();
    } catch (err) {
      setError(err.message);
      await loadNavs();
    }
  }

  if (authLoading) {
    return <div className="auth-page">加载中...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>无权限</h1>
          <p className="auth-tip">需要管理员账号才能访问后台</p>
          <Link to="/" className="auth-submit-link">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="ph-page">
      <div className="admin-page">
        <header className="admin-header">
          <div>
            <p className="eyebrow">管理</p>
            <h1>产品审核后台</h1>
            <p className="subtitle">管理员：{user.username}</p>
          </div>
          <Link to="/" className="admin-back">
            返回首页
          </Link>
        </header>

        <div className="admin-container">
          <div className="tabs">
            <button
              type="button"
              className={adminView === "products" ? "tab active" : "tab"}
              onClick={() => setAdminView("products")}
            >
              产品审核
            </button>
            <button
              type="button"
              className={adminView === "banners" ? "tab active" : "tab"}
              onClick={() => setAdminView("banners")}
            >
              轮播图管理
            </button>
            <button
              type="button"
              className={adminView === "navs" ? "tab active" : "tab"}
              onClick={() => setAdminView("navs")}
            >
              导航管理
            </button>
          </div>

          {adminView === "products" ? (
            <>
              <div className="tabs">
                {STATUS_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={activeStatus === tab.key ? "tab active" : "tab"}
                    onClick={() => setActiveStatus(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {error && <div className="error">{error}</div>}

              {loading ? (
                <div className="admin-empty">加载中...</div>
              ) : products.length === 0 ? (
                <div className="admin-empty">当前状态下没有产品</div>
              ) : (
                <div className="admin-list">
                  {products.map((product) => (
                    <article className="admin-item" key={product.id}>
                      <div className="admin-item-main">
                        <div className="admin-item-top">
                          <h2>{product.name}</h2>
                          <span
                            className={`status-badge status-${product.status}`}
                          >
                            {STATUS_LABEL[product.status] || product.status}
                          </span>
                        </div>
                        <p>
                          {product.tagline}
                          {product.description
                            ? ` —— ${product.description}`
                            : ""}
                        </p>
                        <div className="admin-meta">
                          <span>分类：{product.category}</span>
                          <span>提交者：{product.submittedBy || "未知"}</span>
                          <span>{product.voteCount ?? 0} 票</span>
                          {product.url && (
                            <a
                              href={product.url}
                              target="_blank"
                              rel="noreferrer noopener"
                            >
                              产品链接
                            </a>
                          )}
                          {product.rejectReason && (
                            <span>拒绝原因：{product.rejectReason}</span>
                          )}
                        </div>
                      </div>
                      <div className="admin-actions">
                        {product.status === "pending" && (
                          <>
                            <button
                              type="button"
                              className="approve-btn"
                              disabled={actionId === product.id}
                              onClick={() => handleApprove(product.id)}
                            >
                              通过上架
                            </button>
                            <button
                              type="button"
                              className="reject-btn"
                              disabled={actionId === product.id}
                              onClick={() => handleReject(product.id)}
                            >
                              拒绝
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          className="delete-btn"
                          disabled={actionId === product.id}
                          onClick={() => handleDelete(product.id, product.name)}
                        >
                          删除
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          ) : adminView === "banners" ? (
            <>
              <div className="admin-toolbar">
                <span className="admin-toolbar-hint">
                  首页轮播图会按排序值从小到大展示，共 {banners.length} 张
                </span>
                <button
                  type="button"
                  className="add-banner-btn"
                  onClick={() => openBannerModal()}
                >
                  + 新增轮播图
                </button>
              </div>

              {error && <div className="error">{error}</div>}

              {banners.length === 0 ? (
                <div className="admin-empty">
                  还没有轮播图，点击「新增轮播图」创建第一张
                </div>
              ) : (
                <div className="admin-list">
                  {banners.map((banner) => (
                    <article className="admin-item banner-item" key={banner.id}>
                      <div className="banner-thumb">
                        {banner.imageUrl ? (
                          <img src={banner.imageUrl} alt={banner.title} />
                        ) : (
                          <span>无图</span>
                        )}
                      </div>
                      <div className="admin-item-main">
                        <div className="admin-item-top">
                          <h2>{banner.title}</h2>
                          <span
                            className={
                              banner.enabled
                                ? "status-badge status-approved"
                                : "status-badge status-rejected"
                            }
                          >
                            {banner.enabled ? "启用中" : "已停用"}
                          </span>
                        </div>
                        {banner.subtitle && (
                          <p>{banner.subtitle}</p>
                        )}
                        <div className="admin-meta">
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
                          <span>图片：{banner.imageUrl}</span>
                        </div>
                      </div>
                      <div className="admin-actions">
                        <button
                          type="button"
                          className="approve-btn"
                          disabled={actionId === banner.id}
                          onClick={() => handleBannerToggle(banner)}
                        >
                          {banner.enabled ? "停用" : "启用"}
                        </button>
                        <button
                          type="button"
                          className="edit-btn"
                          disabled={actionId === banner.id}
                          onClick={() => openBannerModal(banner)}
                        >
                          编辑
                        </button>
                        <button
                          type="button"
                          className="delete-btn"
                          disabled={actionId === banner.id}
                          onClick={() =>
                            handleBannerDelete(banner.id, banner.title)
                          }
                        >
                          删除
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="admin-toolbar">
                <span className="admin-toolbar-hint">
                  顶部导航会按顺序展示在 Logo 右侧，共 {navs.length} 个
                </span>
                <button
                  type="button"
                  className="add-banner-btn"
                  onClick={() => openNavModal()}
                >
                  + 新增导航
                </button>
              </div>

              {error && <div className="error">{error}</div>}

              {navs.length === 0 ? (
                <div className="admin-empty">
                  还没有导航，点击「新增导航」创建第一个
                </div>
              ) : (
                <div className="admin-list">
                  {navs.map((nav, index) => (
                    <article className="admin-item nav-item" key={nav.id}>
                      <div className="admin-item-main">
                        <div className="admin-item-top">
                          <h2>{nav.title}</h2>
                          <span
                            className={
                              nav.enabled
                                ? "status-badge status-approved"
                                : "status-badge status-rejected"
                            }
                          >
                            {nav.enabled ? "展示中" : "已停用"}
                          </span>
                        </div>
                        <div className="admin-meta">
                          <span>顺序：第 {index + 1} 位</span>
                          <a
                            href={nav.url}
                            target="_blank"
                            rel="noreferrer noopener"
                          >
                            {nav.url}
                          </a>
                        </div>
                      </div>
                      <div className="admin-actions">
                        <button
                          type="button"
                          className="move-btn"
                          disabled={index === 0 || actionId === nav.id}
                          onClick={() => handleNavMove(index, -1)}
                          title="上移"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="move-btn"
                          disabled={
                            index === navs.length - 1 || actionId === nav.id
                          }
                          onClick={() => handleNavMove(index, 1)}
                          title="下移"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className="approve-btn"
                          disabled={actionId === nav.id}
                          onClick={() => handleNavToggle(nav)}
                        >
                          {nav.enabled ? "停用" : "启用"}
                        </button>
                        <button
                          type="button"
                          className="edit-btn"
                          disabled={actionId === nav.id}
                          onClick={() => openNavModal(nav)}
                        >
                          编辑
                        </button>
                        <button
                          type="button"
                          className="delete-btn"
                          disabled={actionId === nav.id}
                          onClick={() => handleNavDelete(nav.id, nav.title)}
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
        </div>
      </div>

      {/* 导航新增/编辑弹窗 */}
      {navModalOpen && (
        <div className="modal-overlay">
          <form className="modal" onSubmit={handleNavSubmit}>
            <div className="modal-header">
              <div>
                <p className="modal-eyebrow">导航管理</p>
                <h2>{editingNavId ? "编辑导航" : "新增导航"}</h2>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setNavModalOpen(false)}
                aria-label="关闭"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-field">
                <span>导航名称 *</span>
                <input
                  type="text"
                  value={navForm.title}
                  onChange={(e) => updateNavForm("title", e.target.value)}
                  placeholder="例如：码道官方网站"
                  maxLength={30}
                />
              </div>

              <div className="modal-field">
                <span>链接地址 *</span>
                <input
                  type="text"
                  value={navForm.url}
                  onChange={(e) => updateNavForm("url", e.target.value)}
                  placeholder="https://...（点击导航打开的链接）"
                />
              </div>

              <div className="modal-field">
                <span>状态</span>
                <label className="banner-toggle">
                  <input
                    type="checkbox"
                    checked={navForm.enabled}
                    onChange={(e) =>
                      updateNavForm("enabled", e.target.checked)
                    }
                  />
                  <span>
                    {navForm.enabled ? "启用（展示在顶部导航栏）" : "停用"}
                  </span>
                </label>
              </div>

              {error && <div className="modal-error">{error}</div>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-btn secondary"
                  onClick={() => setNavModalOpen(false)}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="modal-btn primary"
                  disabled={navSaving}
                >
                  {navSaving
                    ? "保存中..."
                    : editingNavId
                      ? "保存修改"
                      : "添加导航"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* 轮播图新增/编辑弹窗 */}
      {bannerModalOpen && (
        <div className="modal-overlay">
          <form className="modal" onSubmit={handleBannerSubmit}>
            <div className="modal-header">
              <div>
                <p className="modal-eyebrow">轮播图管理</p>
                <h2>{editingBannerId ? "编辑轮播图" : "新增轮播图"}</h2>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setBannerModalOpen(false)}
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
                  value={bannerForm.title}
                  onChange={(e) => updateBannerForm("title", e.target.value)}
                  placeholder="例如：AI 工具专区"
                  maxLength={40}
                />
              </div>

              <div className="modal-field">
                <span>副标题</span>
                <input
                  type="text"
                  value={bannerForm.subtitle}
                  onChange={(e) =>
                    updateBannerForm("subtitle", e.target.value)
                  }
                  placeholder="一句话介绍（选填）"
                  maxLength={80}
                />
              </div>

              <div className="modal-field">
                <span>图片 *</span>
                <div className="banner-upload">
                  {bannerForm.imageUrl ? (
                    <div className="banner-upload-preview">
                      <img src={bannerForm.imageUrl} alt="轮播图预览" />
                      <button
                        type="button"
                        className="ph-upload-remove"
                        onClick={() => updateBannerForm("imageUrl", "")}
                        aria-label="移除图片"
                        title="移除图片"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <label
                      className={
                        bannerUploading
                          ? "ph-upload-trigger uploading"
                          : "ph-upload-trigger"
                      }
                    >
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleBannerImageChange}
                        disabled={bannerSaving || bannerUploading}
                        hidden
                      />
                      <span className="ph-upload-text">
                        {bannerUploading ? "上传中..." : "点击上传图片"}
                      </span>
                      <span className="ph-upload-sub">
                        JPG / PNG / GIF / WebP，不超过 2MB
                      </span>
                    </label>
                  )}
                </div>
                <input
                  type="text"
                  value={bannerForm.imageUrl}
                  onChange={(e) =>
                    updateBannerForm("imageUrl", e.target.value)
                  }
                  placeholder="或直接粘贴图片地址（/banners/xxx.png 或 https://...）"
                />
              </div>

              <div className="modal-field">
                <span>跳转链接</span>
                <input
                  type="text"
                  value={bannerForm.linkUrl}
                  onChange={(e) => updateBannerForm("linkUrl", e.target.value)}
                  placeholder="https://... （点击轮播图时打开的链接，选填）"
                />
              </div>

              <div className="modal-row">
                <div className="modal-field">
                  <span>排序值</span>
                  <input
                    type="number"
                    value={bannerForm.sort}
                    onChange={(e) =>
                      updateBannerForm("sort", e.target.value)
                    }
                    placeholder="数字越小越靠前"
                  />
                </div>
                <div className="modal-field">
                  <span>状态</span>
                  <label className="banner-toggle">
                    <input
                      type="checkbox"
                      checked={bannerForm.enabled}
                      onChange={(e) =>
                        updateBannerForm("enabled", e.target.checked)
                      }
                    />
                    <span>
                      {bannerForm.enabled ? "启用（展示在首页）" : "停用"}
                    </span>
                  </label>
                </div>
              </div>

              {error && <div className="modal-error">{error}</div>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-btn secondary"
                  onClick={() => setBannerModalOpen(false)}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="modal-btn primary"
                  disabled={bannerSaving || bannerUploading}
                >
                  {bannerSaving
                    ? "保存中..."
                    : editingBannerId
                      ? "保存修改"
                      : "添加轮播图"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
