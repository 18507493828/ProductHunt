import { memo, useEffect, useRef, useState } from "react";
import EmptyState from "./EmptyState";

function formatCount(n) {
  const num = Number(n) || 0;
  if (num >= 10000) return (num / 10000).toFixed(1).replace(/\.0$/, "") + "万";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(num);
}

function TopicsView({
  topics,
  loading,
  onSelect,
  onFollow,
  onCreate,
  activeTopicId,
}) {
  const stripRef = useRef(null);
  const dragState = useRef({ dragging: false, startX: 0, startScrollLeft: 0, moved: false });
  const [overflow, setOverflow] = useState({ left: false, right: false });

  function updateOverflow() {
    const el = stripRef.current;
    if (!el) return;
    const maxLeft = el.scrollWidth - el.clientWidth;
    setOverflow({
      left: el.scrollLeft > 2,
      right: el.scrollLeft < maxLeft - 2 && maxLeft > 0,
    });
  }

  function onStripMouseDown(e) {
    dragState.current = {
      dragging: true,
      startX: e.clientX,
      startScrollLeft: stripRef.current?.scrollLeft ?? 0,
      moved: false,
    };
  }

  function onStripMouseMove(e) {
    const st = dragState.current;
    const container = stripRef.current;
    if (!st.dragging || !container) return;
    const dx = e.clientX - st.startX;
    if (Math.abs(dx) > 4) st.moved = true;
    container.scrollLeft = st.startScrollLeft - dx;
  }

  function endStripDrag() {
    if (dragState.current.dragging) dragState.current.dragging = false;
  }

  function onStripClickCapture(e) {
    // 拖拽后抬起鼠标会触发 click，这里吞掉，避免误选话题
    if (dragState.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      dragState.current.moved = false;
    }
  }

  function selectTopic(topicId, name, e) {
    onSelect(topicId, name);
    const container = stripRef.current;
    const btn = e?.currentTarget;
    if (container && btn) {
      container.scrollTo({
        left: btn.offsetLeft - (container.clientWidth - btn.clientWidth) / 2,
        behavior: "smooth",
      });
    }
  }

  useEffect(() => {
    // topics 变化后重新计算左右边缘 fade
    updateOverflow();
    window.addEventListener("resize", updateOverflow);
    return () => window.removeEventListener("resize", updateOverflow);
  }, [topics]);

  return (
    <div className="ph-topics-wrap">
      <div className="ph-topics-toolbar">
        <h2 className="ph-section-title">全部话题</h2>
        <button type="button" className="ph-nav-primary" onClick={onCreate}>
          ＋ 发布话题
        </button>
      </div>

      {loading ? (
        <div className="ph-topics-strip">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className="ph-topic-strip-item skeleton" aria-hidden="true" />
          ))}
        </div>
      ) : topics.length > 0 ? (
        <div className="ph-topics-strip-wrap">
          <div
            className="ph-topics-strip"
            ref={stripRef}
            onScroll={updateOverflow}
            onMouseDown={onStripMouseDown}
            onMouseMove={onStripMouseMove}
            onMouseUp={endStripDrag}
            onMouseLeave={endStripDrag}
            onClickCapture={onStripClickCapture}
          >
            {topics.map((topic) => (
              <button
                key={topic.id}
                type="button"
                className={"ph-topic-strip-item" + (activeTopicId === topic.id ? " active" : "")}
                onClick={(e) => selectTopic(topic.id, topic.name, e)}
              >
                <span className="ph-topic-strip-name">{topic.name}</span>
                <span className="ph-topic-strip-count">
                  {formatCount(topic.followerCount)} 关注
                </span>
              </button>
            ))}
          </div>
          {overflow.left && (
            <span className="ph-filters-fade left" aria-hidden="true" />
          )}
          {overflow.right && (
            <span className="ph-filters-fade right" aria-hidden="true" />
          )}
        </div>
      ) : (
        <EmptyState
          title="暂无话题"
          description="还没有话题，点击右上角「发布话题」创建一个吧"
        />
      )}
    </div>
  );
}

export default memo(TopicsView);
