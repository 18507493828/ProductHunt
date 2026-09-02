import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Eye, MessageCircle, ThumbsUp } from "lucide-react";
import { fetchProduct, fetchProducts, postComment, voteProduct } from "../api";
import { useAuth } from "../AuthContext";
import { useToast } from "../Toast";
import EmptyState from "../components/EmptyState";
import RatingModal from "../components/RatingModal";
import ProductCard from "../components/ProductCard";
import CachedImage from "../components/CachedImage";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitial(name = "") {
  return (name.trim()[0] || "A").toUpperCase();
}

export default function ResourceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [ratingBusy, setRatingBusy] = useState(false);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchProduct(id)
      .then((data) => {
        if (!cancelled) {
          setResource(data);
          if (data.category) {
            fetchProducts({ category: data.category })
              .then((list) => {
                if (!cancelled) {
                  setRelated(
                    list.filter((item) => item.id !== data.id).slice(0, 4),
                  );
                }
              })
              .catch(() => {});
          }
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  function requireLogin() {
    if (!user) {
      navigate("/login");
      return false;
    }
    return true;
  }

  async function handleComment(e) {
    e.preventDefault();
    if (!requireLogin()) return;
    const content = comment.trim();
    if (!content) return;
    try {
      setCommentBusy(true);
      const result = await postComment(id, content);
      setResource((prev) =>
        prev
          ? {
              ...prev,
              commentCount: result.commentCount,
              comments: [result.comment, ...(prev.comments || [])],
            }
          : prev,
      );
      setComment("");
      toast.success("评论成功");
    } catch (err) {
      toast.error("评论失败", err.message);
    } finally {
      setCommentBusy(false);
    }
  }

  async function submitRating(rating) {
    if (!resource) return;
    try {
      setRatingBusy(true);
      const result = await voteProduct(resource.id, rating);
      setResource((prev) =>
        prev
          ? {
              ...prev,
              votedByMe: result.voted,
              voteCount: result.voteCount,
              avgRating: result.avgRating,
              ratingCount: result.ratingCount,
              myRating: rating,
            }
          : prev,
      );
      toast.success("评分成功", `已为「${resource.name}」打 ${rating} 星`);
      setRatingOpen(false);
    } catch (err) {
      toast.error("评分失败", err.message);
    } finally {
      setRatingBusy(false);
    }
  }

  return (
    <div className="ph-page ph-detail-page">
      <header className="ph-detail-nav">
        <div className="ph-section-inner ph-detail-nav-inner">
          <button type="button" className="ph-detail-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} aria-hidden="true" />
            返回
          </button>
          <Link to="/" className="ph-logo ph-detail-logo">
            <span className="ph-logo-text">Vibe Building</span>
          </Link>
        </div>
      </header>

      <main className="ph-section">
        <div className="ph-section-inner ph-detail-wrap">
          {loading ? (
            <div className="ph-detail-skeleton">
              <div className="skeleton-line title" />
              <div className="skeleton-line" />
              <div className="skeleton-line short" />
            </div>
          ) : error ? (
            <EmptyState title={error} description="资源可能已下架或不存在" />
          ) : resource ? (
            <>
              <article className="ph-detail-hero">
                <div
                  className="ph-detail-media"
                  style={
                    resource.imageUrl
                      ? undefined
                      : { background: resource.color || "var(--ph-accent)" }
                  }
                >
                  {resource.imageUrl ? (
                    <CachedImage src={resource.imageUrl} alt="" loading="eager" />
                  ) : (
                    <span className="ph-detail-initial">{getInitial(resource.name)}</span>
                  )}
                </div>

                <div className="ph-detail-main">
                  <div className="ph-detail-badges">
                    {resource.category && (
                      <span className="ph-category-badge">{resource.category}</span>
                    )}
                    {resource.isSpecial && (
                      <span className="ph-detail-badge special">专题活动</span>
                    )}
                  </div>
                  <h1 className="ph-detail-title">{resource.name}</h1>
                  <p className="ph-detail-tagline">{resource.tagline}</p>

                  <div className="ph-detail-metrics">
                    <span>
                      <Eye size={15} aria-hidden="true" />
                      {resource.viewCount ?? 0} 浏览
                    </span>
                    <span>
                      <ThumbsUp size={15} aria-hidden="true" />
                      {resource.voteCount ?? 0} 评分
                    </span>
                    <span>
                      <MessageCircle size={15} aria-hidden="true" />
                      {resource.commentCount ?? 0} 评论
                    </span>
                    {resource.avgRating > 0 && (
                      <span className="ph-detail-rating">
                        ★ {resource.avgRating}（{resource.ratingCount} 人）
                      </span>
                    )}
                  </div>

                  <p className="ph-detail-meta">
                    上传者 {resource.submittedBy || "—"} · {formatDate(resource.submittedAt)}
                  </p>

                  <div className="ph-detail-actions">
                    {resource.url && (
                      <a
                        className="ph-btn-primary"
                        href={resource.url}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        打开演示
                        <ArrowUpRight size={16} aria-hidden="true" />
                      </a>
                    )}
                    <button
                      type="button"
                      className="ph-btn-secondary"
                      onClick={() => {
                        if (!requireLogin()) return;
                        if (resource.votedByMe) {
                          toast.success("已评分", `你的评分：${resource.myRating} 星`);
                          return;
                        }
                        setRatingOpen(true);
                      }}
                    >
                      {resource.votedByMe ? `已评 ${resource.myRating} 星` : "参与评分"}
                    </button>
                  </div>
                </div>
              </article>

              {resource.description && (
                <section className="ph-detail-section">
                  <h2>详细介绍</h2>
                  <div className="ph-detail-desc">{resource.description}</div>
                </section>
              )}

              <section className="ph-detail-section">
                <h2>社区评论 ({resource.comments?.length ?? 0})</h2>
                <form className="ph-comment-form" onSubmit={handleComment}>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={user ? "分享你的使用体验或建议…" : "登录后可发表评论"}
                    rows={3}
                    maxLength={500}
                    disabled={!user || commentBusy}
                  />
                  <div className="ph-comment-form-actions">
                    <span className="ph-comment-hint">{comment.length}/500</span>
                    <button
                      type="submit"
                      className="ph-btn-primary"
                      disabled={!user || commentBusy || !comment.trim()}
                    >
                      {commentBusy ? "发送中…" : "发表评论"}
                    </button>
                  </div>
                </form>

                {!resource.comments?.length ? (
                  <p className="ph-comment-empty">还没有评论，来抢沙发吧</p>
                ) : (
                  <ul className="ph-comment-list">
                    {resource.comments.map((item) => (
                      <li className="ph-comment-item" key={item.id}>
                        <div className="ph-comment-head">
                          <strong>{item.author}</strong>
                          <time>{formatDate(item.createdAt)}</time>
                        </div>
                        <p>{item.content}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {related.length > 0 && (
                <section className="ph-detail-section">
                  <h2>同类资源推荐</h2>
                  <div className="ph-product-grid ph-product-grid-all ph-detail-related">
                    {related.map((item) => (
                      <ProductCard
                        key={item.id}
                        product={item}
                        showCategory
                        showStats
                        size="md"
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : null}
        </div>
      </main>

      {ratingOpen && resource && (
        <RatingModal
          product={resource}
          submitting={ratingBusy}
          onCancel={() => !ratingBusy && setRatingOpen(false)}
          onSubmit={submitRating}
        />
      )}
    </div>
  );
}
