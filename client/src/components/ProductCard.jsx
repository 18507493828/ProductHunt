import { Link, useNavigate } from "react-router-dom";
import { ThumbsUp, Eye, MessageCircle, Star } from "lucide-react";
import CachedImage from "./CachedImage";
import { buildTopicHomePath, formatTopicName } from "../topicUtils";

function getProductInitial(name = "") {
  return (name.trim()[0] || "P").toUpperCase();
}

function VoteControl({ product, onVote, disabled }) {
  return (
    <button
      type="button"
      className={
        "ph-card-vote" + (product.votedByMe ? " voted" : "")
      }
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onVote?.(product);
      }}
      disabled={disabled || product.votedByMe}
      aria-label={product.votedByMe ? "已评分" : "评分"}
      title={product.votedByMe ? "已评分" : "为这个资源评分"}
    >
      <ThumbsUp size={14} strokeWidth={2.2} aria-hidden="true" />
      <span>{product.voteCount ?? 0}</span>
    </button>
  );
}

export default function ProductCard({
  product,
  rank,
  onVote,
  votingDisabled,
  showMeta = false,
  showCategory = false,
  showTopic = false,
  showStats = false,
  size = "md",
}) {
  const navigate = useNavigate();
  const mediaStyle = product.imageUrl
    ? undefined
    : {
        background: `linear-gradient(135deg, ${product.color || "#fc5531"} 0%, rgba(10,14,26,0.2) 100%)`,
      };

  return (
    <Link
      to={`/resource/${product.id}`}
      className={`ph-product-card ph-product-card-${size} ph-product-card-linkwrap`}
    >
      <article>
        <div className="ph-product-card-media" style={mediaStyle} aria-hidden="true">
          {product.imageUrl ? (
            <CachedImage src={product.imageUrl} alt="" />
          ) : (
            <span className="ph-product-card-initial">{getProductInitial(product.name)}</span>
          )}
          <div className="ph-product-card-media-overlay" aria-hidden="true" />
          {rank != null && (
            <span className="ph-product-card-rank">
              <span className="ph-product-card-rank-icon" aria-hidden="true">🔥</span>
              {rank}
            </span>
          )}
          {showCategory &&
            (product.categories?.length
              ? product.categories
              : product.category
                ? [product.category]
                : []
            ).length > 0 && (
              <div className="ph-product-card-categories">
                {(product.categories?.length
                  ? product.categories
                  : [product.category]
                )
                  .slice(0, 2)
                  .map((cat) => (
                    <span key={cat} className="ph-product-card-category">
                      {cat}
                    </span>
                  ))}
              </div>
            )}
        </div>

        <div className="ph-product-card-body">
          <div className="ph-product-card-head">
            <h3 className="ph-product-card-name" title={product.name}>
              {product.name}
            </h3>
            {product.ratingCount > 0 && product.avgRating > 0 && (
              <span className="ph-product-card-rating-badge" aria-label={`${product.avgRating} 分`}>
                <Star size={12} fill="currentColor" aria-hidden="true" />
                {product.avgRating}
              </span>
            )}
          </div>

          <p className="ph-product-card-tagline" title={product.tagline}>
            {product.tagline}
          </p>

          {(showTopic || showMeta) && (
            <div className="ph-product-card-tags">
              {showTopic && product.topicName && (
                product.topicId ? (
                  <button
                    type="button"
                    className="ph-product-card-topic topic-mention"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(
                        buildTopicHomePath({
                          topicId: product.topicId,
                          topicName: product.topicName,
                        }),
                      );
                    }}
                  >
                    {formatTopicName(product.topicName)}
                  </button>
                ) : (
                  <span className="ph-product-card-topic">
                    {formatTopicName(product.topicName)}
                  </span>
                )
              )}
              {showMeta && product.submittedBy && (
                <span className="ph-product-card-author">{product.submittedBy}</span>
              )}
            </div>
          )}

          <div className="ph-product-card-footer">
            {showStats ? (
              <div className="ph-product-card-stats">
                <span>
                  <Eye size={13} aria-hidden="true" />
                  {product.viewCount ?? 0}
                </span>
                <span>
                  <MessageCircle size={13} aria-hidden="true" />
                  {product.commentCount ?? 0}
                </span>
              </div>
            ) : (
              <span />
            )}
            {onVote && (
              <VoteControl
                product={product}
                onVote={onVote}
                disabled={votingDisabled}
              />
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

export function ProductCardSkeleton({ size = "md" }) {
  return (
    <div className={`ph-product-card ph-product-card-${size} skeleton`}>
      <div className="ph-product-card-media skeleton-media" />
      <div className="ph-product-card-body">
        <div className="skeleton-line title" />
        <div className="skeleton-line" />
        <div className="skeleton-line short" />
      </div>
    </div>
  );
}
