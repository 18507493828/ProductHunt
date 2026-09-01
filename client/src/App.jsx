import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { Upload, Inbox, SearchX } from "lucide-react";
import { useAuth } from "./AuthContext";
import { useToast } from "./Toast";
import {
  fetchCategoryOptions,
  fetchMyProducts,
  fetchProducts,
  fetchTopics,
  createTopic,
  followTopic,
  submitProduct,
  uploadImage,
  voteProduct,
} from "./api";
import Carousel from "./components/Carousel";
import EmptyState from "./components/EmptyState";
import MyProductsList from "./components/MyProductsList";
import ProductCard, { ProductCardSkeleton } from "./components/ProductCard";
import RankList from "./components/RankList";
import RatingModal from "./components/RatingModal";
import TopicsView from "./components/TopicsView";
import "./App.css";

const PRODUCT_PAGE_SIZE = 20;

const TOPIC_COLORS = [
  "#E1523D",
  "#F28C3C",
  "#D4A53C",
  "#5BA85F",
  "#2FA0A0",
  "#3B7DD8",
  "#7A5FD8",
  "#B0528F",
];

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

/* 通用空状态组件：图标在上、文案在下，可带操作按钮 */
export default function App() {
  const { user, isAdmin, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(["全部"]);
  const [activeCategory, setActiveCategory] = useState("全部");
  const [activeTopicId, setActiveTopicId] = useState("");
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [activeView, setActiveView] = useState("home");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [votingId, setVotingId] = useState("");
  const [ratingProduct, setRatingProduct] = useState(null);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const filtersRef = useRef(null);
  const dragState = useRef({ dragging: false, startX: 0, startScrollLeft: 0, moved: false });
  const [filterOverflow, setFilterOverflow] = useState({ left: false, right: false });
  const [visibleCount, setVisibleCount] = useState(PRODUCT_PAGE_SIZE);
  const sentinelRef = useRef(null);
  const [topicStats, setTopicStats] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [showCreateTopicModal, setShowCreateTopicModal] = useState(false);
  const [creatingTopic, setCreatingTopic] = useState(false);
  const [createTopicError, setCreateTopicError] = useState("");
  const [topicCoverUploading, setTopicCoverUploading] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [topicSuggestOpen, setTopicSuggestOpen] = useState(false);
  const [topicForm, setTopicForm] = useState({
    name: "",
    description: "",
    coverImage: "",
  });

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
    topicId: "",
  });

  const visibleProducts = useMemo(
    () => products.slice(0, visibleCount),
    [products, visibleCount]
  );
  const hasMore = products.length > 0 && visibleCount < products.length;

  useEffect(() => {
    fetchCategoryOptions()
      .then(({ categories: list }) => setCategories(["全部", ...(list || [])]))
      .catch(() => setCategories(["全部"]));
  }, []);

  async function loadProducts(category = activeCategory, topicId = activeTopicId) {
    try {
      setLoading(true);
      setError("");
      const list = await fetchProducts({ category, topicId });
      setProducts(list);
      setVisibleCount(PRODUCT_PAGE_SIZE);
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
      loadProducts(activeCategory, activeTopicId);
    } else if (activeView === "topics") {
      // 话题视图始终加载产品：未选话题则默认全部，选中则按话题过滤
      loadProducts(activeCategory, activeTopicId);
    }
  }, [activeCategory, activeTopicId, activeView]);

  useEffect(() => {
    setVisibleCount(PRODUCT_PAGE_SIZE);
  }, [activeCategory, activeTopicId]);

  useEffect(() => {
    if (user && activeView === "my") {
      loadMyProducts();
    }
  }, [activeView, user]);

  // 切换视图（首页/话题/我的提交）时滚动回顶部，配合入场动画
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [activeView]);

  // 话题视图：拉取全部话题列表
  useEffect(() => {
    if (activeView !== "topics") return;
    let cancelled = false;
    setTopicsLoading(true);
    fetchTopics()
      .then((list) => {
        if (cancelled) return;
        setTopicStats(list || []);
      })
      .catch(() => {
        if (!cancelled) setTopicStats([]);
      })
      .finally(() => {
        if (!cancelled) setTopicsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeView]);

  // 加载话题列表（供提交产品时选择关联话题）
  useEffect(() => {
    let cancelled = false;
    fetchTopics()
      .then((list) => {
        if (!cancelled) setTopicStats(list || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // 下拉加载更多（首页全部产品，每页 20 条，滚动到底部自动加载）
  const loadMoreRef = useRef(() => {});
  loadMoreRef.current = () => {
    setVisibleCount((c) => Math.min(c + PRODUCT_PAGE_SIZE, products.length));
  };

  useEffect(() => {
    if (!hasMore) return undefined;
    const el = sentinelRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMoreRef.current();
      },
      { rootMargin: "300px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore]);

  // 首屏不足一屏时自动补足，避免一进来就看到“已经到底了”
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.top <= window.innerHeight + 300) {
      loadMoreRef.current();
    }
  }, [visibleCount, products.length, hasMore]);

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
        topicId: "",
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

  function selectTopic(topicId, name) {
    // 停留在当前界面（话题视图），仅按话题筛选数据，不跳转首页
    setActiveTopicId(topicId);
    setActiveCategory("全部");
    setSelectedTopic({ id: topicId, name });
  }

  async function handleFollowTopic(topicId, e) {
    e.preventDefault();
    e.stopPropagation();
    if (!requireLogin()) return;
    try {
      const result = await followTopic(topicId);
      setTopicStats((prev) =>
        prev.map((t) =>
          t.id === topicId
            ? { ...t, following: result.following, followerCount: result.followerCount }
            : t
        )
      );
      toast.success(result.following ? "已关注话题" : "已取消关注");
    } catch (err) {
      toast.error("操作失败", err.message);
    }
  }

  function openCreateTopicModal() {
    if (!requireLogin()) return;
    setCreateTopicError("");
    setSelectedTopicId("");
    setTopicForm({ name: "", description: "", coverImage: "" });
    setTopicSuggestOpen(false);
    setShowCreateTopicModal(true);
  }

  function closeCreateTopicModal() {
    if (creatingTopic) return;
    setShowCreateTopicModal(false);
    setCreateTopicError("");
    setSelectedTopicId("");
    setTopicForm({ name: "", description: "", coverImage: "" });
    setTopicSuggestOpen(false);
  }

  function handlePickTopic(topic) {
    setSelectedTopicId(topic.id);
    setTopicForm({
      name: topic.name,
      description: topic.description || "",
      coverImage: topic.coverImage || "",
    });
    setCreateTopicError("");
    setTopicSuggestOpen(false);
  }

  function handleTopicNameChange(value) {
    // 输入改变时，取消"已选话题"标记，变为可新建
    setSelectedTopicId("");
    updateTopicForm("name", value);
    setTopicSuggestOpen(value.trim().length > 0);
  }

  function topicSuggestions() {
    const q = (topicForm.name || "").trim().toLowerCase();
    if (!q) return [];
    return topicStats.filter((t) => t.name.toLowerCase().includes(q)).slice(0, 8);
  }

  function updateTopicForm(key, value) {
    setTopicForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleTopicCoverChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/^image\/(jpeg|png|gif|webp)$/i.test(file.type)) {
      setCreateTopicError("仅支持 JPG / PNG / GIF / WebP 图片");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setCreateTopicError("图片不能超过 2MB");
      return;
    }
    try {
      setTopicCoverUploading(true);
      setCreateTopicError("");
      const { url } = await uploadImage(file);
      updateTopicForm("coverImage", url);
    } catch (err) {
      setCreateTopicError(err.message);
    } finally {
      setTopicCoverUploading(false);
    }
  }

  async function handleCreateTopic(e) {
    e.preventDefault();
    const name = topicForm.name.trim();
    if (!name) {
      setCreateTopicError("请填写话题名称");
      return;
    }
    // 从联想下拉中选择了已有话题：不重复创建，进入该话题
    if (selectedTopicId) {
      const existing = topicStats.find((t) => t.id === selectedTopicId);
      setShowCreateTopicModal(false);
      setSelectedTopicId("");
      setTopicForm({ name: "", description: "", coverImage: "" });
      setTopicSuggestOpen(false);
      if (existing) {
        toast.success("话题已存在", `「${name}」已存在，已为你打开`);
        selectTopic(existing.id, existing.name);
      }
      return;
    }
    try {
      setCreatingTopic(true);
      setCreateTopicError("");
      const result = await createTopic(topicForm);
      setShowCreateTopicModal(false);
      setSelectedTopicId("");
      setTopicForm({ name: "", description: "", coverImage: "" });
      setTopicSuggestOpen(false);
      // 刷新话题列表，并把新话题加入本地状态
      setTopicStats((prev) => [...prev, result.topic].sort((a, b) => b.productCount - a.productCount));
      toast.success("发布成功", `话题「${name}」已创建`);
    } catch (err) {
      setCreateTopicError(err.message);
    } finally {
      setCreatingTopic(false);
    }
  }

  function handleVote(product) {
    if (!requireLogin()) return;
    // 点赞改为评分：先弹出评分弹窗
    setRatingProduct(product);
  }

  function closeRatingModal() {
    if (ratingSubmitting) return;
    setRatingProduct(null);
  }

  async function submitRating(rating) {
    if (!ratingProduct) return;
    try {
      setVotingId(ratingProduct.id);
      setRatingSubmitting(true);
      const result = await voteProduct(ratingProduct.id, rating);
      setProducts((prev) =>
        prev.map((item) =>
          item.id === ratingProduct.id
            ? {
                ...item,
                votedByMe: result.voted,
                voteCount: result.voteCount,
                avgRating: result.avgRating,
                ratingCount: result.ratingCount,
              }
            : item
        )
      );
      toast.success("评分成功", `已为「${ratingProduct.name}」打 ${rating} 星`);
      setRatingProduct(null);
    } catch (err) {
      toast.error("评分失败", err.message);
    } finally {
      setVotingId("");
      setRatingSubmitting(false);
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

          <nav className="ph-nav-links" aria-label="顶部导航">
            <Link
              to="/"
              className={
                "ph-nav-link" + (activeView === "home" ? " active" : "")
              }
              onClick={() => setActiveView("home")}
            >
              首页
            </Link>
            <a
              href="#"
              className={"ph-nav-link" + (activeView === "topics" ? " active" : "")}
              onClick={(e) => {
                e.preventDefault();
                setActiveView("topics");
                setActiveTopicId("");
                setSelectedTopic(null);
              }}
            >
              话题
            </a>
          </nav>

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
        <main key="home" className="ph-view-enter">
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
                    <EmptyState
                      icon={<Inbox />}
                      title={
                        activeCategory !== "全部"
                          ? "该分类下还没有产品"
                          : "还没有产品，来提交第一个吧"
                      }
                      action={
                        <button
                          type="button"
                          className="ph-empty-link"
                          onClick={openSubmitModal}
                        >
                          成为第一个提交者 →
                        </button>
                      }
                    />
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

                      {hasMore && (
                        <div className="ph-loadmore" ref={sentinelRef}>
                          <span className="ph-spinner" aria-hidden="true" />
                          正在加载更多…
                        </div>
                      )}
                      {!hasMore && products.length > 0 && (
                        <div className="ph-loadmore-done">— 已经到底了 —</div>
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
      ) : activeView === "topics" ? (
        <main key="topics" className="ph-section ph-view-enter">
          <div className="ph-section-inner">
            <TopicsView
              topics={topicStats}
              loading={topicsLoading}
              activeTopicId={activeTopicId}
              onSelect={(topicId, name) => selectTopic(topicId, name)}
              onFollow={handleFollowTopic}
              onCreate={openCreateTopicModal}
            />

            {activeTopicId && (
              <div className="ph-topic-filter-head">
                <button
                  type="button"
                  className="ph-topic-filter-clear"
                  onClick={() => {
                    setActiveTopicId("");
                    setSelectedTopic(null);
                  }}
                >
                  × 清除筛选
                </button>
              </div>
            )}

            <div className="ph-topic-filter">
              {error && <div className="error">{error}</div>}

              {loading ? (
                <div className="ph-product-grid ph-product-grid-all">
                  {Array.from({ length: 12 }).map((_, index) => (
                    <ProductCardSkeleton key={index} size="md" />
                  ))}
                </div>
              ) : products.length === 0 ? (
                <EmptyState
                  icon={<Inbox />}
                  title={activeTopicId ? "该话题下还没有产品" : "还没有产品"}
                />
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

                  {hasMore && (
                    <div className="ph-loadmore" ref={sentinelRef}>
                      <span className="ph-spinner" aria-hidden="true" />
                      正在加载更多…
                    </div>
                  )}
                  {!hasMore && products.length > 0 && (
                    <div className="ph-loadmore-done">— 已经到底了 —</div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      ) : (
        <main key="my" className="ph-section ph-view-enter">
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
                        <Upload className="ph-upload-icon" size={26} aria-hidden="true" />
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

                <div className="modal-field">
                  <span>关联话题</span>
                  <select
                    value={form.topicId}
                    onChange={(e) => updateForm("topicId", e.target.value)}
                    disabled={submitting}
                  >
                    <option value="">不关联</option>
                    {topicStats.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.name}
                      </option>
                    ))}
                  </select>
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

      {showCreateTopicModal &&
        createPortal(
          <div className="modal-overlay" onClick={closeCreateTopicModal}>
            <div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="topic-modal-title"
            >
              <div className="modal-header">
                <div>
                  <p className="modal-eyebrow">社区</p>
                  <h2 id="topic-modal-title">发布话题</h2>
                </div>
                <button
                  type="button"
                  className="modal-close"
                  onClick={closeCreateTopicModal}
                  disabled={creatingTopic}
                  aria-label="关闭"
                >
                  ×
                </button>
              </div>

              <form className="modal-body" onSubmit={handleCreateTopic}>
                <div className="modal-field">
                  <label className="modal-label" htmlFor="topic-name">
                    话题
                  </label>
                  <div className="topic-input-wrap">
                    <input
                      id="topic-name"
                      className="modal-input"
                      placeholder="输入话题名称，如：AI 工具、开源项目…"
                      value={topicForm.name}
                      maxLength={30}
                      autoComplete="off"
                      onChange={(e) => handleTopicNameChange(e.target.value)}
                      onFocus={() =>
                        setTopicSuggestOpen((topicForm.name || "").trim().length > 0)
                      }
                      onBlur={() => setTimeout(() => setTopicSuggestOpen(false), 120)}
                    />
                    {selectedTopicId && (
                      <span className="topic-input-picked">已选话题</span>
                    )}

                    {topicSuggestOpen && (
                      <div className="topic-suggest" role="listbox">
                        {topicSuggestions().length > 0 ? (
                          topicSuggestions().map((topic) => (
                            <button
                              type="button"
                              key={topic.id}
                              className="topic-suggest-item"
                              onClick={() => handlePickTopic(topic)}
                            >
                              <span className="topic-suggest-info">
                                <span className="topic-suggest-name">{topic.name}</span>
                                <span className="topic-suggest-meta">
                                  {topic.productCount ?? 0} 个作品
                                </span>
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="topic-suggest-empty">
                            <SearchX className="topic-suggest-empty-icon" aria-hidden="true" />
                            <span>没有匹配的话题，可直接创建新话题</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="modal-hint">
                    {selectedTopicId
                      ? "已选中已有话题，可直接发布（若已存在将进入该话题）"
                      : topicSuggestions().length > 0
                        ? "匹配到已有话题，点击可直接选择；也可输入新名称创建新话题"
                        : "输入名称即可创建新话题，输入时会出现已有话题选项"}
                  </span>
                </div>

                <div className="modal-field">
                  <label className="modal-label" htmlFor="topic-desc">
                    话题简介
                  </label>
                  <textarea
                    id="topic-desc"
                    className="modal-input"
                    placeholder="一句话介绍这个话题，让更多人了解它想聚集的内容"
                    rows={3}
                    maxLength={200}
                    value={topicForm.description}
                    onChange={(e) => updateTopicForm("description", e.target.value)}
                  />
                  <span className="modal-hint">不超过 200 字</span>
                </div>

                <div className="modal-field">
                  <span className="modal-label">封面图（可选）</span>
                  <label className="modal-upload">
                    {topicCoverUploading ? (
                      <span className="ph-spinner" aria-hidden="true" />
                    ) : topicForm.coverImage ? (
                      <span className="modal-upload-has">
                        <img src={topicForm.coverImage} alt="封面预览" />
                        <span>点击更换</span>
                      </span>
                    ) : (
                      <span className="modal-upload-empty">
                        <span className="modal-upload-plus">＋</span>
                        <span>上传封面图</span>
                      </span>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleTopicCoverChange}
                      disabled={topicCoverUploading}
                      hidden
                    />
                  </label>
                </div>

                {createTopicError && <div className="modal-error">{createTopicError}</div>}

                <div className="modal-actions">
                  <button
                    type="button"
                    className="modal-btn secondary"
                    onClick={closeCreateTopicModal}
                    disabled={creatingTopic}
                  >
                    取消
                  </button>
                  <button type="submit" className="modal-btn primary" disabled={creatingTopic}>
                    {creatingTopic
                      ? "发布中..."
                      : selectedTopicId
                        ? "进入该话题"
                        : "发布话题"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {ratingProduct && (
        <RatingModal
          key={ratingProduct.id}
          product={ratingProduct}
          submitting={ratingSubmitting}
          onCancel={closeRatingModal}
          onSubmit={submitRating}
        />
      )}
    </div>
  );
}
