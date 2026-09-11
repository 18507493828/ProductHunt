import { useEffect, useLayoutEffect, useRef, useState } from "react";

const MAIN_VIEWS = [
  { id: "home", label: "首页" },
  { id: "square", label: "应用广场" },
  { id: "my", label: "我的", needAuth: true },
];

const VIEW_ORDER = { home: 0, square: 1, my: 2, topics: 3 };

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

/** 首页 / 应用广场 / 我的 */
export function MainViewTabNav({ activeView, onChange, loggedIn = false }) {
  const navRef = useRef(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, visible: false });
  const tabs = MAIN_VIEWS.filter((t) => !t.needAuth || loggedIn);
  const tabActive = tabs.some((t) => t.id === activeView) ? activeView : null;

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
  }, [tabActive, loggedIn]);

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
      {tabs.map((tab) => (
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

/** 首页 / 应用广场 内容区切换动画（我的由 App 单独渲染） */
export default function MainViewSwitch({ activeView, home, square }) {
  const direction = useMainViewDirection(activeView);

  if (activeView !== "home" && activeView !== "square") return null;

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
      {isHome ? home : square}
    </main>
  );
}
