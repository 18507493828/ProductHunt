import { useEffect, useLayoutEffect, useRef, useState } from "react";

const MAIN_VIEWS = [
  { id: "home", label: "首页" },
  { id: "topics", label: "话题" },
];

const VIEW_ORDER = { home: 0, topics: 1 };

function useMainViewDirection(view) {
  const prev = useRef(view);
  const [direction, setDirection] = useState("forward");

  useEffect(() => {
    const prevView = prev.current;
    if (
      view !== prevView &&
      VIEW_ORDER[view] != null &&
      VIEW_ORDER[prevView] != null
    ) {
      setDirection(VIEW_ORDER[view] > VIEW_ORDER[prevView] ? "forward" : "back");
    }
    prev.current = view;
  }, [view]);

  return direction;
}

/** 首页 / 话题 顶部 Tab，带滑动下划线 */
export function MainViewTabNav({ activeView, onChange }) {
  const navRef = useRef(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, visible: false });

  const tabActive =
    activeView === "home" || activeView === "topics" ? activeView : null;

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav || !tabActive) {
      setIndicator((prev) => ({ ...prev, visible: false }));
      return undefined;
    }

    function updateIndicator() {
      const activeEl = nav.querySelector(`[data-view-id="${tabActive}"]`);
      if (!activeEl) return;
      setIndicator({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        visible: true,
      });
    }

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [tabActive]);

  return (
    <nav className="ph-main-view-tabs" ref={navRef} aria-label="顶部导航">
      <span
        className={
          "ph-main-view-tabs-indicator" +
          (indicator.visible ? " is-visible" : "")
        }
        style={{
          width: indicator.width,
          transform: `translateX(${indicator.left}px)`,
        }}
        aria-hidden="true"
      />
      {MAIN_VIEWS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          data-view-id={tab.id}
          className={
            "ph-main-view-tab" + (tabActive === tab.id ? " active" : "")
          }
          aria-current={tabActive === tab.id ? "page" : undefined}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

/** 首页 / 话题 内容区切换动画 */
export default function MainViewSwitch({ activeView, home, topics }) {
  const direction = useMainViewDirection(activeView);

  if (activeView !== "home" && activeView !== "topics") return null;

  const isHome = activeView === "home";

  return (
    <main
      key={activeView}
      className={[
        "ph-view-panel",
        `ph-view-panel--${direction}`,
        isHome ? "" : "ph-section",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {isHome ? home : topics}
    </main>
  );
}
