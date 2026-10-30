import { useCallback, useEffect, useRef, useState } from "react";

const EDGE = 2;

/**
 * 横向滚动标签条：滚轮转横滚、拖拽滑动、两端淡出、选中项自动居中。
 * 用法：const { ref, edge, dragProps, revealActive } = useHScroll();
 */
export default function useHScroll() {
  const ref = useRef(null);
  const [edge, setEdge] = useState({ overflow: false, left: false, right: false });
  const drag = useRef({ on: false, x: 0, left: 0, moved: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const sync = () => {
      const max = Math.max(0, el.scrollWidth - el.clientWidth);
      const overflow = max > EDGE;
      const next = {
        overflow,
        left: overflow && el.scrollLeft > EDGE,
        right: overflow && el.scrollLeft < max - EDGE,
      };
      setEdge((prev) =>
        prev.overflow === next.overflow &&
        prev.left === next.left &&
        prev.right === next.right
          ? prev
          : next,
      );
    };

    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    const mo = new MutationObserver(sync);
    mo.observe(el, { childList: true, subtree: true, characterData: true });

    const onWheel = (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= EDGE) return;
      const atStart = el.scrollLeft <= 0 && e.deltaY < 0;
      const atEnd = el.scrollLeft >= max - 1 && e.deltaY > 0;
      if (atStart || atEnd) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      el.removeEventListener("scroll", sync);
      el.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", sync);
      ro.disconnect();
      mo.disconnect();
    };
  }, []);

  const revealActive = useCallback((behavior = "smooth") => {
    const el = ref.current;
    if (!el) return;
    const active = el.querySelector(".active");
    if (!active) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= EDGE) return;
    const elRect = el.getBoundingClientRect();
    const aRect = active.getBoundingClientRect();
    const rel =
      aRect.left - elRect.left + el.scrollLeft - (el.clientWidth - aRect.width) / 2;
    el.scrollTo({ left: Math.max(0, Math.min(max, rel)), behavior });
  }, []);

  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    const el = ref.current;
    if (!el) return;
    drag.current = { on: true, x: e.clientX, left: el.scrollLeft, moved: false };
  }, []);

  const onMouseMove = useCallback((e) => {
    const el = ref.current;
    const st = drag.current;
    if (!el || !st.on) return;
    const dx = e.clientX - st.x;
    if (Math.abs(dx) > 4) st.moved = true;
    if (st.moved) el.scrollLeft = st.left - dx;
  }, []);

  const endDrag = useCallback(() => {
    const st = drag.current;
    if (!st.on) return;
    st.on = false;
    // 拖拽结束若没触发 click（松手在条外），下一个 tick 复位，避免吞掉下次点击
    if (st.moved) window.setTimeout(() => { st.moved = false; }, 0);
  }, []);

  const onClickCapture = useCallback((e) => {
    if (!drag.current.moved) return;
    e.preventDefault();
    e.stopPropagation();
    drag.current.moved = false;
  }, []);

  return {
    ref,
    edge,
    revealActive,
    dragProps: {
      onMouseDown,
      onMouseMove,
      onMouseUp: endDrag,
      onMouseLeave: endDrag,
      onClickCapture,
    },
  };
}
