import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Upload, Inbox, SearchX, Sparkles } from "lucide-react";
import { useAuth } from "./AuthContext";
import { useToast } from "./Toast";
import {
  fetchCategoryOptions,
  fetchMyProducts,
  fetchProducts,
  fetchCampaigns,
  fetchTopics,
  createTopic,
  fetchTopicPosts,
  submitTopicPost,
  likeTopicPost,
  submitProduct,
  updateProduct,
  uploadImage,
  voteProduct,
} from "./api";
import Carousel from "./components/Carousel";
import EmptyState from "./components/EmptyState";
import MyProductsList from "./components/MyProductsList";
import ProductCard, { ProductCardSkeleton } from "./components/ProductCard";
import RankList from "./components/RankList";
import RatingModal from "./components/RatingModal";
import TopicRankList from "./components/TopicRankList";
import TopicDetailPanel from "./components/TopicDetailPanel";
import TopicExplore from "./components/TopicExplore";
import TopicPostCard, {
  TopicPostCardSkeleton,
} from "./components/TopicPostCard";
import TopicPostUploadModal from "./components/TopicPostUploadModal";
import ResourceSearchBar from "./components/ResourceSearchBar";
import MainViewSwitch, { MainViewTabNav } from "./components/MainViewSwitch";
import BrandLogo from "./components/BrandLogo";
import { bareTopicName, formatTopicName } from "./topicUtils";
import "./App.css";

const PRODUCT_PAGE_SIZE = 20;
const WEEKDAY_LABELS = [
  "星期日",
  "星期一",
  "星期二",
  "星期三",
  "星期四",
  "星期五",
  "星期六",
];

function formatHeroDate(date = new Date()) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = WEEKDAY_LABELS[date.getDay()];
  return `${month}月${day}日${weekday}`;
}

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
        220,
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
          ? `rgba(252, 85, 49, ${a})`
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
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [topicPosts, setTopicPosts] = useState([]);
  const [categories, setCategories] = useState(["全部"]);
  const [campaigns, setCampaigns] = useState([]);
  const [activeCategory, setActiveCategory] = useState("全部");
  const [activeScope, setActiveScope] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [activeTopicId, setActiveTopicId] = useState("");
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [activeView, setActiveView] = useState("home");

  const [loading, setLoading] = useState(true);
  const [topicPostsLoading, setTopicPostsLoading] = useState(false);
  const [error, setError] = useState("");
  const [topicError, setTopicError] = useState("");
  const [topicPostLikeId, setTopicPostLikeId] = useState("");
  const [showTopicPostModal, setShowTopicPostModal] = useState(false);
  const [topicPostSubmitting, setTopicPostSubmitting] = useState(false);
  const [topicPostError, setTopicPostError] = useState("");
  const [topicPostImageUploading, setTopicPostImageUploading] = useState(false);
  const [topicPostForm, setTopicPostForm] = useState({
    title: "",
    content: "",
    imageUrl: "",
    linkUrl: "",
  });
  const [votingId, setVotingId] = useState("");
  const [ratingProduct, setRatingProduct] = useState(null);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const filtersRef = useRef(null);
  const dragState = useRef({
    dragging: false,
    startX: 0,
    startScrollLeft: 0,
    moved: false,
  });
  const [filterOverflow, setFilterOverflow] = useState({
    hasOverflow: false,
    left: false,
    right: false,
  });
  const [visibleCount, setVisibleCount] = useState(PRODUCT_PAGE_SIZE);
  const [topicVisibleCount, setTopicVisibleCount] = useState(PRODUCT_PAGE_SIZE);
  const sentinelRef = useRef(null);
  const topicSentinelRef = useRef(null);
  const homeScrollRef = useRef(null);
  const topicScrollRef = useRef(null);
  const [topicAll, setTopicAll] = useState([]);
  const [topicRefreshKey, setTopicRefreshKey] = useState(0);
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
  const [editingProductId, setEditingProductId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [submitTopicSuggestOpen, setSubmitTopicSuggestOpen] = useState(false);
  const [submitSelectedTopicId, setSubmitSelectedTopicId] = useState("");
  const [form, setForm] = useState({
    name: "",
    tagline: "",
    url: "",
    categories: [],
    campaign: "",
    description: "",
    imageUrl: "",
    topicName: "",
  });

  const visibleProducts = useMemo(
    () => products.slice(0, visibleCount),
    [products, visibleCount],
  );
  const visibleTopicPosts = useMemo(
    () => topicPosts.slice(0, topicVisibleCount),
    [topicPosts, topicVisibleCount],
  );
  const hasMore = products.length > 0 && visibleCount < products.length;
  const topicHasMore =
    topicPosts.length > 0 && topicVisibleCount < topicPosts.length;
  const homeScopes = useMemo(
    () => [
      { id: "all", label: "全部标签" },
      ...campaigns.map((campaign) => ({
        id: campaign.id,
        label: campaign.title,
      })),
    ],
    [campaigns],
  );
  const filterTags = useMemo(() => {
    const rest = categories.filter((c) => c !== "全部" && c !== "其他");
    return ["全部", ...rest];
  }, [categories]);

  useEffect(() => {
    if (activeCategory === "其他") setActiveCategory("全部");
  }, [activeCategory]);

  useEffect(() => {
    if (!homeScopes.some((scope) => scope.id === activeScope)) {
      setActiveScope("all");
    }
  }, [homeScopes, activeScope]);

  useEffect(() => {
    fetchCategoryOptions()
      .then(({ categories: list }) => setCategories(["全部", ...(list || [])]))
      .catch(() => setCategories(["全部"]));
  }, []);

  useEffect(() => {
    fetchCampaigns()
      .then((list) => setCampaigns(Array.isArray(list) ? list : []))
      .catch(() => setCampaigns([]));
  }, []);

  async function loadProducts(
    category = activeCategory,
    q = appliedSearch,
    scope = activeScope,
  ) {
    try {
      setLoading(true);
      setError("");
      const list = await fetchProducts({
        category,
        campaign: scope === "all" ? "" : scope,
        q,
      });
      setProducts(list);
      setVisibleCount(PRODUCT_PAGE_SIZE);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadTopicPosts(topicId = activeTopicId) {
    if (!topicId) {
      setTopicPosts([]);
      setTopicVisibleCount(PRODUCT_PAGE_SIZE);
      setTopicPostsLoading(false);
      setTopicError("");
      return;
    }
    try {
      setTopicPostsLoading(true);
      setTopicError("");
      const list = await fetchTopicPosts(topicId);
      setTopicPosts(list);
      setTopicVisibleCount(PRODUCT_PAGE_SIZE);
    } catch (err) {
      setTopicError(err.message);
    } finally {
      setTopicPostsLoading(false);
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
      loadProducts(activeCategory, appliedSearch, activeScope);
    }
  }, [activeCategory, activeScope, activeView, appliedSearch]);

  useEffect(() => {
    if (activeView === "topics") {
      loadTopicPosts(activeTopicId);
    }
  }, [activeTopicId, activeView]);

  useEffect(() => {
    setVisibleCount(PRODUCT_PAGE_SIZE);
  }, [activeCategory, activeScope]);

  useEffect(() => {
    if (user && activeView === "my") {
      loadMyProducts();
    }
  }, [activeView, user]);

  // 切换视图（首页/话题/我的提交）时滚动回顶部，配合入场动画
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [activeView]);

  // 加载全部话题（供发布话题联想匹配全部）
  useEffect(() => {
    let cancelled = false;
    fetchTopics({ all: true })
      .then((res) => {
        if (!cancelled) setTopicAll(res?.items || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // 客户端分页：滚动触底自动多展示一页（数据已全部在本地）
  const loadMoreRef = useRef(() => {});
  loadMoreRef.current = () => {
    setVisibleCount((c) => Math.min(c + PRODUCT_PAGE_SIZE, products.length));
  };

  const loadMoreTopicRef = useRef(() => {});
  loadMoreTopicRef.current = () => {
    setTopicVisibleCount((c) =>
      Math.min(c + PRODUCT_PAGE_SIZE, topicPosts.length),
    );
  };

  // 内部容器可滚动时用它做 root；否则（如窄屏 overflow:visible）用视口
  function getScrollObserverRoot(scrollEl) {
    if (!scrollEl) return null;
    return scrollEl.scrollHeight > scrollEl.clientHeight + 1 ? scrollEl : null;
  }

  function isNearScrollBottom(scrollEl, sentinelEl, margin = 160) {
    const rect = sentinelEl.getBoundingClientRect();
    const root = getScrollObserverRoot(scrollEl);
    if (root) {
      const rootRect = root.getBoundingClientRect();
      return rect.top <= rootRect.bottom + margin;
    }
    return rect.top <= window.innerHeight + margin;
  }

  useEffect(() => {
    if (!hasMore) return undefined;
    const el = sentinelRef.current;
    const scrollEl = homeScrollRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMoreRef.current();
      },
      { root: getScrollObserverRoot(scrollEl), rootMargin: "160px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, visibleCount, products.length]);

  useEffect(() => {
    if (!topicHasMore) return undefined;
    const el = topicSentinelRef.current;
    const scrollEl = topicScrollRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMoreTopicRef.current();
      },
      { root: getScrollObserverRoot(scrollEl), rootMargin: "160px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [topicHasMore, topicVisibleCount, topicPosts.length]);

  // 哨兵仍在可视区时继续展开（IO 只在交叉状态变化时回调）
  useEffect(() => {
    if (!hasMore) return undefined;
    const el = sentinelRef.current;
    const scrollEl = homeScrollRef.current;
    if (!el) return undefined;
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      if (!cancelled && isNearScrollBottom(scrollEl, el)) {
        loadMoreRef.current();
      }
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [visibleCount, products.length, hasMore]);

  useEffect(() => {
    if (!topicHasMore) return undefined;
    const el = topicSentinelRef.current;
    const scrollEl = topicScrollRef.current;
    if (!el) return undefined;
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      if (!cancelled && isNearScrollBottom(scrollEl, el)) {
        loadMoreTopicRef.current();
      }
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [topicVisibleCount, topicPosts.length, topicHasMore]);

  function requireLogin() {
    if (!user) {
      navigate("/login");
      return false;
    }
    return true;
  }

  function openSubmitModal() {
    if (!requireLogin()) return;
    setEditingProductId("");
    setSubmitError("");
    setSubmitSelectedTopicId("");
    setSubmitTopicSuggestOpen(false);
    setForm({
      name: "",
      tagline: "",
      url: "",
      categories: [],
      campaign: "",
      description: "",
      imageUrl: "",
      topicName: "",
    });
    setShowSubmitModal(true);
    fetchTopics({ all: true })
      .then((res) => setTopicAll(res?.items || []))
      .catch(() => {});
  }

  function openEditProductModal(product) {
    if (!requireLogin()) return;
    if (!product?.id) return;
    setEditingProductId(product.id);
    setSubmitError("");
    setSubmitTopicSuggestOpen(false);
    setSubmitSelectedTopicId(product.topicId || "");
    setForm({
      name: product.name || "",
      tagline: product.tagline || "",
      url: product.url || "",
      categories: product.categories?.length
        ? product.categories
        : product.category
          ? [product.category]
          : [],
      campaign: product.campaign || "",
      description: product.description || "",
      imageUrl: product.imageUrl || "",
      topicName: product.topicName || "",
    });
    setShowSubmitModal(true);
    fetchTopics({ all: true })
      .then((res) => {
        const items = res?.items || [];
        setTopicAll(items);
        if (!product.topicName && product.topicId) {
          const hit = items.find((t) => t.id === product.topicId);
          if (hit) {
            setForm((prev) => ({ ...prev, topicName: hit.name || "" }));
            setSubmitSelectedTopicId(hit.id);
          }
        }
      })
      .catch(() => {});
  }

  function closeSubmitModal() {
    if (submitting) return;
    setShowSubmitModal(false);
    setEditingProductId("");
    setSubmitError("");
    setSubmitSelectedTopicId("");
    setSubmitTopicSuggestOpen(false);
  }

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleSubmitCategory(category) {
    setForm((prev) => {
      const list = Array.isArray(prev.categories) ? prev.categories : [];
      if (list.includes(category)) {
        return { ...prev, categories: list.filter((c) => c !== category) };
      }
      return { ...prev, categories: [...list, category] };
    });
    setSubmitError("");
  }

  function handleSubmitTopicNameChange(value) {
    setSubmitSelectedTopicId("");
    updateForm("topicName", value);
    setSubmitTopicSuggestOpen(value.trim().length > 0);
  }

  function handlePickSubmitTopic(topic) {
    setSubmitSelectedTopicId(topic.id);
    updateForm("topicName", topic.name);
    setSubmitTopicSuggestOpen(false);
    setSubmitError("");
  }

  function submitTopicSuggestions() {
    const q = (form.topicName || "").trim().toLowerCase();
    if (!q) return [];
    return topicAll.filter((t) => t.name.toLowerCase().includes(q)).slice(0, 8);
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
      setSubmitError("请填写资源名称");
      return;
    }
    if (!trimmedTagline) {
      setSubmitError("请填写一句话介绍");
      return;
    }
    if (!trimmedUrl) {
      setSubmitError("请填写演示链接");
      return;
    }
    if (!/^https?:\/\/.+/i.test(trimmedUrl)) {
      setSubmitError("演示链接需以 http:// 或 https:// 开头");
      return;
    }
    if (!(form.categories || []).length) {
      setSubmitError("请至少选择一个分类");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError("");

      const isEditing = Boolean(editingProductId);
      const payload = {
        name: form.name,
        tagline: form.tagline,
        url: form.url,
        categories: form.categories || [],
        campaign: form.campaign || "",
        description: form.description,
        imageUrl: form.imageUrl,
        topicId: submitSelectedTopicId || "",
        topicName: (form.topicName || "").trim(),
      };
      const result = isEditing
        ? await updateProduct(editingProductId, payload)
        : await submitProduct(payload);
      setShowSubmitModal(false);
      setEditingProductId("");
      setSubmitSelectedTopicId("");
      setSubmitTopicSuggestOpen(false);
      setForm({
        name: "",
        tagline: "",
        url: "",
        categories: [],
        campaign: "",
        description: "",
        imageUrl: "",
        topicName: "",
      });
      toast.success(
        isEditing ? "保存成功" : "上传成功",
        result.message &&
          result.message !== "保存成功" &&
          result.message !== "上传成功"
          ? result.message
          : "",
      );
      if (isEditing || !isAdmin) {
        setSearchParams({ view: "my" });
        await loadMyProducts();
      }
      if (isAdmin && !isEditing) {
        setSearchParams({});
        await loadProducts(activeCategory, appliedSearch, activeScope);
      } else if (isAdmin && isEditing) {
        await loadProducts(activeCategory, appliedSearch, activeScope);
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
    const hasOverflow = maxLeft > 2;
    setFilterOverflow({
      hasOverflow,
      left: hasOverflow && el.scrollLeft > 2,
      right: hasOverflow && el.scrollLeft < maxLeft - 2,
    });
  }

  useEffect(() => {
    updateFilterOverflow();
    window.addEventListener("resize", updateFilterOverflow);
    const el = filtersRef.current;
    let observer;
    if (el && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(updateFilterOverflow);
      observer.observe(el);
    }
    return () => {
      window.removeEventListener("resize", updateFilterOverflow);
      observer?.disconnect();
    };
  }, [filterTags]);

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

  function handleSearchSubmit() {
    setAppliedSearch(searchQuery.trim());
    setVisibleCount(PRODUCT_PAGE_SIZE);
    document
      .getElementById("resource-list")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  function selectScope(scopeId) {
    setActiveScope(scopeId);
    setActiveCategory("全部");
    setAppliedSearch("");
    setSearchQuery("");
  }

  function selectCategory(category, e) {
    setAppliedSearch("");
    setSearchQuery("");
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
    const bare = bareTopicName(name);
    const next = new URLSearchParams();
    next.set("view", "topics");
    if (topicId) next.set("topic", topicId);
    if (bare) next.set("topicName", bare);
    // push 进历史，浏览器返回可回到上一层
    setSearchParams(next);
  }

  // URL 为视图真相来源：支持浏览器前进/后退
  useEffect(() => {
    const viewParam = searchParams.get("view");
    const topicId = (searchParams.get("topic") || "").trim();
    const topicName = bareTopicName(searchParams.get("topicName") || "");

    let nextView = "home";
    if (viewParam === "my") nextView = "my";
    else if (viewParam === "topics" || topicId || topicName)
      nextView = "topics";

    setActiveView(nextView);

    if (nextView !== "topics") {
      setActiveTopicId("");
      setSelectedTopic(null);
      return;
    }

    if (topicId) {
      setActiveTopicId(topicId);
      setSelectedTopic((prev) =>
        prev?.id === topicId
          ? prev
          : { id: topicId, name: topicName || prev?.name || "" },
      );
      return;
    }

    if (!topicName) {
      setActiveTopicId("");
      setSelectedTopic(null);
      return;
    }

    const existing = topicAll.find(
      (t) => bareTopicName(t.name).toLowerCase() === topicName.toLowerCase(),
    );
    if (existing) {
      setActiveTopicId(existing.id);
      setSelectedTopic({ id: existing.id, name: existing.name });
      const next = new URLSearchParams();
      next.set("view", "topics");
      next.set("topic", existing.id);
      next.set("topicName", bareTopicName(existing.name));
      setSearchParams(next, { replace: true });
      return;
    }

    let cancelled = false;
    fetchTopics({ all: true, q: topicName })
      .then((res) => {
        if (cancelled) return;
        const items = res?.items || [];
        const hit =
          items.find(
            (t) =>
              bareTopicName(t.name).toLowerCase() === topicName.toLowerCase(),
          ) || null;
        if (hit) {
          const next = new URLSearchParams();
          next.set("view", "topics");
          next.set("topic", hit.id);
          next.set("topicName", bareTopicName(hit.name));
          setSearchParams(next, { replace: true });
        } else {
          setActiveTopicId("");
          setSelectedTopic(null);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, topicAll]);

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
    return topicAll.filter((t) => t.name.toLowerCase().includes(q)).slice(0, 8);
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
      const existing = topicAll.find((t) => t.id === selectedTopicId);
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
      setTopicAll((prev) =>
        [...prev, result.topic].sort((a, b) => b.productCount - a.productCount),
      );
      setTopicRefreshKey((k) => k + 1);
      selectTopic(result.topic.id, result.topic.name);
      toast.success("发布成功", `话题「${name}」已创建`);
    } catch (err) {
      setCreateTopicError(err.message);
    } finally {
      setCreatingTopic(false);
    }
  }

  function handleMainViewChange(viewId) {
    if (viewId === "topics") {
      setSearchParams({ view: "topics" });
    } else if (viewId === "my") {
      setSearchParams({ view: "my" });
    } else {
      setSearchParams({});
    }
  }

  function openTopicPostModal() {
    if (!requireLogin()) return;
    if (!activeTopicId) return;
    setTopicPostError("");
    setTopicPostForm({ title: "", content: "", imageUrl: "", linkUrl: "" });
    setShowTopicPostModal(true);
  }

  function closeTopicPostModal() {
    if (topicPostSubmitting) return;
    setShowTopicPostModal(false);
    setTopicPostError("");
  }

  function updateTopicPostForm(key, value) {
    setTopicPostForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleTopicPostImageChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/^image\/(jpeg|png|gif|webp)$/i.test(file.type)) {
      setTopicPostError("仅支持 JPG / PNG / GIF / WebP 图片");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setTopicPostError("图片不能超过 2MB");
      return;
    }
    try {
      setTopicPostImageUploading(true);
      setTopicPostError("");
      const { url } = await uploadImage(file);
      updateTopicPostForm("imageUrl", url);
    } catch (err) {
      setTopicPostError(err.message);
    } finally {
      setTopicPostImageUploading(false);
    }
  }

  async function handleTopicPostSubmit(e) {
    e.preventDefault();
    const title = topicPostForm.title.trim();
    const content = topicPostForm.content.trim();
    const linkUrl = topicPostForm.linkUrl.trim();
    if (!title) {
      setTopicPostError("请填写标题");
      return;
    }
    if (!content) {
      setTopicPostError("请填写正文");
      return;
    }
    if (linkUrl && !/^https?:\/\/.+/i.test(linkUrl)) {
      setTopicPostError("链接需以 http:// 或 https:// 开头");
      return;
    }
    try {
      setTopicPostSubmitting(true);
      setTopicPostError("");
      const result = await submitTopicPost(activeTopicId, {
        title,
        content,
        imageUrl: topicPostForm.imageUrl,
        linkUrl,
      });
      setShowTopicPostModal(false);
      setTopicPostForm({ title: "", content: "", imageUrl: "", linkUrl: "" });
      toast.success(
        "发布成功",
        result.message && result.message !== "发布成功" ? result.message : "",
      );
      await loadTopicPosts(activeTopicId);
    } catch (err) {
      setTopicPostError(err.message);
    } finally {
      setTopicPostSubmitting(false);
    }
  }

  async function handleTopicPostLike(post) {
    if (!requireLogin()) return;
    try {
      setTopicPostLikeId(post.id);
      const result = await likeTopicPost(post.id);
      setTopicPosts((prev) =>
        prev.map((item) =>
          item.id === post.id
            ? { ...item, likedByMe: result.liked, likeCount: result.likeCount }
            : item,
        ),
      );
    } catch (err) {
      toast.error("操作失败", err.message);
    } finally {
      setTopicPostLikeId("");
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
            : item,
        ),
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
          <Link to="/" className="ph-logo">
            <BrandLogo />
          </Link>

          <MainViewTabNav
            activeView={activeView}
            onChange={handleMainViewChange}
          />

          <div className="ph-nav-actions">
            {user ? (
              <>
                <span className="ph-user-badge">
                  {user.nickname || user.username}
                </span>
                {isAdmin && (
                  <Link to="/admin" className="ph-nav-ghost">
                    管理后台
                  </Link>
                )}
                <button
                  type="button"
                  className={
                    "ph-nav-ghost" + (activeView === "my" ? " active" : "")
                  }
                  onClick={() => setSearchParams({ view: "my" })}
                >
                  我的上传
                </button>
                <button type="button" className="ph-nav-ghost" onClick={logout}>
                  退出
                </button>
                <button
                  type="button"
                  className="ph-nav-primary"
                  onClick={openSubmitModal}
                >
                  发布应用
                </button>
                <button
                  type="button"
                  className="ph-nav-secondary"
                  onClick={openCreateTopicModal}
                >
                  发布话题
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
                  发布应用
                </button>
                <button
                  type="button"
                  className="ph-nav-secondary"
                  onClick={openCreateTopicModal}
                >
                  发布话题
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {activeView === "home" && <Carousel />}

      <MainViewSwitch
        activeView={activeView}
        home={
          <>
            <section className="ph-page-header">
              <div className="ph-section-inner">
                <div className="ph-page-header-inner">
                  <p className="ph-page-eyebrow">
                    <span className="ph-page-eyebrow-dot" aria-hidden="true" />
                    今日精选 · {formatHeroDate()}
                  </p>
                  <h1 className="ph-page-title">
                    发现好作品，
                    <span className="ph-page-title-accent">为创新投票</span>
                  </h1>
                  <p className="ph-page-desc">
                    <span className="ph-page-desc-brand">Vibe Building</span>
                    <span className="ph-page-desc-sep" aria-hidden="true">
                      ·
                    </span>
                    人人都可以成为开发者，构建自己的应用
                  </p>
                  <div className="ph-page-header-actions">
                    <div className="ph-page-header-cta">
                      <button
                        type="button"
                        className="ph-btn-primary ph-btn-hero"
                        onClick={openSubmitModal}
                      >
                        <Sparkles
                          size={16}
                          strokeWidth={2.2}
                          aria-hidden="true"
                        />
                        发布应用
                      </button>
                      <button
                        type="button"
                        className="ph-btn-secondary ph-btn-hero"
                        onClick={openCreateTopicModal}
                      >
                        发布话题
                      </button>
                    </div>
                    <p className="ph-hero-hint">
                      <span>免费提交</span>
                      <span className="ph-hero-hint-dot" aria-hidden="true" />
                      <span>社区投票冲榜</span>
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="ph-section">
              <div className="ph-section-inner">
                <div className="ph-all-section" id="resource-list">
                  <div className="ph-all-box">
                    <div
                      className="ph-scope-tabs"
                      role="tablist"
                      aria-label="资源范围"
                    >
                      {homeScopes.map((scope) => (
                        <button
                          key={scope.id}
                          type="button"
                          role="tab"
                          aria-selected={scope.id === activeScope}
                          className={
                            "ph-scope-tab" +
                            (scope.id === activeScope ? " active" : "") +
                            (scope.id !== "all"
                              ? " ph-scope-tab--campaign"
                              : "")
                          }
                          onClick={() => selectScope(scope.id)}
                        >
                          {scope.id !== "all" && (
                            <span
                              className="ph-scope-tab-dot"
                              aria-hidden="true"
                            />
                          )}
                          <span className="ph-scope-tab-label">
                            {scope.label}
                          </span>
                        </button>
                      ))}
                    </div>

                    <ResourceSearchBar
                      value={searchQuery}
                      onChange={setSearchQuery}
                      onSubmit={handleSearchSubmit}
                    />
                    {appliedSearch && (
                      <p className="ph-search-active">
                        搜索「{appliedSearch}」共 {products.length} 条结果
                      </p>
                    )}

                    <div
                      className={
                        "ph-filters-wrap" +
                        (filterOverflow.hasOverflow ? " has-overflow" : "")
                      }
                    >
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
                        {filterTags.map((category) => (
                          <button
                            key={category}
                            type="button"
                            role="tab"
                            aria-selected={category === activeCategory}
                            className={[
                              "ph-filter",
                              category === activeCategory ? "active" : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            onClick={(e) => selectCategory(category, e)}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                      {filterOverflow.hasOverflow && (
                        <>
                          <span
                            className={
                              "ph-filters-fade left" +
                              (filterOverflow.left ? "" : " is-edge")
                            }
                            aria-hidden="true"
                          />
                          <span
                            className={
                              "ph-filters-fade right" +
                              (filterOverflow.right ? "" : " is-edge")
                            }
                            aria-hidden="true"
                          />
                        </>
                      )}
                    </div>

                    <div className="ph-all-box-scroll" ref={homeScrollRef}>
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
                            appliedSearch
                              ? `未找到「${appliedSearch}」相关资源`
                              : activeScope !== "all"
                                ? `暂无${homeScopes.find((s) => s.id === activeScope)?.label || "活动"}资源`
                                : activeCategory !== "全部"
                                  ? "该分类下还没有资源"
                                  : "还没有资源，来上传第一个吧"
                          }
                          action={
                            <button
                              type="button"
                              className="ph-empty-link"
                              onClick={openSubmitModal}
                            >
                              成为第一个上传者 →
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
                                showStats
                                size="md"
                              />
                            ))}
                          </div>

                          {hasMore ? (
                            <div
                              className="ph-loadmore-sentinel"
                              ref={sentinelRef}
                              aria-hidden="true"
                            />
                          ) : (
                            products.length > 0 && (
                              <div className="ph-loadmore-done">
                                — 已经到底了 —
                              </div>
                            )
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <aside className="ph-sidebar">
                    <RankList />
                  </aside>
                </div>
              </div>
            </section>
          </>
        }
        topics={
          <div className="ph-section-inner">
            <div className="ph-all-section">
              <div className="ph-all-box">
                {!activeTopicId ? (
                  <div className="ph-topic-toolbar">
                    <div className="ph-topic-explore-head">
                      <h2 className="ph-topic-explore-title">发现话题</h2>
                      <p className="ph-topic-explore-hint">
                        浏览热门话题，点击顶部「创建话题」发起讨论
                      </p>
                    </div>
                    <button
                      type="button"
                      className="ph-btn-secondary ph-topic-create-toolbar-btn"
                      onClick={openCreateTopicModal}
                    >
                      创建话题
                    </button>
                  </div>
                ) : (
                  <TopicDetailPanel
                    topicId={activeTopicId}
                    onPublish={openTopicPostModal}
                  />
                )}

                <div className="ph-all-box-scroll" ref={topicScrollRef}>
                  <div className="ph-topic-filter">
                    {topicError && <div className="error">{topicError}</div>}

                    {!activeTopicId ? (
                      <TopicExplore
                        onSelectTopic={selectTopic}
                        refreshKey={topicRefreshKey}
                      />
                    ) : topicPostsLoading ? (
                      <div className="ph-topic-post-list">
                        {Array.from({ length: 4 }).map((_, index) => (
                          <TopicPostCardSkeleton key={index} />
                        ))}
                      </div>
                    ) : topicPosts.length === 0 ? (
                      <EmptyState
                        icon={<Inbox />}
                        title="该话题下还没有内容"
                        description="成为第一个分享者，发布经验、教程或观点"
                        action={
                          <button
                            type="button"
                            className="ph-empty-link"
                            onClick={openTopicPostModal}
                          >
                            发布第一条内容 →
                          </button>
                        }
                      />
                    ) : (
                      <>
                        <div className="ph-topic-post-list">
                          {visibleTopicPosts.map((post) => (
                            <TopicPostCard
                              key={post.id}
                              post={post}
                              onLike={handleTopicPostLike}
                              likeBusy={topicPostLikeId === post.id}
                            />
                          ))}
                        </div>

                        {topicHasMore ? (
                          <div
                            className="ph-loadmore-sentinel"
                            ref={topicSentinelRef}
                            aria-hidden="true"
                          />
                        ) : (
                          topicPosts.length > 0 && (
                            <div className="ph-loadmore-done">
                              — 已经到底了 —
                            </div>
                          )
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              <aside className="ph-sidebar">
                <TopicRankList
                  activeTopicId={activeTopicId}
                  onSelectTopic={(topicId, name) => selectTopic(topicId, name)}
                  refreshKey={topicRefreshKey}
                />
              </aside>
            </div>
          </div>
        }
      />

      {activeView === "my" && (
        <main key="my" className="ph-section ph-view-enter">
          <div className="ph-section-inner">
            <div className="ph-my-toolbar">
              <h2 className="ph-section-title">我的上传</h2>
            </div>
            {error && <div className="error">{error}</div>}
            <MyProductsList
              products={myProducts}
              loading={myLoading}
              onSubmit={openSubmitModal}
              onEdit={openEditProductModal}
            />
          </div>
        </main>
      )}

      <footer className="ph-footer">
        <div className="ph-section-inner">
          <div className="ph-footer-brand">
            <BrandLogo small showText={false} />
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
                  <h2 id="submit-modal-title">
                    {editingProductId ? "编辑资源" : "上传你的资源"}
                  </h2>
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
                  <span>封面图</span>
                  <div className="ph-upload">
                    {form.imageUrl ? (
                      <div className="ph-upload-preview">
                        <img src={form.imageUrl} alt="封面图预览" />
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
                        <Upload
                          className="ph-upload-icon"
                          size={26}
                          aria-hidden="true"
                        />
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
                    资源名称 <span className="field-required">*</span>
                  </span>
                  <input
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    placeholder="例如：代码审查专家、Notion 链接器"
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
                    placeholder="用一句话说清这个资源能做什么"
                    maxLength={100}
                    disabled={submitting}
                    required
                  />
                </label>

                <label className="modal-field">
                  <span>
                    演示链接 <span className="field-required">*</span>
                  </span>
                  <input
                    value={form.url}
                    onChange={(e) => updateForm("url", e.target.value)}
                    placeholder="https://github.com/... 或在线演示地址"
                    disabled={submitting}
                    required
                  />
                </label>

                <div className="modal-field">
                  <span>
                    分类 <span className="field-required">*</span>
                    <span className="field-hint">（可多选）</span>
                  </span>
                  <div className="modal-category-options">
                    {categories
                      .filter((c) => c !== "全部")
                      .map((category) => {
                        const selected = (form.categories || []).includes(
                          category,
                        );
                        return (
                          <button
                            key={category}
                            type="button"
                            className={
                              selected
                                ? "modal-category active"
                                : "modal-category"
                            }
                            onClick={() => toggleSubmitCategory(category)}
                            disabled={submitting}
                            aria-pressed={selected}
                          >
                            {category}
                          </button>
                        );
                      })}
                  </div>
                </div>

                {campaigns.length > 0 && (
                  <div className="modal-field">
                    <span>
                      活动
                      <span className="field-hint">（可选）</span>
                    </span>
                    <div className="modal-category-options">
                      <button
                        type="button"
                        className={
                          !form.campaign
                            ? "modal-category active"
                            : "modal-category"
                        }
                        onClick={() => updateForm("campaign", "")}
                        disabled={submitting}
                        aria-pressed={!form.campaign}
                      >
                        不参加
                      </button>
                      {campaigns.map((campaign) => {
                        const selected = form.campaign === campaign.id;
                        return (
                          <button
                            key={campaign.id}
                            type="button"
                            className={
                              selected
                                ? "modal-category active"
                                : "modal-category"
                            }
                            onClick={() =>
                              updateForm(
                                "campaign",
                                selected ? "" : campaign.id,
                              )
                            }
                            disabled={submitting}
                            aria-pressed={selected}
                          >
                            {campaign.title}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="modal-field">
                  <label className="modal-label" htmlFor="submit-topic-name">
                    话题
                  </label>
                  <div className="topic-input-wrap">
                    <input
                      id="submit-topic-name"
                      className="modal-input"
                      placeholder="输入话题名称，如：AI 创作、独立开发…"
                      value={form.topicName}
                      maxLength={30}
                      autoComplete="off"
                      disabled={submitting}
                      onChange={(e) =>
                        handleSubmitTopicNameChange(e.target.value)
                      }
                      onFocus={() =>
                        setSubmitTopicSuggestOpen(
                          (form.topicName || "").trim().length > 0,
                        )
                      }
                      onBlur={() =>
                        setTimeout(() => setSubmitTopicSuggestOpen(false), 120)
                      }
                    />
                    {submitSelectedTopicId && (
                      <span className="topic-input-picked">已选话题</span>
                    )}
                    {submitTopicSuggestOpen && (
                      <div className="topic-suggest" role="listbox">
                        {submitTopicSuggestions().length > 0 ? (
                          submitTopicSuggestions().map((topic) => (
                            <button
                              type="button"
                              key={topic.id}
                              className="topic-suggest-item"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => handlePickSubmitTopic(topic)}
                            >
                              <span className="topic-suggest-info">
                                <span className="topic-suggest-name">
                                  #{topic.name}
                                </span>
                                <span className="topic-suggest-meta">
                                  {topic.postCount ?? 0} 条内容 · 点击选用
                                </span>
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="topic-suggest-item topic-suggest-empty">
                            {(form.topicName || "").trim()
                              ? "无匹配话题，提交时将自动新建"
                              : "输入关键词搜索话题"}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <label className="modal-field">
                  <span>详细介绍</span>
                  <textarea
                    value={form.description}
                    onChange={(e) => updateForm("description", e.target.value)}
                    placeholder="资源的能力说明、适用场景、使用方式（选填）"
                    rows={4}
                    maxLength={500}
                    disabled={submitting}
                  />
                </label>

                {submitError && (
                  <div className="modal-error">{submitError}</div>
                )}

                <div className="modal-actions">
                  <button
                    type="button"
                    className="modal-btn secondary"
                    onClick={closeSubmitModal}
                    disabled={submitting}
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="modal-btn primary"
                    disabled={submitting}
                  >
                    {submitting
                      ? editingProductId
                        ? "保存中..."
                        : "上传中..."
                      : editingProductId
                        ? "保存修改"
                        : isAdmin
                          ? "立即发布"
                          : "提交审核"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
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
                      placeholder="输入话题名称，如：AI 创作、独立开发…"
                      value={topicForm.name}
                      maxLength={30}
                      autoComplete="off"
                      onChange={(e) => handleTopicNameChange(e.target.value)}
                      onFocus={() =>
                        setTopicSuggestOpen(
                          (topicForm.name || "").trim().length > 0,
                        )
                      }
                      onBlur={() =>
                        setTimeout(() => setTopicSuggestOpen(false), 120)
                      }
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
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => handlePickTopic(topic)}
                            >
                              <span className="topic-suggest-info">
                                <span className="topic-suggest-name">
                                  {formatTopicName(topic.name)}
                                </span>
                                <span className="topic-suggest-meta">
                                  {topic.productCount ?? 0} 条内容
                                </span>
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="topic-suggest-empty">
                            <SearchX
                              className="topic-suggest-empty-icon"
                              aria-hidden="true"
                            />
                            <span>没有匹配的话题，可直接创建新话题</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
                    onChange={(e) =>
                      updateTopicForm("description", e.target.value)
                    }
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

                {createTopicError && (
                  <div className="modal-error">{createTopicError}</div>
                )}

                <div className="modal-actions">
                  <button
                    type="button"
                    className="modal-btn secondary"
                    onClick={closeCreateTopicModal}
                    disabled={creatingTopic}
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="modal-btn primary"
                    disabled={creatingTopic}
                  >
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
          document.body,
        )}

      <TopicPostUploadModal
        open={showTopicPostModal}
        topicName={selectedTopic?.name || ""}
        submitting={topicPostSubmitting}
        error={topicPostError}
        form={topicPostForm}
        imageUploading={topicPostImageUploading}
        onClose={closeTopicPostModal}
        onChange={updateTopicPostForm}
        onImageChange={handleTopicPostImageChange}
        onSubmit={handleTopicPostSubmit}
      />

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
