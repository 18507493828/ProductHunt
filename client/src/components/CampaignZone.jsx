import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ImageOff } from "lucide-react";
import CachedImage from "./CachedImage";

function campaignBlurb(campaign) {
  return (
    campaign.description ||
    `浏览「${campaign.title}」活动详情，了解时间、规则与奖励，并参与发布作品。`
  );
}

export default function CampaignZone({ campaigns = [], onOpenCampaign }) {
  const enabled = useMemo(
    () => (Array.isArray(campaigns) ? campaigns : []).filter(Boolean),
    [campaigns],
  );
  const [activeId, setActiveId] = useState("");
  const [slideDir, setSlideDir] = useState("next");
  const [animKey, setAnimKey] = useState(0);
  const [indicator, setIndicator] = useState({
    left: 0,
    width: 0,
    visible: false,
  });
  const [tabOverflow, setTabOverflow] = useState({
    hasOverflow: false,
    left: false,
    right: false,
  });

  const tabsRef = useRef(null);
  const contentRef = useRef(null);
  const tabDrag = useRef({
    dragging: false,
    startX: 0,
    startScroll: 0,
    moved: false,
  });
  const contentDrag = useRef({
    dragging: false,
    startX: 0,
    moved: false,
  });

  useEffect(() => {
    if (!enabled.length) {
      setActiveId("");
      return;
    }
    if (!enabled.some((c) => c.id === activeId)) {
      setActiveId(enabled[0].id);
    }
  }, [enabled, activeId]);

  const activeIndex = useMemo(
    () => Math.max(0, enabled.findIndex((c) => c.id === activeId)),
    [enabled, activeId],
  );
  const active = enabled[activeIndex] || enabled[0] || null;

  function selectCampaign(nextId, dir = "next") {
    if (!nextId || nextId === activeId) return;
    setSlideDir(dir);
    setAnimKey((k) => k + 1);
    setActiveId(nextId);
  }

  function selectByIndex(index) {
    if (index < 0 || index >= enabled.length) return;
    const next = enabled[index];
    if (!next) return;
    selectCampaign(next.id, index > activeIndex ? "next" : "prev");
  }

  useLayoutEffect(() => {
    const nav = tabsRef.current;
    if (!nav || !activeId) {
      setIndicator((prev) => ({ ...prev, visible: false }));
      return undefined;
    }

    function updateIndicator() {
      const activeEl = nav.querySelector(`[data-campaign-id="${activeId}"]`);
      if (!activeEl) {
        setIndicator((prev) => ({ ...prev, visible: false }));
        return;
      }
      // absolute 定位相对可视区域，需减去 scrollLeft
      setIndicator({
        left: activeEl.offsetLeft - nav.scrollLeft,
        width: activeEl.offsetWidth,
        visible: true,
      });
      const maxScroll = Math.max(0, nav.scrollWidth - nav.clientWidth);
      const hasOverflow = maxScroll > 2;
      setTabOverflow({
        hasOverflow,
        left: hasOverflow && nav.scrollLeft > 2,
        right: hasOverflow && nav.scrollLeft < maxScroll - 2,
      });
    }

    function scrollActiveIntoView(smooth = true) {
      const activeEl = nav.querySelector(`[data-campaign-id="${activeId}"]`);
      if (!activeEl) return;
      const maxScroll = Math.max(0, nav.scrollWidth - nav.clientWidth);
      if (maxScroll <= 0) {
        updateIndicator();
        return;
      }
      // 与分类标签一致：选中项尽量居中，右侧溢出时自动右移
      const target =
        activeEl.offsetLeft - (nav.clientWidth - activeEl.offsetWidth) / 2;
      nav.scrollTo({
        left: Math.max(0, Math.min(maxScroll, target)),
        behavior: smooth ? "smooth" : "auto",
      });
      // smooth 滚动过程中持续对齐下划线
      updateIndicator();
      if (smooth) {
        window.setTimeout(updateIndicator, 120);
        window.setTimeout(updateIndicator, 280);
        window.setTimeout(updateIndicator, 400);
      }
    }

    scrollActiveIntoView(true);
    window.addEventListener("resize", updateIndicator);
    nav.addEventListener("scroll", updateIndicator, { passive: true });
    return () => {
      window.removeEventListener("resize", updateIndicator);
      nav.removeEventListener("scroll", updateIndicator);
    };
  }, [activeId, enabled]);

  function onTabsMouseDown(e) {
    if (e.button !== 0) return;
    const nav = tabsRef.current;
    if (!nav) return;
    tabDrag.current = {
      dragging: true,
      startX: e.clientX,
      startScroll: nav.scrollLeft,
      moved: false,
    };
  }

  function onTabsMouseMove(e) {
    const st = tabDrag.current;
    if (!st.dragging) return;
    const nav = tabsRef.current;
    if (!nav) return;
    const dx = e.clientX - st.startX;
    if (Math.abs(dx) > 4) st.moved = true;
    nav.scrollLeft = st.startScroll - dx;
  }

  function endTabsDrag() {
    tabDrag.current.dragging = false;
  }

  function onTabsClickCapture(e) {
    if (tabDrag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      tabDrag.current.moved = false;
    }
  }

  function onContentMouseDown(e) {
    if (e.button !== 0) return;
    // 避免拖拽时误触按钮内交互
    contentDrag.current = {
      dragging: true,
      startX: e.clientX,
      moved: false,
    };
  }

  function onContentMouseMove(e) {
    const st = contentDrag.current;
    if (!st.dragging) return;
    if (Math.abs(e.clientX - st.startX) > 8) st.moved = true;
  }

  function onContentMouseUp(e) {
    const st = contentDrag.current;
    if (!st.dragging) return;
    st.dragging = false;
    const dx = e.clientX - st.startX;
    if (Math.abs(dx) < 56) {
      st.moved = false;
      return;
    }
    if (dx < 0) selectByIndex(activeIndex + 1);
    else selectByIndex(activeIndex - 1);
    st.moved = false;
  }

  // 触控板横向滑动切换活动
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return undefined;
    let locked = false;
    function onWheel(e) {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) + 2) return;
      e.preventDefault();
      if (locked) return;
      if (e.deltaX > 12) {
        locked = true;
        selectByIndex(activeIndex + 1);
        window.setTimeout(() => {
          locked = false;
        }, 380);
      } else if (e.deltaX < -12) {
        locked = true;
        selectByIndex(activeIndex - 1);
        window.setTimeout(() => {
          locked = false;
        }, 380);
      }
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, enabled, activeId]);

  if (!enabled.length) return null;

  return (
    <section className="ph-campaign-featured" aria-label="活动专区">
      <h2 className="ph-campaign-featured-title">活动专区</h2>

      <div
        className={
          "ph-campaign-featured-tabs-wrap" +
          (tabOverflow.hasOverflow ? " has-overflow" : "")
        }
      >
        <div
          className="ph-campaign-featured-tabs"
          role="tablist"
          aria-label="活动列表"
          ref={tabsRef}
          onMouseDown={onTabsMouseDown}
          onMouseMove={onTabsMouseMove}
          onMouseUp={endTabsDrag}
          onMouseLeave={endTabsDrag}
          onClickCapture={onTabsClickCapture}
        >
          <span
            className={
              "ph-campaign-featured-tabs-indicator" +
              (indicator.visible ? " is-visible" : "")
            }
            style={{
              width: indicator.width,
              transform: `translateX(${indicator.left}px)`,
            }}
            aria-hidden="true"
          />
          {enabled.map((campaign) => (
            <button
              key={campaign.id}
              type="button"
              role="tab"
              data-campaign-id={campaign.id}
              aria-selected={campaign.id === active?.id}
              className={
                "ph-campaign-featured-tab" +
                (campaign.id === active?.id ? " active" : "")
              }
              onClick={() =>
                selectCampaign(
                  campaign.id,
                  enabled.findIndex((c) => c.id === campaign.id) > activeIndex
                    ? "next"
                    : "prev",
                )
              }
            >
              {campaign.title}
            </button>
          ))}
        </div>
        {tabOverflow.hasOverflow && (
          <>
            <span
              className={
                "ph-campaign-tabs-fade left" +
                (tabOverflow.left ? "" : " is-edge")
              }
              aria-hidden="true"
            />
            <span
              className={
                "ph-campaign-tabs-fade right" +
                (tabOverflow.right ? "" : " is-edge")
              }
              aria-hidden="true"
            />
          </>
        )}
      </div>

      {active && (
        <div
          className="ph-campaign-featured-stage"
          ref={contentRef}
          onMouseDown={onContentMouseDown}
          onMouseMove={onContentMouseMove}
          onMouseUp={onContentMouseUp}
          onMouseLeave={() => {
            contentDrag.current.dragging = false;
          }}
        >
          <div
            key={`${active.id}-${animKey}`}
            className={
              "ph-campaign-featured-grid ph-campaign-slide ph-campaign-slide--" +
              slideDir
            }
          >
            <button
              type="button"
              className="ph-campaign-entry-card"
              onClick={(e) => {
                if (contentDrag.current.moved) {
                  e.preventDefault();
                  contentDrag.current.moved = false;
                  return;
                }
                onOpenCampaign?.(active.id);
              }}
            >
              <div className="ph-campaign-entry-cover">
                {active.coverImage ? (
                  <CachedImage src={active.coverImage} alt="" />
                ) : (
                  <div
                    className="ph-campaign-entry-cover-empty"
                    aria-hidden="true"
                  >
                    <ImageOff size={28} strokeWidth={1.6} />
                    <span>暂无封面</span>
                  </div>
                )}
              </div>
              <div className="ph-campaign-entry-body">
                <h3 className="ph-campaign-entry-name">{active.title}</h3>
                {active.timeText && (
                  <p className="ph-campaign-entry-time">{active.timeText}</p>
                )}
                <p className="ph-campaign-entry-desc">{campaignBlurb(active)}</p>
                {(active.productCount > 0 || active.participantCount > 0) && (
                  <p className="ph-campaign-entry-meta">
                    {active.productCount || 0} 作品
                    {typeof active.participantCount === "number"
                      ? ` · ${active.participantCount} 创作者`
                      : ""}
                  </p>
                )}
              </div>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
