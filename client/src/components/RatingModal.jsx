import { useState } from "react";
import { createPortal } from "react-dom";
import {
  RATING_DIMENSIONS,
  RATING_TIPS,
  emptyRatings,
  isCompleteRatings,
  overallFromRatings,
} from "../ratingDimensions";

function Star({ filled }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.5 6.19 20.5 7.3 14.03 2.6 9.45l6.5-.95L12 2.6z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DimensionRow({ dim, value, hover, submitting, onChange, onHover }) {
  const active = hover || value;
  return (
    <div className="ph-rating-dim">
      <div className="ph-rating-dim-label">{dim.label}</div>
      <div
        className="ph-rating-stars"
        role="radiogroup"
        aria-label={dim.label}
        onMouseLeave={() => onHover(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${dim.label} ${star} 星`}
            className={"ph-rating-star" + (star <= active ? " active" : "")}
            onClick={() => onChange(star)}
            onMouseEnter={() => onHover(star)}
            disabled={submitting}
          >
            <Star filled={star <= active} />
          </button>
        ))}
      </div>
      <div className="ph-rating-dim-tip">
        {active > 0 ? RATING_TIPS[active - 1] : "请评分"}
      </div>
    </div>
  );
}

export default function RatingModal({
  product,
  submitting,
  onCancel,
  onSubmit,
}) {
  const [ratings, setRatings] = useState(() => emptyRatings());
  const [hovers, setHovers] = useState(() => emptyRatings());
  const overall = overallFromRatings(ratings);
  const ready = isCompleteRatings(ratings);

  return createPortal(
    <div className="modal-overlay">
      <div
        className="ph-rating-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rating-modal-title"
      >
        <button
          type="button"
          className="ph-rating-close"
          onClick={onCancel}
          disabled={submitting}
          aria-label="关闭"
        >
          ×
        </button>

        <p className="ph-rating-eyebrow">为这个作品打分</p>
        <h2 id="rating-modal-title" className="ph-rating-title">
          {product?.name || "作品"}
        </h2>
        {product?.tagline && (
          <p className="ph-rating-tagline">{product.tagline}</p>
        )}

        <div className="ph-rating-dims">
          {RATING_DIMENSIONS.map((dim) => (
            <DimensionRow
              key={dim.key}
              dim={dim}
              value={ratings[dim.key]}
              hover={hovers[dim.key]}
              submitting={submitting}
              onChange={(star) =>
                setRatings((prev) => ({ ...prev, [dim.key]: star }))
              }
              onHover={(star) =>
                setHovers((prev) => ({ ...prev, [dim.key]: star }))
              }
            />
          ))}
        </div>

        <p className="ph-rating-label">
          {ready ? `综合 ${overall} 星` : "请完成以上评分"}
        </p>

        <div className="ph-rating-actions">
          <button
            type="button"
            className="ph-rating-btn secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            取消
          </button>
          <button
            type="button"
            className="ph-rating-btn primary"
            onClick={() => onSubmit(ratings)}
            disabled={submitting || !ready}
          >
            {submitting ? "提交中..." : "提交评分"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
