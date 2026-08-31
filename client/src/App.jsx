import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useToast } from "./Toast";
import {
  fetchCategoryOptions,
  fetchMyProducts,
  fetchNavs,
  fetchProducts,
  submitProduct,
  uploadImage,
  voteProduct,
} from "./api";
import Carousel from "./components/Carousel";
import MyProductsList from "./components/MyProductsList";
import ProductCard, { ProductCardSkeleton } from "./components/ProductCard";
import RankList from "./components/RankList";
import "./App.css";

const PRODUCT_PAGE_SIZE = 50;

function StarField() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let stars = [];
    let raf = 0;

    function initStars() {
      const count = Math.min(
        Math.floor((window.innerWidth * window.innerHeight) / 9000),
        220
      );
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.4 + 0.3,
        speed: Math.random() * 0.12 + 0.02,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        alpha: Math.random() * 0.5 + 0.25,
        purple: Math.random() < 0.15,
      }));
    }

    function resize() {
      canvas.width = window.innerWidth * DPR;
      canvas.height = window.innerHeight * DPR;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      initStars();
    }

    function tick() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (const s of stars) {
        s.y -= s.speed;
        s.twinkle += s.twinkleSpeed;
        if (s.y < -2) {
          s.y = window.innerHeight + 2;
          s.x = Math.random() * window.innerWidth;
        }
        const a = s.alpha * (0.55 + 0.45 * Math.sin(s.twinkle));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.purple
          ? `rgba(147, 111, 245, ${a})`
          : `rgba(255, 255, 255, ${a})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    }

    resize();
    tick();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="starfield-canvas" aria-hidden="true" />;
}

export default function App() {
  const { user, isAdmin, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [navs, setNavs] = useState([]);
  const [categories, setCategories] = useState(["全部"]);
  const [activeCategory, setActiveCategory] = useState("全部");
  const [activeView, setActiveView] = useState("home");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [votingId, setVotingId] = useState("");
  const filtersRef = useRef(null);
  const dragState = useRef({ dragging: false, startX: 0, startScrollLeft: 0, moved: false });
  const [filterOverflow, setFilterOverflow] = useState({ left: false, right: false });
  const [currentPage, setCurrentPage] = useState(1);

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

  const pageSize = PRODUCT_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(products.length / pageSize));
  const visibleProducts = useMemo(
    () => products.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [products, currentPage, pageSize]
  );
  const pageItems = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const core = [1, totalPages, currentPage - 1, currentPage, currentPage + 1].filter(
      (p) => p >= 1 && p <= totalPages
    );
    const sorted = [...new Set(core)].sort((a, b) => a - b);
    const items = [];
    let prev = 0;
    for (const p of sorted) {
      if (p - prev > 1) items.push("...");
      items.push(p);
      prev = p;
    }
    return items;
  }, [totalPages, currentPage]);

  function goToPage(page) {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  }

  useEffect(() => {
    fetchCategoryOptions()
      .then(({ categories: list }) => setCategories(["全部", ...(list || [])]))
      .catch(() => setCategories(["全部"]));
  }, []);

  // 顶部导航链接
  useEffect(() => {
    fetchNavs()
      .then(setNavs)
      .catch(() => setNavs([]));
  }, []);

  async function loadProducts(category = activeCategory) {
    try {
      setLoading(true);
      setError("");
      const list = await fetchProducts({ category });
      setProducts(list);
      setCurrentPage((p) =>
        Math.min(p, Math.max(1, Math.ceil(list.length / PRODUCT_PAGE_SIZE)))
      );
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
      loadProducts(activeCategory);
    }
  }, [activeCategory, activeView]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory]);

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
    const trimmedName = form.name.trim();
    const trimmedTagline = form.tagline.trim();
    const trimmedUrl = form.url.trim();

    if (!trimmedName) {
      setSubmitError("请填写产品名称");
      return;
    }
    if (!trimmedTagline) {
      setSubmitError("请填写一句话介绍");
      return;
    }
    if (!trimmedUrl) {
      setSubmitError("请填写产品链接");
      return;
    }
    if (!/^https?:\/\/.+/i.test(trimmedUrl)) {
      setSubmitError("产品链接需以 http:// 或 https:// 开头");
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
        await loadProducts(activeCategory);
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

  function updateFilterOverflow() {
    const el = filtersRef.current;
    if (!el) return;
    const maxLeft = el.scrollWidth - el.clientWidth;
    setFilterOverflow({
      left: el.scrollLeft > 2,
      right: el.scrollLeft < maxLeft - 2 && maxLeft > 0,
    });
  }

  useEffect(() => {
    updateFilterOverflow();
    window.addEventListener("resize", updateFilterOverflow);
    return () => window.removeEventListener("resize", updateFilterOverflow);
  }, [categories]);

  function onFilterMouseDown(e) {
    dragState.current = {
      dragging: true,
      startX: e.clientX,
      startScrollLeft: filtersRef.current?.scrollLeft ?? 0,
      moved: false,
    };
  }

  function onFilterMouseMove(e) {
    const st = dragState.current;
    const container = filtersRef.current;
    if (!st.dragging || !container) return;
    const dx = e.clientX - st.startX;
    if (Math.abs(dx) > 4) st.moved = true;
    container.scrollLeft = st.startScrollLeft - dx;
  }

  function endFilterDrag() {
    if (dragState.current.dragging) {
      dragState.current.dragging = false;
    }
  }

  function onFilterClickCapture(e) {
    // 拖拽后抬起鼠标会触发 click，这里吞掉，避免误选分类
    if (dragState.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      dragState.current.moved = false;
    }
  }

  function selectCategory(category, e) {
    setActiveCategory(category);
    const container = filtersRef.current;
    const btn = e?.currentTarget;
    if (container && btn) {
      container.scrollTo({
        left: btn.offsetLeft - (container.clientWidth - btn.clientWidth) / 2,
        behavior: "smooth",
      });
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

  return (
    <div className="ph-page">
      <StarField />
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
            <span className="ph-logo-text">Vibe Building</span>
          </Link>

          {navs.length > 0 && (
            <nav className="ph-nav-links" aria-label="顶部导航">
              {navs.map((nav) => (
                <a
                  key={nav.id}
                  className="ph-nav-link"
                  href={nav.url}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {nav.title}
                </a>
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

      {activeView === "home" && <Carousel />}

      {activeView === "home" ? (
        <main>
          <section className="ph-page-header">
            <div className="ph-section-inner">
              <div className="ph-page-header-inner">
                <div>
                  <p className="ph-page-eyebrow">
                    今日精选 ·{" "}
                    {new Date().toLocaleDateString("zh-CN", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <h1 className="ph-page-title">发现好作品，为创新投票</h1>
                  <p className="ph-page-desc">
                    Vibe Building 人人都可以成为开发者，构建自己的应用
                  </p>
                </div>
                <button
                  type="button"
                  className="ph-btn-primary"
                  onClick={openSubmitModal}
                >
                  提交产品
                </button>
              </div>
            </div>
          </section>

          <section className="ph-section">
            <div className="ph-section-inner">
              <div className="ph-all-section" id="product-list">
                <div className="ph-all-box">
                  <h2 className="ph-section-title spaced">全部产品</h2>

                  <div className="ph-filters-wrap">
                    <div
                      className="ph-filters"
                      role="tablist"
                      aria-label="产品分类"
                      ref={filtersRef}
                      onScroll={updateFilterOverflow}
                      onMouseDown={onFilterMouseDown}
                      onMouseMove={onFilterMouseMove}
                      onMouseUp={endFilterDrag}
                      onMouseLeave={endFilterDrag}
                      onClickCapture={onFilterClickCapture}
                    >
                      {categories.map((category) => (
                        <button
                          key={category}
                          type="button"
                          role="tab"
                          aria-selected={category === activeCategory}
                          className={
                            category === activeCategory
                              ? "ph-filter active"
                              : "ph-filter"
                          }
                          onClick={(e) => selectCategory(category, e)}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                    {filterOverflow.left && (
                      <span className="ph-filters-fade left" aria-hidden="true" />
                    )}
                    {filterOverflow.right && (
                      <span className="ph-filters-fade right" aria-hidden="true" />
                    )}
                  </div>

                  {error && <div className="error">{error}</div>}

                  {loading ? (
                    <div className="ph-product-grid ph-product-grid-all">
                      {Array.from({ length: 12 }).map((_, index) => (
                        <ProductCardSkeleton key={index} size="md" />
                      ))}
                    </div>
                  ) : products.length === 0 ? (
                    <div className="ph-empty">
                      <h3>
                        {activeCategory !== "全部"
                          ? "该分类下还没有产品"
                          : "还没有产品，来提交第一个吧"}
                      </h3>
                      <button
                        type="button"
                        className="ph-empty-link"
                        onClick={openSubmitModal}
                      >
                        成为第一个提交者 →
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="ph-product-grid ph-product-grid-all">
                        {visibleProducts.map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            onVote={handleVote}
                            votingDisabled={votingId === product.id}
                            showCategory
                            showMeta
                            size="md"
                          />
                        ))}
                      </div>
                      {totalPages > 1 && (
                        <div className="ph-pagination">
                          <button
                            type="button"
                            className="ph-page-btn"
                            disabled={currentPage === 1}
                            onClick={() => goToPage(currentPage - 1)}
                          >
                            上一页
                          </button>
                          <div className="ph-page-numbers">
                            {pageItems.map((item, i) =>
                              item === "..." ? (
                                <span key={`ellipsis-${i}`} className="ph-page-ellipsis">
                                  …
                                </span>
                              ) : (
                                <button
                                  key={item}
                                  type="button"
                                  className={
                                    item === currentPage
                                      ? "ph-page-num active"
                                      : "ph-page-num"
                                  }
                                  onClick={() => goToPage(item)}
                                >
                                  {item}
                                </button>
                              )
                            )}
                          </div>
                          <button
                            type="button"
                            className="ph-page-btn"
                            disabled={currentPage === totalPages}
                            onClick={() => goToPage(currentPage + 1)}
                          >
                            下一页
                          </button>
                          <span className="ph-page-total">
                            共 {products.length} 个产品 · 第 {currentPage} / {totalPages} 页
                          </span>
                        </div>
                      )}
                    </>
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
              Vibe Building · 发现码道与开发者的优秀作品
            </span>
          </div>
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
                  <span>
                    产品名称 <span className="field-required">*</span>
                  </span>
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
                  <span>
                    一句话介绍 <span className="field-required">*</span>
                  </span>
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
                  <span>
                    产品链接 <span className="field-required">*</span>
                  </span>
                  <input
                    value={form.url}
                    onChange={(e) => updateForm("url", e.target.value)}
                    placeholder="https://your-product.com"
                    disabled={submitting}
                    required
                  />
                </label>

                <div className="modal-field">
                  <span>
                    分类 <span className="field-required">*</span>
                  </span>
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
