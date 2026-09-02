import { useState } from "react";
import { createPortal } from "react-dom";

const RATING_TIPS = ["很差", "较差", "一般", "满意", "非常满意"];

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

export default function RatingModal({
  product,
  submitting,
  onCancel,
  onSubmit,
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const active = hover || rating;

  return createPortal(
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="ph-rating-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rating-modal-title"
        onClick={(e) => e.stopPropagation()}
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

        <p className="ph-rating-eyebrow">为这个资源打分</p>
        <h2 id="rating-modal-title" className="ph-rating-title">
          {product?.name || "资源"}
        </h2>
        {product?.tagline && (
          <p className="ph-rating-tagline">{product.tagline}</p>
        )}

        <div
          className="ph-rating-stars"
          role="radiogroup"
          aria-label="评分"
          onMouseLeave={() => setHover(0)}
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} 星`}
              className={"ph-rating-star" + (value <= active ? " active" : "")}
              onClick={() => setRating(value)}
              onMouseEnter={() => setHover(value)}
              disabled={submitting}
            >
              <Star filled={value <= active} />
            </button>
          ))}
        </div>

        <p className="ph-rating-label">
          {active > 0 ? `${RATING_TIPS[active - 1]}（${active} 星）` : "请选择星级"}
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
            onClick={() => onSubmit(rating)}
            disabled={submitting || rating === 0}
          >
            {submitting ? "提交中..." : "提交评分"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
