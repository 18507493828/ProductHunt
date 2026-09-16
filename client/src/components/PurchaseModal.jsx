import { createPortal } from "react-dom";
import { ExternalLink, MessageCircle, ShoppingBag, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useModalMotion } from "../useModalMotion";
import { useAuth } from "../AuthContext";
import { redirectToLogin } from "../authRedirect";
import CachedImage from "./CachedImage";
import TopicRichText from "./TopicRichText";
import {
  buildCreatorChatPath,
  formatProductPrice,
} from "../productPricing";

export default function PurchaseModal({ product, open, onClose }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mounted, overlayClassName, panelClassName } = useModalMotion(open);
  if (!mounted || !product) return null;

  const pricing = formatProductPrice(product);
  const buyUrl = String(product.buyUrl || "").trim();
  const cover = String(product.imageUrl || "").trim();
  const note = String(product.purchaseNote || "").trim();
  const description = String(product.description || "").trim();
  const isOwner = Boolean(product.isOwner);

  function handleContactCreator() {
    if (isOwner) return;
    const path = buildCreatorChatPath(product);
    onClose?.();
    if (!user) {
      redirectToLogin(navigate, path);
      return;
    }
    navigate(path);
  }

  return createPortal(
    <div className={overlayClassName + " ph-purchase-overlay"} onClick={onClose}>
      <div
        className={"ph-purchase-modal " + panelClassName}
        role="dialog"
        aria-modal="true"
        aria-labelledby="purchase-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="ph-purchase-close"
          onClick={onClose}
          aria-label="关闭"
        >
          <X size={18} />
        </button>

        <div className="ph-purchase-scroll">
          <p className="ph-purchase-eyebrow">
            <ShoppingBag size={14} aria-hidden="true" />
            购买应用
          </p>
          <h2 id="purchase-modal-title" className="ph-purchase-title">
            {product.name || "应用"}
          </h2>
          {product.tagline ? (
            <p className="ph-purchase-tagline">{product.tagline}</p>
          ) : null}

          {cover ? (
            <div className="ph-purchase-cover">
              <CachedImage
                src={cover}
                alt={`${product.name || "应用"}封面`}
                className="ph-purchase-cover-img"
                loading="eager"
              />
            </div>
          ) : null}

          <div className="ph-purchase-price-box">
            <span className="ph-purchase-price-label">价格</span>
            <div className="ph-purchase-price-row">
              <strong className="ph-purchase-price">
                {pricing.display || "面议"}
              </strong>
              {pricing.original ? (
                <span className="ph-purchase-original">{pricing.original}</span>
              ) : null}
            </div>
            {note ? <p className="ph-purchase-note">{note}</p> : null}
          </div>

          <div className="ph-purchase-section">
            <h3>详细介绍</h3>
            {description ? (
              <TopicRichText text={description} className="ph-purchase-desc" />
            ) : (
              <p className="ph-purchase-empty">作者暂未填写详细介绍</p>
            )}
          </div>

          <div className="ph-purchase-meta">
            {product.category ? <span>{product.category}</span> : null}
            {product.appPlatformLabel ? (
              <span>{product.appPlatformLabel}</span>
            ) : null}
            {product.submittedBy ? <span>作者 {product.submittedBy}</span> : null}
          </div>

          {!isOwner || buyUrl ? (
            <div className="ph-purchase-actions">
              {!isOwner ? (
                <button
                  type="button"
                  className="ph-btn-primary"
                  onClick={handleContactCreator}
                >
                  <MessageCircle size={16} aria-hidden="true" />
                  联系创作者
                </button>
              ) : null}
              {buyUrl ? (
                <a
                  className={isOwner ? "ph-btn-primary" : "ph-btn-secondary"}
                  href={buyUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  前往购买
                  <ExternalLink size={16} aria-hidden="true" />
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
