import { Link } from "react-router-dom";
import { ThumbsUp, ArrowUpRight, Eye, MessageCircle } from "lucide-react";
import EmptyState from "./EmptyState";

const STATUS_LABEL = {
  pending: "待审核",
  approved: "已上架",
  rejected: "未通过",
};

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

function getProductInitial(name = "") {
  return (name.trim()[0] || "P").toUpperCase();
}

export default function MyProductsList({ products, loading, onSubmit, onEdit }) {
  if (loading) {
    return (
      <div className="ph-list">
        {Array.from({ length: 3 }).map((_, index) => (
          <div className="ph-item skeleton" key={index}>
            <div className="skeleton-line short" />
            <div className="skeleton-line title" />
            <div className="skeleton-line" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        title="还没有上传记录"
        description="上传资源后可在这里查看审核状态、浏览和互动数据"
        action={
          <button type="button" className="ph-empty-link" onClick={onSubmit}>
            上传第一个资源 →
          </button>
        }
      />
    );
  }

  return (
    <div className="ph-list">
      {products.map((product) => (
        <article className="ph-item" key={product.id}>
          <div className="ph-vote-static" aria-label="当前评分数">
            <ThumbsUp size={15} strokeWidth={2} aria-hidden="true" />
            <span>{product.voteCount ?? 0}</span>
          </div>

          <div
            className="ph-item-avatar"
            style={{ background: product.color || "var(--ph-accent)" }}
            aria-hidden="true"
          >
            {getProductInitial(product.name)}
          </div>

          <div className="ph-item-main">
            <div className="ph-item-title-row">
              <h3>
                <Link to={`/resource/${product.id}`} className="ph-item-title-link">
                  {product.name}
                </Link>
              </h3>
              <span className={`status-badge status-${product.status}`}>
                {STATUS_LABEL[product.status] || product.status}
              </span>
            </div>
            <p className="ph-item-tagline">{product.tagline}</p>
            <p className="ph-item-meta">
              {(product.categories?.length
                ? product.categories
                : product.category
                  ? [product.category]
                  : []
              ).map((cat) => (
                <span key={cat} className="ph-category-badge">
                  {cat}
                </span>
              ))}
              <span>上传于 {formatDate(product.submittedAt)}</span>
              {product.status === "approved" && (
                <>
                  <span>{product.voteCount ?? 0} 评分</span>
                  <span className="ph-item-stat">
                    <Eye size={12} aria-hidden="true" />
                    {product.viewCount ?? 0}
                  </span>
                  <span className="ph-item-stat">
                    <MessageCircle size={12} aria-hidden="true" />
                    {product.commentCount ?? 0}
                  </span>
                </>
              )}
            </p>
            {product.status === "pending" && (
              <p className="ph-item-hint pending">
                等待管理员审核，通过后会在榜单展示
              </p>
            )}
            {product.status === "rejected" && (
              <p className="ph-item-hint rejected">
                拒绝原因：{product.rejectReason || "未填写"}
              </p>
            )}
          </div>

          <div className="ph-item-actions">
            <button
              type="button"
              className="ph-item-link"
              onClick={() => onEdit?.(product)}
            >
              编辑
            </button>
            <Link className="ph-item-link" to={`/resource/${product.id}`}>
              详情
            </Link>
            {product.url && (
              <a
                className="ph-item-link"
                href={product.url}
                target="_blank"
                rel="noreferrer noopener"
              >
                演示
                <ArrowUpRight size={12} aria-hidden="true" />
              </a>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
