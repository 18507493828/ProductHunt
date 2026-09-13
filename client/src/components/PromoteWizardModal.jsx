import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Trophy, X } from "lucide-react";
import { useModalMotion } from "../useModalMotion";
import { useShare } from "../ShareContext";
import { fetchShareConfig } from "../api";
import { SHARE_PLATFORMS, PROMOTE_PLATFORM_IDS } from "../sharePlatforms";

function defaultPromoteChannels() {
  return SHARE_PLATFORMS.filter(
    (p) => PROMOTE_PLATFORM_IDS.includes(p.id) && p.defaultEnabled !== false,
  );
}

export default function PromoteWizardModal({
  open,
  onClose,
  products = [],
  onPublish,
  initialProductId = "",
}) {
  const { mounted, overlayClassName, panelClassName } = useModalMotion(open);
  const { openShare } = useShare();
  const [step, setStep] = useState(1);
  const [productId, setProductId] = useState("");
  const [channels, setChannels] = useState(defaultPromoteChannels);

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
    const ok =
      initialProductId &&
      approved.some((p) => p.id === initialProductId);
    setProductId(ok ? initialProductId : "");
    setStep(ok ? 2 : 1);
  }, [open, initialProductId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    let ignore = false;
    fetchShareConfig()
      .then((cfg) => {
        if (ignore) return;
        const platforms = cfg?.platforms || {};
        const enabled = SHARE_PLATFORMS.filter((meta) => {
          if (!PROMOTE_PLATFORM_IDS.includes(meta.id)) return false;
          const row = platforms[meta.id];
          if (row && typeof row === "object") return row.enabled !== false;
          return meta.defaultEnabled !== false;
        });
        setChannels(enabled);
      })
      .catch(() => {
        if (!ignore) setChannels(defaultPromoteChannels());
      });
    return () => {
      ignore = true;
    };
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
              <p className="ph-build-hint">应用：{selected?.name || "—"}</p>
              {channels.length === 0 ? (
                <p className="ph-build-empty">暂无可用推广渠道</p>
              ) : (
                <div className="ph-promote-channel-list">
                  {channels.map((c) => (
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
              )}
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
