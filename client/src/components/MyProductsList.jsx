import { Link } from "react-router-dom";
import {
  ThumbsUp,
  ArrowUpRight,
  Eye,
  MessageCircle,
  Share2,
  Pencil,
  Archive,
} from "lucide-react";
import EmptyState from "./EmptyState";
import CachedImage from "./CachedImage";
import { useShare } from "../ShareContext";

const STATUS_LABEL = {
  pending: "待审核",
  approved: "已上架",
  rejected: "未通过",
  offline: "已下架",
};

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getProductInitial(name = "") {
  return (name.trim()[0] || "P").toUpperCase();
}

export default function MyProductsList({
  products,
  loading,
  onSubmit,
  onEdit,
  onUnpublish,
  unpublishingId = "",
}) {
  const { openShare } = useShare();

  if (loading) {
    return (
      <div className="ph-my-masonry" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="ph-my-masonry-card skeleton" key={index}>
            <div className="ph-my-masonry-cover skeleton" />
            <div className="skeleton-line title" />
            <div className="skeleton-line" />
            <div className="skeleton-line short" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        title="还没有应用"
        description="构建并发布后，可在这里查看审核状态与互动数据"
        action={
          <button type="button" className="ph-empty-link" onClick={onSubmit}>
            发布第一个应用 →
          </button>
        }
      />
    );
  }

  return (
    <div className="ph-my-masonry">
      {products.map((product) => {
        const categories = product.categories?.length
          ? product.categories
          : product.category
            ? [product.category]
            : [];
        const busy = unpublishingId === product.id;
        return (
          <article className="ph-my-masonry-card" key={product.id}>
            <Link
              to={`/resource/${product.id}`}
              className="ph-my-masonry-cover"
              style={
                product.imageUrl
                  ? undefined
                  : { background: product.color || "var(--ph-accent)" }
              }
            >
              {product.imageUrl ? (
                <CachedImage src={product.imageUrl} alt="" />
              ) : (
                <span className="ph-my-masonry-initial" aria-hidden="true">
                  {getProductInitial(product.name)}
                </span>
              )}
              <span className={`status-badge status-${product.status}`}>
                {STATUS_LABEL[product.status] || product.status}
              </span>
            </Link>

            <div className="ph-my-masonry-body">
              <h3>
                <Link
                  to={`/resource/${product.id}`}
                  className="ph-item-title-link"
                >
                  {product.name}
                </Link>
              </h3>
              <p className="ph-my-masonry-tagline">
                {product.tagline || "暂无简介"}
              </p>

              <div className="ph-my-masonry-meta">
                {(product.appPlatformLabel || product.appPlatform) && (
                  <span className="ph-category-badge ph-platform-badge">
                    {product.appPlatformLabel || product.appPlatform}
                  </span>
                )}
                {categories.slice(0, 2).map((cat) => (
                  <span key={cat} className="ph-category-badge">
                    {cat}
                  </span>
                ))}
                <span>{formatDate(product.submittedAt)}</span>
              </div>

              {product.status === "approved" ? (
                <div className="ph-my-masonry-stats">
                  <span>
                    <ThumbsUp size={12} aria-hidden="true" />
                    {product.voteCount ?? 0}
                  </span>
                  <span>
                    <Eye size={12} aria-hidden="true" />
                    {product.viewCount ?? 0}
                  </span>
                  <span>
                    <MessageCircle size={12} aria-hidden="true" />
                    {product.commentCount ?? 0}
                  </span>
                </div>
              ) : product.status === "pending" ? (
                <p className="ph-item-hint pending">等待审核通过后上架</p>
              ) : product.status === "rejected" ? (
                <p className="ph-item-hint rejected">
                  拒绝原因：{product.rejectReason || "未填写"}
                </p>
              ) : product.status === "offline" ? (
                <p className="ph-item-hint offline">已下架，广场不再展示</p>
              ) : (
                <div className="ph-my-masonry-stats" aria-hidden="true" />
              )}

              <div className="ph-my-masonry-actions">
                <button
                  type="button"
                  className="ph-item-link"
                  onClick={() => onEdit?.(product)}
                  disabled={busy}
                >
                  <Pencil size={12} aria-hidden="true" />
                  编辑
                </button>
                {product.status === "approved" && (
                  <>
                    <button
                      type="button"
                      className="ph-item-link"
                      onClick={() => openShare(product)}
                      disabled={busy}
                    >
                      <Share2 size={12} aria-hidden="true" />
                      分享
                    </button>
                    <button
                      type="button"
                      className="ph-item-link ph-item-link-danger"
                      disabled={busy}
                      onClick={() => onUnpublish?.(product)}
                    >
                      <Archive size={12} aria-hidden="true" />
                      {busy ? "下架中..." : "下架"}
                    </button>
                  </>
                )}
                {product.status === "offline" && (
                  <button
                    type="button"
                    className="ph-item-link"
                    onClick={() => onEdit?.(product)}
                    disabled={busy}
                  >
                    编辑并重新上架
                  </button>
                )}
                {product.url ? (
                  <a
                    className="ph-item-link"
                    href={product.url}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    演示
                    <ArrowUpRight size={12} aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
