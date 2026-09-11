import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Upload, Inbox, SearchX } from "lucide-react";
import { useAuth } from "./AuthContext";
import { useToast } from "./Toast";
import { redirectToLogin } from "./authRedirect";
import { useModalMotion } from "./useModalMotion";
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
  unpublishProduct,
  uploadImage,
  voteProduct,
} from "./api";
import EmptyState from "./components/EmptyState";
import ProductCard, { ProductCardSkeleton } from "./components/ProductCard";
import RatingModal from "./components/RatingModal";
import TopicRankList from "./components/TopicRankList";
import TopicDetailPanel from "./components/TopicDetailPanel";
import TopicExplore from "./components/TopicExplore";
import TopicPostCard, {
  TopicPostCardSkeleton,
} from "./components/TopicPostCard";
import TopicPostUploadModal from "./components/TopicPostUploadModal";
import ResourceSearchBar from "./components/ResourceSearchBar";
import CampaignZone from "./components/CampaignZone";
import MainViewSwitch, { MainViewTabNav } from "./components/MainViewSwitch";
import BrandLogo from "./components/BrandLogo";
import PortalHome from "./components/PortalHome";
import MyWorkspace from "./components/MyWorkspace";
import BuildWizardModal from "./components/BuildWizardModal";
import PromoteWizardModal from "./components/PromoteWizardModal";
import PeriodRankBoard from "./components/PeriodRankBoard";
import { BUILD_SCENES, BUILD_TOOLS, getSceneById, getToolById, heatScore, inferSceneIdFromText } from "./buildConfig";
import { bareTopicName, formatTopicName } from "./topicUtils";
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
  const { user, isAdmin, logout, loading: authLoading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [topicPosts, setTopicPosts] = useState([]);
  const [categories, setCategories] = useState(["全部"]);
  const [campaigns, setCampaigns] = useState([]);
  const [activeCategory, setActiveCategory] = useState("全部");
  const [squareScene, setSquareScene] = useState("all");
  const [squareSort, setSquareSort] = useState("hot");
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
  const [unpublishingId, setUnpublishingId] = useState("");
  const [showBuildWizard, setShowBuildWizard] = useState(false);
  const [showPromoteWizard, setShowPromoteWizard] = useState(false);
  const [draftRefreshKey, setDraftRefreshKey] = useState(0);

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const submitModalMotion = useModalMotion(showSubmitModal);
  const [editingProductId, setEditingProductId] = useState("");
  const [submitReturnCampaignId, setSubmitReturnCampaignId] = useState("");
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
    sceneId: "",
    sceneTopic: "",
    buildToolId: "",
  });

  const submitScene = useMemo(() => getSceneById(form.sceneId), [form.sceneId]);
  const submitSceneTopics = submitScene?.topics || [];

  const visibleProducts = useMemo(() => {
    let list = [...products];
    if (squareScene !== "all") {
      list = list.filter((p) => {
        const sid = inferSceneIdFromText(
          `${p.topicName || ""}\n${p.name || ""}\n${p.tagline || ""}\n${p.description || ""}`,
        );
        return sid === squareScene;
      });
    }
    if (squareSort === "new") {
      list.sort((a, b) =>
        String(b.submittedAt || "").localeCompare(String(a.submittedAt || "")),
      );
    } else if (squareSort === "likes") {
      list.sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));
    } else {
      list.sort((a, b) => heatScore(b) - heatScore(a));
    }
    return list.slice(0, visibleCount);
  }, [products, visibleCount, squareScene, squareSort]);
  const visibleTopicPosts = useMemo(
    () => topicPosts.slice(0, topicVisibleCount),
    [topicPosts, topicVisibleCount],
  );
  const hasMore = products.length > 0 && visibleCount < products.length;
  const topicHasMore =
    topicPosts.length > 0 && topicVisibleCount < topicPosts.length;
  const filterTags = useMemo(() => {
    const rest = categories.filter((c) => c !== "全部" && c !== "其他");
    return ["全部", ...rest];
  }, [categories]);

  useEffect(() => {
    if (activeCategory === "其他") setActiveCategory("全部");
  }, [activeCategory]);

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

  async function loadProducts(category = activeCategory, q = appliedSearch) {
    try {
      setLoading(true);
      setError("");
      const list = await fetchProducts({
        category,
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

  async function handleUnpublishProduct(product) {
    if (!product?.id) return;
    if (
      !window.confirm(
        `确定下架「${product.name}」吗？下架后将从应用广场隐藏，可稍后编辑并重新提交审核。`,
      )
    ) {
      return;
    }
    try {
      setUnpublishingId(product.id);
      setError("");
      await unpublishProduct(product.id);
      toast.success("已下架", `「${product.name}」已从广场隐藏`);
      await loadMyProducts();
    } catch (err) {
      toast.error("下架失败", err.message || "请稍后重试");
    } finally {
      setUnpublishingId("");
    }
  }

  useEffect(() => {
    if (activeView === "square") {
      loadProducts(activeCategory, appliedSearch);
    }
  }, [activeCategory, activeView, appliedSearch]);

  useEffect(() => {
    if (activeView === "topics") {
      loadTopicPosts(activeTopicId);
    }
  }, [activeTopicId, activeView]);

  useEffect(() => {
    setVisibleCount(PRODUCT_PAGE_SIZE);
  }, [activeCategory]);

  useEffect(() => {
    if (user && activeView === "my") {
      loadMyProducts();
    }
  }, [activeView, user]);

  useEffect(() => {
    if (authLoading) return;
    if (activeView === "my" && !user) {
      redirectToLogin(navigate, "/?view=my");
    }
  }, [activeView, user, navigate, authLoading]);

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
      redirectToLogin(navigate);
      return false;
    }
    return true;
  }

  function openSubmitModal(presetCampaignId = "", preset = null) {
    if (!requireLogin()) return;
    const campaignId =
      typeof presetCampaignId === "string" ? presetCampaignId.trim() : "";
    const seed = preset && typeof preset === "object" ? preset : null;
    const sceneId =
      seed?.sceneId ||
      inferSceneIdFromText(`${seed?.scene || ""}\n${seed?.sceneTopic || seed?.topicName || ""}`) ||
      "";
    const sceneTopic = seed?.sceneTopic || seed?.topicName || "";
    const buildToolId =
      seed?.buildToolId ||
      BUILD_TOOLS.find((t) => t.name === seed?.buildTool)?.id ||
      "";
    setEditingProductId("");
    setSubmitError("");
    setSubmitSelectedTopicId("");
    setSubmitTopicSuggestOpen(false);
    setSubmitReturnCampaignId(campaignId);
    setForm({
      name: seed?.name || "",
      tagline: seed?.tagline || "",
      url: seed?.url && seed.url !== "https://" ? seed.url : "",
      categories: Array.isArray(seed?.categories) ? seed.categories : [],
      campaign: campaignId || seed?.campaign || "",
      description: seed?.description || "",
      imageUrl: seed?.imageUrl || "",
      topicName: sceneTopic || seed?.topicName || "",
      sceneId,
      sceneTopic,
      buildToolId,
    });
    setShowSubmitModal(true);
    fetchTopics({ all: true })
      .then((res) => setTopicAll(res?.items || []))
      .catch(() => {});
  }

  function openBuildWizard() {
    if (!requireLogin()) return;
    setShowBuildWizard(true);
  }

  function openPromoteWizard() {
    if (!requireLogin()) return;
    loadMyProducts();
    setShowPromoteWizard(true);
  }

  function goMyWorkspace(action) {
    if (!requireLogin()) return;
    setSearchParams({ view: "my" });
    if (action === "build") {
      setTimeout(() => setShowBuildWizard(true), 0);
    } else if (action === "publish") {
      setTimeout(() => openSubmitModal(), 0);
    } else if (action === "promote") {
      setTimeout(() => openPromoteWizard(), 0);
    }
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
      sceneId:
        inferSceneIdFromText(
          `${product.topicName || ""}\n${product.description || ""}\n${product.name || ""}`,
        ) || "",
      sceneTopic: product.topicName || "",
      buildToolId:
        BUILD_TOOLS.find((t) =>
          String(product.description || "").includes(t.name),
        )?.id || "",
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
    setSubmitReturnCampaignId("");
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
    const scene = getSceneById(form.sceneId);
    const tool = getToolById(form.buildToolId);
    const sceneTopic = (form.sceneTopic || form.topicName || "").trim();

    if (!trimmedName) {
      setSubmitError("请填写应用名称");
      return;
    }
    if (!trimmedTagline) {
      setSubmitError("请填写一句话简介");
      return;
    }
    if (!form.sceneId || !scene) {
      setSubmitError("请选择所属场景");
      return;
    }
    if (!sceneTopic) {
      setSubmitError("请选择场景话题");
      return;
    }
    if (!trimmedUrl) {
      setSubmitError("请填写应用访问链接");
      return;
    }
    if (!/^https?:\/\/.+/i.test(trimmedUrl)) {
      setSubmitError("应用访问链接需以 http:// 或 https:// 开头");
      return;
    }
    if (!form.buildToolId || !tool) {
      setSubmitError("请选择构建工具");
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
      const metaLines = [
        `【场景】${scene.name}`,
        `【场景话题】${sceneTopic}`,
        `【构建工具】${tool.name}`,
        tool.inviteCode ? `【推广码】${tool.inviteCode}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      const baseDesc = String(form.description || "").trim();
      const description = baseDesc.includes("【场景】")
        ? baseDesc
        : [metaLines, baseDesc].filter(Boolean).join("\n\n");

      const payload = {
        name: form.name,
        tagline: form.tagline,
        url: form.url,
        categories: form.categories || [],
        campaign: form.campaign || "",
        description,
        imageUrl: form.imageUrl,
        topicId: submitSelectedTopicId || "",
        topicName: sceneTopic,
      };
      const result = isEditing
        ? await updateProduct(editingProductId, payload)
        : await submitProduct(payload);
      const returnCampaignId =
        submitReturnCampaignId ||
        (typeof payload.campaign === "string" ? payload.campaign : "");
      setShowSubmitModal(false);
      setEditingProductId("");
      setSubmitSelectedTopicId("");
      setSubmitTopicSuggestOpen(false);
      setSubmitReturnCampaignId("");
      setForm({
        name: "",
        tagline: "",
        url: "",
        categories: [],
        campaign: "",
        description: "",
        imageUrl: "",
        topicName: "",
        sceneId: "",
        sceneTopic: "",
        buildToolId: "",
      });
      toast.success(
        isEditing ? "保存成功" : "提交成功",
        !isEditing && !isAdmin
          ? result.message || "已进入审核队列，平均 4 小时内完成"
          : result.message &&
              result.message !== "保存成功" &&
              result.message !== "上传成功"
            ? result.message
            : "",
      );
      if (!isEditing && returnCampaignId) {
        navigate(`/campaign/${encodeURIComponent(returnCampaignId)}`);
        return;
      }
      if (isEditing || !isAdmin) {
        setSearchParams({ view: "my" });
        await loadMyProducts();
      }
      if (isAdmin && !isEditing) {
        setSearchParams({});
        await loadProducts(activeCategory, appliedSearch);
      } else if (isAdmin && isEditing) {
        await loadProducts(activeCategory, appliedSearch);
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

  function openCampaignDetail(campaignId) {
    if (!campaignId) return;
    navigate(`/campaign/${encodeURIComponent(campaignId)}`);
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
    else if (viewParam === "square") nextView = "square";
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

  // 活动页一键参与：/?publish=<campaignId> 仍兼容，进入对应活动详情并打开弹窗
  useEffect(() => {
    const publishCampaign = (searchParams.get("publish") || "").trim();
    if (!publishCampaign) return;
    navigate(`/campaign/${encodeURIComponent(publishCampaign)}?join=1`, {
      replace: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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
    if (viewId === "square") {
      setSearchParams({ view: "square" });
    } else if (viewId === "topics") {
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
    if (product.votedByMe) {
      toast.success("已评分", `你的评分：${product.myRating || "—"} 星`);
      return;
    }
    setRatingProduct(product);
  }

  function closeRatingModal() {
    if (ratingSubmitting) return;
    setRatingProduct(null);
  }

  async function submitRating(ratings) {
    if (!ratingProduct) return;
    try {
      setVotingId(ratingProduct.id);
      setRatingSubmitting(true);
      const result = await voteProduct(ratingProduct.id, ratings);
      setProducts((prev) =>
        prev.map((item) =>
          item.id === ratingProduct.id
            ? {
                ...item,
                votedByMe: result.voted,
                voteCount: result.voteCount,
                avgRating: result.avgRating,
                avgRatings: result.avgRatings,
                ratingCount: result.ratingCount,
                myRating: result.myRating,
                myRatings: result.myRatings,
              }
            : item,
        ),
      );
      toast.success(
        "评分成功",
        `已为「${ratingProduct.name}」打 ${result.myRating} 星`,
      );
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
      {/* 浅色紫白主题下不再使用星空背景 */}

      <header className="ph-nav">
        <div className="ph-nav-inner">
          <div className="ph-logo" aria-label="码上创 vibe building">
            <BrandLogo />
          </div>

          <MainViewTabNav
            activeView={activeView}
            loggedIn={!!user}
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
                    ⚙ 运营端
                  </Link>
                )}
                <button type="button" className="ph-nav-ghost" onClick={logout}>
                  退出
                </button>
                <button
                  type="button"
                  className="ph-nav-primary"
                  onClick={openBuildWizard}
                >
                  我要构建
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="ph-nav-primary">
                  注册 / 登录
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Demo 门户首页无轮播：banner 能力保留在运营配置，前台首页不再展示 */}

      <MainViewSwitch
        activeView={activeView}
        home={
          <PortalHome
            onOpenSquare={() => setSearchParams({ view: "square" })}
            onOpenBuild={openBuildWizard}
            onOpenPublish={() => goMyWorkspace("publish")}
            onOpenPromote={openPromoteWizard}
            onVote={handleVote}
            votingId={votingId}
          />
        }
        square={
          <div className="ph-section-inner ph-section-inner--wide">
            <div className="ph-square-head">
              <div>
                <h1 className="ph-section-title">应用广场</h1>
                <p className="ph-my-sub">
                  社区开发者用 AI 构建的场景应用 · 支持分类筛选与排序 · 榜单实时更新
                </p>
              </div>
              <button
                type="button"
                className="ph-btn-primary"
                onClick={openBuildWizard}
              >
                ＋ 我要构建
              </button>
            </div>
            <CampaignZone
              campaigns={campaigns}
              onOpenCampaign={openCampaignDetail}
            />

            <div className="ph-all-section" id="resource-list">
              <div className="ph-all-box">
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

                <div className="ph-portal-hot-filters">
                  <div
                    className="ph-filters"
                    role="tablist"
                    aria-label="场景分类"
                  >
                    <button
                      type="button"
                      className={
                        "ph-filter" + (squareScene === "all" ? " active" : "")
                      }
                      onClick={() => setSquareScene("all")}
                    >
                      全部
                    </button>
                    {BUILD_SCENES.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className={
                          "ph-filter" +
                          (squareScene === s.id ? " active" : "")
                        }
                        onClick={() => setSquareScene(s.id)}
                      >
                        {s.emoji} {s.name}
                      </button>
                    ))}
                  </div>
                  <div className="ph-period-rank-tabs" role="tablist" aria-label="排序">
                    {[
                      ["hot", "最热"],
                      ["new", "最新"],
                      ["likes", "点赞最多"],
                    ].map(([k, label]) => (
                      <button
                        key={k}
                        type="button"
                        className={
                          "ph-period-rank-tab" +
                          (squareSort === k ? " active" : "")
                        }
                        onClick={() => setSquareSort(k)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
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
                          ? `未找到「${appliedSearch}」相关应用`
                          : activeCategory !== "全部"
                            ? "该分类下还没有应用"
                            : "还没有应用，来构建并发布第一个吧"
                      }
                      action={
                        <button
                          type="button"
                          className="ph-empty-link"
                          onClick={openBuildWizard}
                        >
                          我要构建 →
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
              <aside className="ph-sidebar" aria-label="码上创榜单">
                <PeriodRankBoard title="🔥 码上创榜单" compact />
              </aside>
            </div>
          </div>
        }
      />

      {activeView === "topics" && (
        <main key="topics" className="ph-section ph-view-enter">
          <div className="ph-section-inner">
            <div className="ph-all-section">
              <div className="ph-all-box">
                {!activeTopicId ? (
                  <div className="ph-topic-toolbar">
                    <div className="ph-topic-explore-head">
                      <h2 className="ph-topic-explore-title">发现话题</h2>
                      <p className="ph-topic-explore-hint">
                        浏览热门话题，也可在「我要构建」里选择场景话题
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
        </main>
      )}

      {activeView === "my" && (
        <main key="my" className="ph-section ph-view-enter">
          <div className="ph-section-inner">
            {error && <div className="error">{error}</div>}
            <MyWorkspace
              user={user}
              products={myProducts}
              loading={myLoading}
              draftRefreshKey={draftRefreshKey}
              onBuild={openBuildWizard}
              onPromote={openPromoteWizard}
              onPublish={(preset) => openSubmitModal("", preset || null)}
              onEdit={openEditProductModal}
              onUnpublish={handleUnpublishProduct}
              unpublishingId={unpublishingId}
              onOpenSquare={() => setSearchParams({ view: "square" })}
            />
          </div>
        </main>
      )}

      <footer className="ph-footer">
        <div className="ph-section-inner">
          <div className="ph-footer-brand">
            <BrandLogo small showText={false} />
            <span className="ph-footer-text">
              码上创 vibe building · 构建 · 发布 · 霸榜
            </span>
          </div>
        </div>
      </footer>

      {submitModalMotion.mounted &&
        createPortal(
          <div className={submitModalMotion.overlayClassName}>
            <div
              className={submitModalMotion.panelClassName}
              role="dialog"
              aria-modal="true"
              aria-labelledby="submit-modal-title"
            >
              <div className="modal-header">
                <div>
                  <p className="modal-eyebrow">
                    {editingProductId ? "编辑应用" : "📤 我要发布"}
                  </p>
                  <h2 id="submit-modal-title">
                    {editingProductId
                      ? "编辑并重新提交"
                      : "提交应用到应用广场"}
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
                  <span>应用截图 / 封面图</span>
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
                          {imageUploading ? "上传中..." : "点击上传截图"}
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
                    应用名称 <span className="field-required">*</span>
                  </span>
                  <input
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    placeholder="例如：校园二手书雷达"
                    maxLength={50}
                    disabled={submitting}
                    required
                  />
                </label>

                <label className="modal-field">
                  <span>
                    一句话简介 <span className="field-required">*</span>
                  </span>
                  <input
                    value={form.tagline}
                    onChange={(e) => updateForm("tagline", e.target.value)}
                    placeholder="用一句话说清这个应用能做什么"
                    maxLength={100}
                    disabled={submitting}
                    required
                  />
                </label>

                <div className="modal-field">
                  <span>
                    所属场景 <span className="field-required">*</span>
                  </span>
                  <div className="modal-category-options">
                    {BUILD_SCENES.map((s) => {
                      const selected = form.sceneId === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          className={
                            selected
                              ? "modal-category active"
                              : "modal-category"
                          }
                          onClick={() => {
                            setForm((prev) => ({
                              ...prev,
                              sceneId: s.id,
                              sceneTopic: "",
                              topicName: "",
                            }));
                            setSubmitSelectedTopicId("");
                          }}
                          disabled={submitting}
                          aria-pressed={selected}
                        >
                          {s.emoji} {s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="modal-field">
                  <span>
                    场景话题 <span className="field-required">*</span>
                  </span>
                  {!form.sceneId ? (
                    <p className="modal-hint">请先选择所属场景</p>
                  ) : (
                    <div className="modal-category-options">
                      {submitSceneTopics.map((topic) => {
                        const selected = form.sceneTopic === topic;
                        return (
                          <button
                            key={topic}
                            type="button"
                            className={
                              selected
                                ? "modal-category active"
                                : "modal-category"
                            }
                            onClick={() => {
                              setForm((prev) => ({
                                ...prev,
                                sceneTopic: topic,
                                topicName: topic,
                              }));
                              setSubmitSelectedTopicId("");
                            }}
                            disabled={submitting}
                            aria-pressed={selected}
                          >
                            {topic}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <label className="modal-field">
                  <span>
                    应用访问链接 <span className="field-required">*</span>
                  </span>
                  <input
                    value={form.url}
                    onChange={(e) => updateForm("url", e.target.value)}
                    placeholder="https:// 应用体验地址"
                    disabled={submitting}
                    required
                  />
                </label>

                <div className="modal-field">
                  <span>
                    构建工具 <span className="field-required">*</span>
                  </span>
                  <div className="modal-category-options">
                    {BUILD_TOOLS.map((t) => {
                      const selected = form.buildToolId === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          className={
                            selected
                              ? "modal-category active"
                              : "modal-category"
                          }
                          onClick={() => updateForm("buildToolId", t.id)}
                          disabled={submitting}
                          aria-pressed={selected}
                        >
                          {t.emoji} {t.name}
                          {t.sponsored ? " · 赞助" : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>

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

                <label className="modal-field">
                  <span>详细介绍</span>
                  <textarea
                    value={form.description}
                    onChange={(e) => updateForm("description", e.target.value)}
                    placeholder="应用能力说明、适用场景、使用方式（选填；场景/工具信息会自动写入）"
                    rows={4}
                    maxLength={800}
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
          <div className="modal-overlay">
            <div
              className="modal"
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

      <BuildWizardModal
        open={showBuildWizard}
        username={user?.username}
        onClose={() => setShowBuildWizard(false)}
        onCompleted={(draft, options = {}) => {
          setDraftRefreshKey((k) => k + 1);
          setSearchParams({ view: "my" });
          if (options.openPublish) {
            toast.success("任务书已保存", `「${draft.topic}」可继续构建或发布到应用广场`);
            setTimeout(() => {
              openSubmitModal("", {
                name: draft.topic,
                tagline: `基于${draft.toolName}构建的${draft.sceneName}应用`,
                description: draft.taskBrief,
                topicName: draft.topic,
                sceneId: draft.sceneId || "",
                sceneTopic: draft.topic,
                buildToolId: draft.toolId || "",
                url: "",
              });
            }, 0);
          } else {
            toast.success(
              `已跳转 ${draft.toolName} 开始构建`,
              "构建完成后，可在「我的应用」提交发布",
            );
          }
        }}
      />

      <PromoteWizardModal
        open={showPromoteWizard}
        products={myProducts}
        onClose={() => setShowPromoteWizard(false)}
        onPublish={() => openSubmitModal()}
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
