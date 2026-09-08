import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, Link2 } from "lucide-react";
import { useModalMotion } from "../useModalMotion";
import { useToast } from "../Toast";
import { fetchShareConfig, recordProductShare } from "../api";
import {
  buildPlatformShareText,
  buildProductShareUrl,
  copyShareText,
} from "../shareUtils";
import { SHARE_PLATFORMS } from "../sharePlatforms";

function DouyinIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="14" fill="#111" />
      <path
        d="M28.5 12.5c1.1 2.4 3.2 4.2 5.7 5v4.1c-2.1-.1-4.1-.8-5.7-2v9.8c0 5-4.1 9.1-9.1 9.1S10.3 34.4 10.3 29.4c0-4.8 3.7-8.7 8.4-9.1v4.3c-2.4.3-4.2 2.4-4.2 4.8 0 2.7 2.2 4.9 4.9 4.9s4.9-2.2 4.9-4.9V12.5h4.2z"
        fill="#25F4EE"
      />
      <path
        d="M30.2 14.2c1.1 2.4 3.2 4.2 5.7 5v4.1c-2.1-.1-4.1-.8-5.7-2v9.8c0 5-4.1 9.1-9.1 9.1S12 36.1 12 31.1c0-4.8 3.7-8.7 8.4-9.1v4.3c-2.4.3-4.2 2.4-4.2 4.8 0 2.7 2.2 4.9 4.9 4.9s4.9-2.2 4.9-4.9V14.2h4.2z"
        fill="#FE2C55"
      />
      <path
        d="M29.3 13.3c1.1 2.4 3.2 4.2 5.7 5v4.1c-2.1-.1-4.1-.8-5.7-2v9.8c0 5-4.1 9.1-9.1 9.1S11.1 35.2 11.1 30.2c0-4.8 3.7-8.7 8.4-9.1v4.3c-2.4.3-4.2 2.4-4.2 4.8 0 2.7 2.2 4.9 4.9 4.9s4.9-2.2 4.9-4.9V13.3h4.2z"
        fill="#fff"
      />
    </svg>
  );
}

function WechatIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="14" fill="#07C160" />
      <path
        d="M18.8 14.5c-5.4 0-9.8 3.7-9.8 8.3 0 2.7 1.5 5.1 3.9 6.7l-.9 3.3 3.7-1.9c1.1.3 2.2.5 3.4.5.4 0 .8 0 1.1-.1-.3-.8-.4-1.6-.4-2.5 0-4.8 4.6-8.7 10.3-8.7.3 0 .6 0 .9.1-1.3-3.4-5.3-5.7-10.2-5.7zm-3.3 5.2a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6zm6.6 0a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6z"
        fill="#fff"
      />
      <path
        d="M39 27.2c0-4-3.9-7.2-8.7-7.2s-8.7 3.2-8.7 7.2 3.9 7.2 8.7 7.2c.9 0 1.8-.1 2.6-.4l3.1 1.6-.8-2.8c2.1-1.4 3.8-3.5 3.8-5.6zm-11.5-.7a1.1 1.1 0 1 1 0-2.2 1.1 1.1 0 0 1 0 2.2zm5.6 0a1.1 1.1 0 1 1 0-2.2 1.1 1.1 0 0 1 0 2.2z"
        fill="#fff"
      />
    </svg>
  );
}

function XiaohongshuIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="14" fill="#FF2442" />
      <path
        d="M14.5 16.2h19v3.2h-7.4v3.4H32v3.1h-5.9v6.9h-3.5v-6.9h-5.7v-3.1h5.7v-3.4h-8.1v-3.2z"
        fill="#fff"
      />
      <circle cx="17.2" cy="30.8" r="1.5" fill="#fff" />
      <circle cx="30.8" cy="30.8" r="1.5" fill="#fff" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <span className="ph-share-link-icon" aria-hidden="true">
      <Link2 size={22} strokeWidth={2.2} />
    </span>
  );
}

function PlatformIcon({ id }) {
  if (id === "douyin") return <DouyinIcon />;
  if (id === "wechat") return <WechatIcon />;
  if (id === "xiaohongshu") return <XiaohongshuIcon />;
  return <LinkIcon />;
}

export default function ShareModal({ product, open, onClose }) {
  const toast = useToast();
  const { mounted, overlayClassName, panelClassName } = useModalMotion(open);
  const [config, setConfig] = useState(null);
  const [platform, setPlatform] = useState("douyin");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const platforms = useMemo(() => {
    return SHARE_PLATFORMS.filter((item) => {
      const conf = config?.platforms?.[item.id];
      return !conf || conf.enabled !== false;
    });
  }, [config]);

  const current =
    platforms.find((item) => item.id === platform) || platforms[0] || SHARE_PLATFORMS[0];

  useEffect(() => {
    if (!open) return undefined;
    setCopied(false);
    let cancelled = false;
    fetchShareConfig()
      .then((data) => {
        if (cancelled) return;
        setConfig(data || {});
      })
      .catch(() => {
        if (!cancelled) setConfig({});
      });
    return () => {
      cancelled = true;
    };
  }, [open, product?.id]);

  useEffect(() => {
    if (!platforms.length) return;
    if (!platforms.some((item) => item.id === platform)) {
      setPlatform(platforms[0].id);
    }
  }, [platforms, platform]);

  const url = useMemo(
    () => (product ? buildProductShareUrl(product) : ""),
    [product],
  );

  const preview = useMemo(() => {
    if (!product || !current) return "";
    return buildPlatformShareText(current.id, product, url, config);
  }, [product, current, url, config]);

  async function handleCopy() {
    if (!product || !preview) return;
    try {
      setBusy(true);
      await copyShareText(preview);
      setCopied(true);
      try {
        await recordProductShare(product.id, { platform });
      } catch {
        /* ignore */
      }
      toast.success(`已复制${current.name}文案`, "可直接粘贴到对应平台发布");
      window.setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      toast.error("复制失败", err.message || "请手动复制");
    } finally {
      setBusy(false);
    }
  }

  if (!mounted || !product) return null;

  return createPortal(
    <div className={overlayClassName + " ph-share-overlay"}>
      <div
        className={"ph-share-modal " + panelClassName}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
      >
        <button
          type="button"
          className="ph-share-close"
          onClick={onClose}
          disabled={busy}
          aria-label="关闭"
        >
          ×
        </button>

        <p className="ph-share-eyebrow">分享作品</p>
        <h2 id="share-modal-title" className="ph-share-title">
          {product.name || "作品"}
        </h2>
        {product.tagline && (
          <p className="ph-share-tagline">{product.tagline}</p>
        )}

        <div className="ph-share-platforms" role="listbox" aria-label="选择平台">
          {platforms.map((item) => (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={platform === item.id}
              className={
                "ph-share-platform" + (platform === item.id ? " is-active" : "")
              }
              onClick={() => {
                setPlatform(item.id);
                setCopied(false);
              }}
            >
              <span className="ph-share-platform-icon">
                <PlatformIcon id={item.id} />
              </span>
              <span className="ph-share-platform-name">{item.name}</span>
            </button>
          ))}
        </div>

        <p className="ph-share-tip">{current.tip}</p>

        <div className="ph-share-preview-wrap">
          <div className="ph-share-preview-head">
            <span>预览文案</span>
            <span>{current.name}</span>
          </div>
          <pre className="ph-share-preview">{preview}</pre>
        </div>

        <div className="ph-share-actions">
          <button
            type="button"
            className="ph-share-btn secondary"
            onClick={onClose}
            disabled={busy}
          >
            取消
          </button>
          <button
            type="button"
            className="ph-share-btn primary"
            onClick={handleCopy}
            disabled={busy || !preview}
          >
            {copied ? (
              <>
                <Check size={16} aria-hidden="true" />
                已复制
              </>
            ) : (
              <>
                <Copy size={16} aria-hidden="true" />
                {busy ? "复制中..." : `复制${current.name}文案`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
