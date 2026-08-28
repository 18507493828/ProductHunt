import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useToast } from "./Toast";
import {
  fetchCategoryOptions,
  fetchMyProducts,
  fetchProducts,
  submitProduct,
  uploadImage,
  voteProduct,
} from "./api";
import MyProductsList from "./components/MyProductsList";
import RankList from "./components/RankList";
import "./App.css";

const RANGE_TABS = [
  { key: "today", label: "今日" },
  { key: "week", label: "周榜" },
  { key: "month", label: "月榜" },
  { key: "all", label: "总榜" },
];

const RANGE_EMPTY_HINT = {
  today: "今天还没有新产品提交，去总榜看看经典作品",
  week: "本周还没有新产品提交，去总榜看看经典作品",
  month: "本月还没有新产品提交，去总榜看看经典作品",
  all: "还没有产品，来提交第一个吧",
};

function getProductInitial(name = "") {
  return (name.trim()[0] || "P").toUpperCase();
}

function formatRelativeTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return date.toLocaleDateString("zh-CN");
}

function VoteButton({ product, onVote, disabled }) {
  return (
    <button
      type="button"
      className={product.votedByMe ? "vote-btn voted" : "vote-btn"}
      onClick={() => onVote(product)}
      disabled={disabled || product.votedByMe}
      aria-label={product.votedByMe ? "已投票" : "投票"}
      title={product.votedByMe ? "已投票" : "为这个产品投票"}
    >
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M10 4l5.5 6.5H13V15a1 1 0 01-1 1H8a1 1 0 01-1-1v-4.5H4.5L10 4z"
          fill="currentColor"
        />
      </svg>
      <span>{product.voteCount ?? 0}</span>
    </button>
  );
}

export default function App() {
  const { user, isAdmin, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(["全部"]);
  const [activeRange, setActiveRange] = useState("all");
  const [activeView, setActiveView] = useState("home");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [votingId, setVotingId] = useState("");

  const [myProducts, setMyProducts] = useState([]);
  const [myLoading, setMyLoading] = useState(false);

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    tagline: "",
    url: "",
    category: "",
    description: "",
    imageUrl: "",
  });

  const topProducts = useMemo(() => products.slice(0, 5), [products]);

  useEffect(() => {
    fetchCategoryOptions()
      .then(({ categories: list }) => setCategories(["全部", ...(list || [])]))
      .catch(() => setCategories(["全部"]));
  }, []);

  async function loadProducts(range = activeRange) {
    try {
      setLoading(true);
      setError("");
      const list = await fetchProducts({ range });
      setProducts(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadMyProducts() {
    try {
      setMyLoading(true);
      setError("");
      const list = await fetchMyProducts();
      setMyProducts(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setMyLoading(false);
    }
  }

  useEffect(() => {
    if (activeView === "home") {
      loadProducts(activeRange);
    }
  }, [activeRange, activeView]);

  useEffect(() => {
    if (user && activeView === "my") {
      loadMyProducts();
    }
  }, [activeView, user]);

  function requireLogin() {
    if (!user) {
      navigate("/login");
      return false;
    }
    return true;
  }

  function openSubmitModal() {
    if (!requireLogin()) return;
    setSubmitError("");
    setShowSubmitModal(true);
  }

  function closeSubmitModal() {
    if (submitting) return;
    setShowSubmitModal(false);
    setSubmitError("");
  }

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!/^image\/(jpeg|png|gif|webp)$/i.test(file.type)) {
      setSubmitError("仅支持 JPG / PNG / GIF / WebP 图片");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setSubmitError("图片不能超过 2MB");
      return;
    }

    try {
      setImageUploading(true);
      setSubmitError("");
      const { url } = await uploadImage(file);
      updateForm("imageUrl", url);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setImageUploading(false);
    }
  }

  async function handleSubmitProduct(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.tagline.trim()) {
      setSubmitError("请填写产品名称和一句话介绍");
      return;
    }
    if (!form.category) {
      setSubmitError("请选择产品分类");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError("");
      const result = await submitProduct(form);
      setShowSubmitModal(false);
      setForm({
        name: "",
        tagline: "",
        url: "",
        category: "",
        description: "",
        imageUrl: "",
      });
      toast.success("提交成功", result.message);
      if (isAdmin) {
        setActiveView("home");
        await loadProducts(activeRange);
      } else {
        setActiveView("my");
        await loadMyProducts();
      }
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVote(product) {
    if (!requireLogin()) return;

    try {
      setVotingId(product.id);
      const result = await voteProduct(product.id);
      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id
            ? { ...item, votedByMe: result.voted, voteCount: result.voteCount }
            : item
        )
      );
      if (result.voted) {
        toast.success("投票成功", `已为「${product.name}」投票`);
      }
    } catch (err) {
      toast.error("投票失败", err.message);
    } finally {
      setVotingId("");
    }
  }

  function jumpToWeekRank() {
    setActiveView("home");
    setActiveRange("week");
    document
      .getElementById("product-list")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="ph-page">
      <header className="ph-nav">
        <div className="ph-nav-inner">
          <Link to="/" className="ph-logo" onClick={() => setActiveView("home")}>
            <span className="ph-logo-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2c3.5 2 5.5 5.6 5.5 9.4 0 1.3-.2 2.5-.6 3.6l2.6 2.6c.4.4.6 1 .6 1.6V21l-3.7-1.2c-1.3.8-2.8 1.2-4.4 1.2s-3.1-.4-4.4-1.2L4 21v-1.8c0-.6.2-1.2.6-1.6l2.6-2.6c-.4-1.1-.6-2.3-.6-3.6C6.5 7.6 8.5 4 12 2z"
                  fill="currentColor"
                />
                <circle cx="12" cy="9.5" r="1.8" fill="#171A1D" />
              </svg>
            </span>
            <span className="ph-logo-text">ProductHunt</span>
          </Link>

          {activeView === "home" && (
            <nav className="ph-nav-tabs" role="tablist" aria-label="榜单">
              {RANGE_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={activeRange === tab.key}
                  className={activeRange === tab.key ? "ph-nav-tab active" : "ph-nav-tab"}
                  onClick={() => setActiveRange(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          )}

          <div className="ph-nav-actions">
            {user ? (
              <>
                <span className="ph-user-badge">{user.username}</span>
                {isAdmin && (
                  <Link to="/admin" className="ph-nav-ghost">
                    管理后台
                  </Link>
                )}
                <button
                  type="button"
                  className="ph-nav-ghost"
                  onClick={() => setActiveView(activeView === "my" ? "home" : "my")}
                >
                  {activeView === "my" ? "返回首页" : "我的提交"}
                </button>
                <button type="button" className="ph-nav-ghost" onClick={logout}>
                  退出
                </button>
                <button
                  type="button"
                  className="ph-nav-primary"
                  onClick={openSubmitModal}
                >
                  提交产品
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="ph-nav-ghost">
                  登录
                </Link>
                <Link to="/register" className="ph-nav-ghost">
                  注册
                </Link>
                <button
                  type="button"
                  className="ph-nav-primary"
                  onClick={openSubmitModal}
                >
                  提交产品
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {activeView === "home" ? (
        <main>
          <section className="ph-hero">
            <span className="ph-hero-pill">
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M10 2c2.6 1.6 4 4.4 4 7.2 0 1-.2 2-.5 2.8l1.7 1.7c.3.3.5.8.5 1.2V17l-2.7-.9c-.9.6-2 1-3 1s-2.1-.4-3-1L4.3 17v-2.1c0-.4.2-.9.5-1.2l1.7-1.7c-.3-.8-.5-1.8-.5-2.8C6 6.4 7.4 3.6 10 2z"
                  fill="currentColor"
                />
                <circle cx="10" cy="8" r="1.3" fill="#fff" />
              </svg>
              每天发现一个好产品
            </span>
            <h1 className="ph-hero-title">
              发现好作品，
              <br />
              为创新投票
            </h1>
            <p className="ph-hero-subtitle">
              汇集码道与开发者们精心打磨的产品 —— AI 工具、开发利器、开源项目。
              浏览、投票、上榜，让好作品被更多人看见。
            </p>
            <div className="ph-hero-actions">
              <button
                type="button"
                className="ph-btn-primary"
                onClick={openSubmitModal}
              >
                提交你的产品
              </button>
              <button type="button" className="ph-btn-ghost" onClick={jumpToWeekRank}>
                查看周榜
              </button>
            </div>
          </section>

          <section className="ph-section">
            <div className="ph-section-inner">
              <div className="ph-home-layout">
                <div className="ph-main-col">
                  <h2 className="ph-section-title">热门前五</h2>
              {loading ? (
                <div className="ph-top-grid">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div className="ph-top-card skeleton" key={index}>
                      <div className="skeleton-line short" />
                      <div className="skeleton-line title" />
                      <div className="skeleton-line" />
                    </div>
                  ))}
                </div>
              ) : topProducts.length === 0 ? (
                <div className="ph-top-empty">暂无数据，等待第一批产品</div>
              ) : (
                <div className="ph-top-grid">
                  {topProducts.map((product, index) => (
                    <article
                      className="ph-top-card"
                      key={product.id}
                      onClick={() => !product.votedByMe && handleVote(product)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !product.votedByMe) handleVote(product);
                      }}
                    >
                      <span className="ph-top-rank">#{index + 1}</span>
                      <div
                        className="ph-top-avatar"
                        style={
                          product.imageUrl
                            ? undefined
                            : { background: product.color || "#FF5722" }
                        }
                        aria-hidden="true"
                      >
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt="" loading="lazy" />
                        ) : (
                          getProductInitial(product.name)
                        )}
                      </div>
                      <h3 className="ph-top-name">{product.name}</h3>
                      <p className="ph-top-tagline">{product.tagline}</p>
                      <div
                        className={
                          product.votedByMe ? "ph-top-votes voted" : "ph-top-votes"
                        }
                      >
                        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                          <path
                            d="M10 4l5.5 6.5H13V15a1 1 0 01-1 1H8a1 1 0 01-1-1v-4.5H4.5L10 4z"
                            fill="currentColor"
                          />
                        </svg>
                        <span>{product.voteCount ?? 0}</span>
                      </div>
                    </article>
                  ))}
                </div>
                )}
                <h2 className="ph-section-title spaced" id="product-list">全部产品</h2>

              {error && <div className="error">{error}</div>}

              {loading ? (
                <div className="ph-list">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div className="ph-item skeleton" key={index}>
                      <div className="skeleton-line short" />
                      <div className="skeleton-line title" />
                      <div className="skeleton-line" />
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="ph-empty">
                  <h3>{RANGE_EMPTY_HINT[activeRange]}</h3>
                  <button
                    type="button"
                    className="ph-empty-link"
                    onClick={openSubmitModal}
                  >
                    成为第一个提交者 →
                  </button>
                </div>
              ) : (
                <div className="ph-list">
                  {products.map((product) => (
                    <article className="ph-item" key={product.id}>
                      <VoteButton
                        product={product}
                        onVote={handleVote}
                        disabled={votingId === product.id}
                      />

                      <div
                        className="ph-item-avatar"
                        style={
                          product.imageUrl
                            ? undefined
                            : { background: product.color || "#FF5722" }
                        }
                        aria-hidden="true"
                      >
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt="" loading="lazy" />
                        ) : (
                          getProductInitial(product.name)
                        )}
                      </div>

                      <div className="ph-item-main">
                        <div className="ph-item-title-row">
                          <h3>{product.name}</h3>
                          <span className="ph-category-badge">{product.category}</span>
                        </div>
                        <p className="ph-item-tagline">{product.tagline}</p>
                        <p className="ph-item-meta">
                          <span>来自 {product.submittedBy || "匿名"}</span>
                          <span>{formatRelativeTime(product.submittedAt)}</span>
                        </p>
                        {product.description && (
                          <p className="ph-item-desc">{product.description}</p>
                        )}
                      </div>

                      {product.url && (
                        <a
                          className="ph-item-link"
                          href={product.url}
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          访问
                          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path
                              d="M6 3h7v7M13 3l-7 7M11 10v3H3V5h3"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </a>
                      )}
                    </article>
                  ))}
                </div>
                )}
                </div>
                <aside className="ph-sidebar">
                  <RankList />
                </aside>
              </div>
            </div>
          </section>
        </main>
      ) : (
        <main className="ph-section">
          <div className="ph-section-inner">
            <div className="ph-my-toolbar">
              <h2 className="ph-section-title">我的提交</h2>
            </div>
            {error && <div className="error">{error}</div>}
            <MyProductsList
              products={myProducts}
              loading={myLoading}
              onSubmit={openSubmitModal}
            />
          </div>
        </main>
      )}

      <footer className="ph-footer">
        <div className="ph-section-inner">
          <div className="ph-footer-brand">
            <span className="ph-logo-mark small" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2c3.5 2 5.5 5.6 5.5 9.4 0 1.3-.2 2.5-.6 3.6l2.6 2.6c.4.4.6 1 .6 1.6V21l-3.7-1.2c-1.3.8-2.8 1.2-4.4 1.2s-3.1-.4-4.4-1.2L4 21v-1.8c0-.6.2-1.2.6-1.6l2.6-2.6c-.4-1.1-.6-2.3-.6-3.6C6.5 7.6 8.5 4 12 2z"
                  fill="currentColor"
                />
                <circle cx="12" cy="9.5" r="1.8" fill="#F6F4F0" />
              </svg>
            </span>
            <span className="ph-footer-text">
              ProductHunt · 发现码道与开发者的优秀作品
            </span>
          </div>
          <nav className="ph-footer-nav">
            <button
              type="button"
              onClick={() => {
                setActiveView("home");
                setActiveRange("today");
              }}
            >
              今日
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveView("home");
                setActiveRange("week");
              }}
            >
              周榜
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveView("home");
                setActiveRange("month");
              }}
            >
              月榜
            </button>
            <button type="button" onClick={openSubmitModal}>
              提交产品
            </button>
          </nav>
        </div>
      </footer>

      {showSubmitModal &&
        createPortal(
          <div className="modal-overlay" onClick={closeSubmitModal}>
            <div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="submit-modal-title"
            >
              <div className="modal-header">
                <div>
                  <p className="modal-eyebrow">发布</p>
                  <h2 id="submit-modal-title">提交你的产品</h2>
                </div>
                <button
                  type="button"
                  className="modal-close"
                  onClick={closeSubmitModal}
                  disabled={submitting}
                  aria-label="关闭"
                >
                  ×
                </button>
              </div>

              <form className="modal-body" onSubmit={handleSubmitProduct}>
                <div className="modal-field">
                  <span>产品图片</span>
                  <div className="ph-upload">
                    {form.imageUrl ? (
                      <div className="ph-upload-preview">
                        <img src={form.imageUrl} alt="产品图片预览" />
                        <button
                          type="button"
                          className="ph-upload-remove"
                          onClick={() => updateForm("imageUrl", "")}
                          disabled={submitting || imageUploading}
                          aria-label="移除图片"
                          title="移除图片"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label
                        className={
                          imageUploading
                            ? "ph-upload-trigger uploading"
                            : "ph-upload-trigger"
                        }
                      >
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={handleImageChange}
                          disabled={submitting || imageUploading}
                          hidden
                        />
                        <svg className="ph-upload-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="M12 16V4m0 0L8 8m4-4l4 4"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="ph-upload-text">
                          {imageUploading ? "上传中..." : "点击上传图片"}
                        </span>
                        <span className="ph-upload-sub">
                          JPG / PNG / GIF / WebP，不超过 2MB，选填
                        </span>
                      </label>
                    )}
                  </div>
                </div>

                <label className="modal-field">
                  <span>产品名称 *</span>
                  <input
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    placeholder="例如：LobsterAI"
                    maxLength={50}
                    disabled={submitting}
                    required
                  />
                </label>

                <label className="modal-field">
                  <span>一句话介绍 *</span>
                  <input
                    value={form.tagline}
                    onChange={(e) => updateForm("tagline", e.target.value)}
                    placeholder="用一句话说清你的产品是做什么的"
                    maxLength={100}
                    disabled={submitting}
                    required
                  />
                </label>

                <label className="modal-field">
                  <span>产品链接</span>
                  <input
                    value={form.url}
                    onChange={(e) => updateForm("url", e.target.value)}
                    placeholder="https://your-product.com"
                    disabled={submitting}
                  />
                </label>

                <div className="modal-field">
                  <span>分类 *</span>
                  <div className="modal-category-options">
                    {categories
                      .filter((c) => c !== "全部")
                      .map((category) => (
                        <button
                          key={category}
                          type="button"
                          className={
                            form.category === category
                              ? "modal-category active"
                              : "modal-category"
                          }
                          onClick={() => updateForm("category", category)}
                          disabled={submitting}
                        >
                          {category}
                        </button>
                      ))}
                  </div>
                </div>

                <label className="modal-field">
                  <span>详细介绍</span>
                  <textarea
                    value={form.description}
                    onChange={(e) => updateForm("description", e.target.value)}
                    placeholder="产品的亮点、解决了什么问题、适合什么人群（选填）"
                    rows={4}
                    maxLength={500}
                    disabled={submitting}
                  />
                </label>

                {submitError && <div className="modal-error">{submitError}</div>}

                <div className="modal-actions">
                  <button
                    type="button"
                    className="modal-btn secondary"
                    onClick={closeSubmitModal}
                    disabled={submitting}
                  >
                    取消
                  </button>
                  <button type="submit" className="modal-btn primary" disabled={submitting}>
                    {submitting ? "提交中..." : isAdmin ? "立即发布" : "提交审核"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
