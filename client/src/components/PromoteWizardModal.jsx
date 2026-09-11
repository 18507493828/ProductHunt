import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Trophy, X } from "lucide-react";
import { useModalMotion } from "../useModalMotion";
import { useShare } from "../ShareContext";

const PROMOTE_CHANNELS = [
  {
    id: "xiaohongshu",
    name: "小红书",
    tip: "种草笔记，适合快速曝光",
    icon: "🟥",
    color: "#ff2442",
  },
  {
    id: "douyin",
    name: "抖音",
    tip: "短视频挂载，适合扩散传播",
    icon: "🎵",
    color: "#101820",
  },
  {
    id: "wechat",
    name: "微信朋友圈",
    tip: "海报分享，适合熟人圈层",
    icon: "💬",
    color: "#07c160",
  },
  {
    id: "csdn",
    name: "CSDN 我的博客",
    tip: "构建复盘，适合技术向传播",
    icon: "✍️",
    color: "#fc5531",
  },
];

export default function PromoteWizardModal({
  open,
  onClose,
  products = [],
  onPublish,
}) {
  const { mounted, overlayClassName, panelClassName } = useModalMotion(open);
  const { openShare } = useShare();
  const [step, setStep] = useState(1);
  const [productId, setProductId] = useState("");

  const approved = useMemo(
    () => (products || []).filter((p) => (p.status || "approved") === "approved"),
    [products],
  );

  const selected = useMemo(
    () => approved.find((p) => p.id === productId) || null,
    [approved, productId],
  );

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setProductId("");
  }, [open]);

  function selectApp(id) {
    setProductId(id);
    setStep(2);
  }

  function selectChannel(platformId) {
    if (!selected) return;
    openShare?.(selected, { platform: platformId });
    onClose?.();
  }

  if (!mounted) return null;

  return createPortal(
    <div className={overlayClassName} onClick={onClose}>
      <div
        className={`${panelClassName} ph-build-wizard ph-promote-wizard`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="promote-wizard-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="ph-build-eyebrow">我要霸榜</p>
            <h2 id="promote-wizard-title">选择推广应用 → 选择推广渠道</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>

        <div className="ph-build-steps" aria-label="霸榜步骤">
          {[
            { n: 1, label: "选择推广应用" },
            { n: 2, label: "选择推广渠道" },
          ].map((s) => (
            <button
              key={s.n}
              type="button"
              className={
                "ph-build-step" +
                (step === s.n ? " active" : "") +
                (step > s.n ? " done" : "")
              }
              onClick={() => {
                if (s.n === 1) setStep(1);
                else if (s.n === 2 && productId) setStep(2);
              }}
            >
              <span>{s.n}</span>
              {s.label}
            </button>
          ))}
        </div>

        <div className="modal-body ph-build-body">
          {step === 1 && (
            <div>
              {approved.length === 0 ? (
                <div className="ph-promote-empty">
                  <Trophy size={28} aria-hidden="true" />
                  <p>还没有已上架应用。先发布并通过审核后，即可推广冲榜。</p>
                  <button
                    type="button"
                    className="ph-btn-primary"
                    onClick={() => {
                      onClose?.();
                      onPublish?.();
                    }}
                  >
                    去发布
                  </button>
                </div>
              ) : (
                <>
                  <p className="ph-build-hint">
                    选择要推广的应用，分享到各渠道后可提升榜单曝光。
                  </p>
                  <div className="ph-promote-app-list">
                    {approved.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className={
                          "ph-promote-app-card" +
                          (productId === p.id ? " selected" : "")
                        }
                        onClick={() => selectApp(p.id)}
                      >
                        <span className="ph-promote-app-thumb" aria-hidden="true">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt="" />
                          ) : (
                            (p.name || "?").slice(0, 1)
                          )}
                        </span>
                        <span className="ph-promote-app-meta">
                          <strong>{p.name}</strong>
                          <span>
                            赞 {p.voteCount || 0} · 览 {p.viewCount || 0}
                            {p.tagline ? ` · ${p.tagline}` : ""}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="ph-build-hint">
                当前应用：{selected?.name || "—"} · 选择渠道后将打开分享文案
              </p>
              <div className="ph-promote-channel-list">
                {PROMOTE_CHANNELS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="ph-promote-channel-card"
                    onClick={() => selectChannel(c.id)}
                    disabled={!selected}
                  >
                    <span
                      className="ph-promote-channel-icon"
                      style={{ background: c.color }}
                      aria-hidden="true"
                    >
                      {c.icon}
                    </span>
                    <span className="ph-promote-channel-meta">
                      <strong>{c.name}</strong>
                      <span>{c.tip}</span>
                    </span>
                    <span className="ph-promote-channel-cta">去分享</span>
                  </button>
                ))}
              </div>
              <div className="ph-build-nav-row">
                <button type="button" className="ph-btn-secondary" onClick={() => setStep(1)}>
                  上一步
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
