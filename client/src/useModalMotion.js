import { useEffect, useState } from "react";

const DEFAULT_MS = 260;

/**
 * 根据 open 控制弹窗挂载与进出场状态。
 * open=true → 挂载并进入；open=false → 先退场，结束后再卸载。
 */
export function useModalMotion(open, durationMs = DEFAULT_MS) {
  const [mounted, setMounted] = useState(open);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setEntered(true));
      });
      return () => window.cancelAnimationFrame(id);
    }

    setEntered(false);
    if (!mounted) return undefined;
    const t = window.setTimeout(() => setMounted(false), durationMs);
    return () => window.clearTimeout(t);
  }, [open, durationMs, mounted]);

  return {
    mounted,
    overlayClassName: entered
      ? "modal-overlay modal-overlay--open"
      : "modal-overlay modal-overlay--close",
    panelClassName: entered ? "modal modal--open" : "modal modal--close",
  };
}
