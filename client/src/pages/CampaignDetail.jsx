import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Gift, Inbox, ScrollText, Sparkles, Timer } from "lucide-react";
import { fetchCampaign, fetchProducts, voteProduct } from "../api";
import { useAuth } from "../AuthContext";
import { redirectToLogin } from "../authRedirect";
import { useToast } from "../Toast";
import BrandLogo from "../components/BrandLogo";
import CachedImage from "../components/CachedImage";
import EmptyState from "../components/EmptyState";
import ProductCard, { ProductCardSkeleton } from "../components/ProductCard";
import RatingModal from "../components/RatingModal";
import ResourceSearchBar from "../components/ResourceSearchBar";
import SubmitProductModal from "../components/SubmitProductModal";

const PAGE_SIZE = 20;

const COVER_TONES = [
  "linear-gradient(135deg, #1a2240 0%, #2a3a6a 48%, #c44b3c 120%)",
  "linear-gradient(135deg, #1c2838 0%, #245a6e 50%, #e07a3a 120%)",
  "linear-gradient(135deg, #241a38 0%, #4a3a78 52%, #d45a6a 120%)",
];

function splitLines(text = "") {
  return String(text)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const toast = useToast();

  const [campaign, setCampaign] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [campaignLoading, setCampaignLoading] = useState(true);
  const [error, setError] = useState("");
  const [campaignError, setCampaignError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [votingId, setVotingId] = useState("");
  const [ratingProduct, setRatingProduct] = useState(null);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const campaignIndex = useMemo(() => {
    const code = String(id || "")
      .split("")
      .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    return code % COVER_TONES.length;
  }, [id]);

  const visibleProducts = useMemo(
    () => products.slice(0, visibleCount),
    [products, visibleCount],
  );
  const hasMore = products.length > 0 && visibleCount < products.length;
  const ruleLines = useMemo(
    () => splitLines(campaign?.rules),
    [campaign?.rules],
  );

  async function reloadCampaign() {
    const data = await fetchCampaign(id);
    setCampaign(data || null);
  }

  async function reloadProducts(q = appliedSearch) {
    const list = await fetchProducts({
      category: "全部",
      campaign: id || "",
      q,
    });
    setProducts(Array.isArray(list) ? list : []);
    setVisibleCount(PAGE_SIZE);
  }

  useEffect(() => {
    let cancelled = false;
    setCampaignLoading(true);
    setCampaignError("");
    fetchCampaign(id)
      .then((data) => {
        if (!cancelled) setCampaign(data || null);
      })
      .catch((err) => {
        if (!cancelled) {
          setCampaign(null);
          setCampaignError(err.message || "活动不存在或已下线");
        }
      })
      .finally(() => {
        if (!cancelled) setCampaignLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setVisibleCount(PAGE_SIZE);
    fetchProducts({
      category: "全部",
      campaign: id || "",
      q: appliedSearch,
    })
      .then((list) => {
        if (!cancelled) setProducts(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setProducts([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, appliedSearch]);

  // 支持 /campaign/:id?join=1 自动打开发布弹窗
  useEffect(() => {
    if (searchParams.get("join") !== "1") return;
    if (!user) {
      redirectToLogin(navigate, `/campaign/${id}?join=1`);
      return;
    }
    setShowSubmitModal(true);
    const next = new URLSearchParams(searchParams);
    next.delete("join");
    setSearchParams(next, { replace: true });
  }, [searchParams, user, id, navigate, setSearchParams]);

  function requireLogin() {
    if (!user) {
      redirectToLogin(navigate, `/campaign/${id || ""}`);
      return false;
    }
    return true;
  }

  function handleSearchSubmit() {
    setAppliedSearch(searchQuery.trim());
  }

  function handleParticipate() {
    if (!id) return;
    if (!requireLogin()) return;
    setShowSubmitModal(true);
  }

  function handleVote(product) {
    if (!requireLogin()) return;
    if (product.votedByMe) {
      toast.success("已评分", `你的评分：${product.myRating} 星`);
      return;
    }
    setRatingProduct(product);
  }

  async function submitRating(ratings) {
    if (!ratingProduct) return;
    try {
      setRatingSubmitting(true);
      setVotingId(ratingProduct.id);
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
      setRatingSubmitting(false);
      setVotingId("");
    }
  }

  const title = campaign?.title || "活动详情";
  const missingCampaign = !campaignLoading && !campaign;
  const coverStyle = campaign?.coverImage
    ? {
        backgroundImage: `linear-gradient(135deg, rgba(10,14,26,0.55), rgba(10,14,26,0.78)), url(${campaign.coverImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : { background: COVER_TONES[campaignIndex % COVER_TONES.length] };

  return (
    <div className="ph-page ph-detail-page ph-campaign-detail-page">
      <header className="ph-detail-nav">
        <div className="ph-section-inner ph-detail-nav-inner">
          <Link to="/" className="ph-logo ph-detail-logo">
            <BrandLogo />
          </Link>
        </div>
      </header>

      <main className="ph-section">
        <div className="ph-section-inner">
          {campaignLoading ? (
            <div className="ph-campaign-detail-hero">
              <div className="ph-campaign-detail-hero-cover skeleton-media" />
            </div>
          ) : missingCampaign ? (
            <EmptyState
              title={campaignError || "活动不存在"}
              description="请返回首页重新选择活动"
              action={
                <Link to="/" className="ph-empty-link">
                  返回首页 →
                </Link>
              }
            />
          ) : (
            <>
              <section className="ph-campaign-detail-hero">
                <div
                  className="ph-campaign-detail-hero-cover"
                  style={coverStyle}
                >
                  {campaign?.coverImage ? (
                    <CachedImage
                      src={campaign.coverImage}
                      alt={title}
                      className="ph-campaign-detail-hero-img"
                    />
                  ) : (
                    <span className="ph-campaign-detail-hero-fallback">{title}</span>
                  )}
                </div>
                <div className="ph-campaign-detail-meta">
                  <div>
                    <p className="ph-campaign-detail-kicker">活动详情</p>
                    <h1 className="ph-campaign-detail-title">{title}</h1>
                    <p className="ph-campaign-detail-desc">
                      {campaign?.description ||
                        "浏览本活动作品，一键参与发布，让创作被更多人看见。"}
                    </p>
                    <div className="ph-campaign-detail-stats">
                      <span>{campaign.productCount ?? 0} 作品</span>
                      <span>{campaign.participantCount ?? 0} 位创作者</span>
                      <span>{campaign.voteCount ?? 0} 评分</span>
                    </div>
                  </div>
                  <div className="ph-campaign-detail-hero-actions">
                    <button
                      type="button"
                      className="ph-btn-primary"
                      onClick={handleParticipate}
                    >
                      <Sparkles size={16} aria-hidden="true" />
                      一键参与发布
                    </button>
                    <a href="#campaign-works" className="ph-btn-secondary">
                      查看作品集
                    </a>
                  </div>
                </div>
              </section>

              <section className="ph-campaign-detail-info" aria-label="活动介绍">
                <article className="ph-campaign-info-card">
                  <div className="ph-campaign-info-head">
                    <Timer size={18} aria-hidden="true" />
                    <h2>活动时间</h2>
                  </div>
                  <p>{campaign?.timeText || "时间以活动公告为准"}</p>
                </article>
                <article className="ph-campaign-info-card">
                  <div className="ph-campaign-info-head">
                    <ScrollText size={18} aria-hidden="true" />
                    <h2>活动规则</h2>
                  </div>
                  {ruleLines.length > 0 ? (
                    <ul className="ph-campaign-info-list">
                      {ruleLines.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>规则详情请关注活动公告。</p>
                  )}
                </article>
                <article className="ph-campaign-info-card">
                  <div className="ph-campaign-info-head">
                    <Gift size={18} aria-hidden="true" />
                    <h2>活动奖励</h2>
                  </div>
                  <p>{campaign?.rewards || "奖励说明以当期公告为准。"}</p>
                </article>
              </section>

              <section id="campaign-works" className="ph-campaign-detail-panel">
                <div className="ph-campaign-detail-toolbar">
                  <div>
                    <h2 className="ph-campaign-detail-list-title">活动作品集</h2>
                    <p className="ph-campaign-detail-list-hint">
                      已聚合 {campaign?.productCount ?? products.length} 个参与作品
                      {typeof campaign?.participantCount === "number"
                        ? ` · ${campaign.participantCount} 位创作者`
                        : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="ph-btn-secondary"
                    onClick={handleParticipate}
                  >
                    参与发布
                  </button>
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
                        : `暂无${title}作品`
                    }
                    description="成为第一个参与者，提交作品到本活动"
                    action={
                      <button
                        type="button"
                        className="ph-empty-link"
                        onClick={handleParticipate}
                      >
                        一键参与发布 →
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
                    {hasMore && (
                      <div className="ph-campaign-detail-more">
                        <button
                          type="button"
                          className="ph-btn-secondary"
                          onClick={() =>
                            setVisibleCount((n) => n + PAGE_SIZE)
                          }
                        >
                          加载更多
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>
            </>
          )}
        </div>
      </main>

      {ratingProduct && (
        <RatingModal
          product={ratingProduct}
          submitting={ratingSubmitting}
          onSubmit={submitRating}
          onCancel={() => !ratingSubmitting && setRatingProduct(null)}
        />
      )}

      <SubmitProductModal
        open={showSubmitModal}
        lockedCampaignId={id || ""}
        onClose={() => setShowSubmitModal(false)}
        onSuccess={async () => {
          try {
            await Promise.all([reloadProducts(), reloadCampaign()]);
          } catch (_) {
            /* ignore refresh errors */
          }
        }}
      />
    </div>
  );
}
