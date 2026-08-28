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
      aria-label={product.votedByMe ? "已投票" : "投票"}
      title={product.votedByMe ? "已投票" : "为这个产品投票"}
    >
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M10 4l5.5 6.5H13V15a1 1 0 01-1 1H8a1 1 0 01-1-1v-4.5H4.5L10 4z"
          fill="currentColor"
        />
      </svg>
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
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M6 3h7v7M13 3l-7 7M11 10v3H3V5h3"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
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
