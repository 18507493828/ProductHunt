import { ThumbsUp, ArrowUpRight } from "lucide-react";

function getProductInitial(name = "") {
  return (name.trim()[0] || "P").toUpperCase();
}

function VoteControl({ product, onVote, disabled, compact }) {
  return (
    <button
      type="button"
      className={
        compact
          ? product.votedByMe
            ? "ph-card-vote compact voted"
            : "ph-card-vote compact"
          : product.votedByMe
            ? "ph-card-vote voted"
            : "ph-card-vote"
      }
      onClick={(e) => {
        e.stopPropagation();
        onVote?.(product);
      }}
      disabled={disabled || product.votedByMe}
      aria-label={product.votedByMe ? "已评分" : "评分"}
      title={product.votedByMe ? "已评分" : "为这个产品评分"}
    >
      <ThumbsUp size={15} strokeWidth={2} aria-hidden="true" />
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
  size = "md",
}) {
  const mediaStyle = product.imageUrl
    ? undefined
    : { background: product.color || "#834DF0" };

  return (
    <article className={`ph-product-card ph-product-card-${size}`}>
      <div className="ph-product-card-media" style={mediaStyle} aria-hidden="true">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt="" loading="lazy" />
        ) : (
          <span className="ph-product-card-initial">{getProductInitial(product.name)}</span>
        )}
        {rank != null && (
          <span className="ph-product-card-rank">
            <span className="ph-product-card-rank-icon" aria-hidden="true">🔥</span>
            {rank}
          </span>
        )}
        {onVote && (
          <VoteControl
            product={product}
            onVote={onVote}
            disabled={votingDisabled}
            compact
          />
        )}
      </div>

      <div className="ph-product-card-body">
        <h3 className="ph-product-card-name" title={product.name}>
          {product.name}
        </h3>
        <p className="ph-product-card-tagline" title={product.tagline}>
          {product.tagline}
        </p>
        {product.ratingCount > 0 && product.avgRating > 0 && (
          <div className="ph-product-card-rating" aria-label={`${product.avgRating} 分，${product.ratingCount} 人评分`}>
            <span className="ph-product-card-rating-stars" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className={s <= Math.round(product.avgRating) ? "on" : ""}>★</span>
              ))}
            </span>
            <span className="ph-product-card-rating-score">
              {product.avgRating} · {product.ratingCount} 人评分
            </span>
          </div>
        )}
        {(showCategory || showMeta) && (
          <p className="ph-product-card-meta">
            {showCategory && product.category && (
              <span>{product.category}</span>
            )}
            {showMeta && product.submittedBy && (
              <span>{product.submittedBy}</span>
            )}
          </p>
        )}
        {product.url && (
          <a
            className="ph-product-card-link"
            href={product.url}
            target="_blank"
            rel="noreferrer noopener"
            onClick={(e) => e.stopPropagation()}
          >
            访问
            <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        )}
      </div>
    </article>
  );
}

export function ProductCardSkeleton({ size = "md" }) {
  return (
    <div className={`ph-product-card ph-product-card-${size} skeleton`}>
      <div className="ph-product-card-media skeleton-media" />
      <div className="ph-product-card-body">
        <div className="skeleton-line title" />
        <div className="skeleton-line" />
      </div>
    </div>
  );
}
