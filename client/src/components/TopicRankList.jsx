import { useEffect, useRef, useState } from "react";
import { SearchX } from "lucide-react";
import { fetchTopics } from "../api";
import EmptyState from "./EmptyState";

const PAGE_SIZE = 50;

function formatCount(n) {
  const num = Number(n) || 0;
  if (num >= 10000) return (num / 10000).toFixed(1).replace(/\.0$/, "") + "万";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(num);
}

// 话题名统一以 #话题# 形式展示（数据里存的是裸名，展示时包装）
function formatTopicName(name) {
  const n = (name || "").trim();
  if (!n) return "";
  return n.startsWith("#") && n.endsWith("#") ? n : `#${n}#`;
}

export default function TopicRankList({ onSelectTopic, activeTopicId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const pageRef = useRef(1);
  const sentinelRef = useRef(null);
  const busyRef = useRef(false);
  const hasMoreRef = useRef(true);
  const ignoreRef = useRef(false);

  async function loadPage(page, keyword = "") {
    busyRef.current = true;
    if (page === 1) setLoading(true);
    else setLoadingMore(true);
    setError("");
    try {
      const res = await fetchTopics({ tab: "hot", page, pageSize: PAGE_SIZE });
      if (ignoreRef.current) return;
      const next = res?.items || [];
      setItems((prev) => (page === 1 ? next : [...prev, ...next]));
      setTotal(res?.total ?? 0);
      const loaded = page * PAGE_SIZE;
      hasMoreRef.current = loaded < (res?.total ?? next.length);
      pageRef.current = page;
    } catch (err) {
      if (!ignoreRef.current) setError(err.message);
    } finally {
      if (!ignoreRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
      busyRef.current = false;
    }
  }

  // 首屏加载第一页
  useEffect(() => {
    ignoreRef.current = false;
    pageRef.current = 1;
    hasMoreRef.current = true;
    loadPage(1);
    return () => {
      ignoreRef.current = true;
    };
  }, []);

  // 滚动到哨兵元素（列表底部附近）时加载下一页
  useEffect(() => {
    if (!hasMoreRef.current) return undefined;
    const el = sentinelRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !busyRef.current &&
          hasMoreRef.current
        ) {
          loadPage(pageRef.current + 1);
        }
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [items.length]);

  const loadedAll = !hasMoreRef.current;

  // 客户端搜索过滤（对已加载的数据做本地过滤）
  const q = search.trim().toLowerCase();
  const filteredItems = q
    ? items.filter((t) => t.name.toLowerCase().includes(q))
    : items;

  return (
    <div className="rank-card">
      <div className="topic-rank-head">
        <h2 className="rank-title">热门话题榜</h2>
        <div className="topic-rank-search-wrap">
          <input
            type="text"
            className="topic-rank-search-input"
            placeholder="搜索话题…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error ? (
        <div className="rank-empty">{error}</div>
      ) : loading ? (
        <div className="rank-list">
          {Array.from({ length: 5 }).map((_, i) => (
            <div className="rank-item skeleton" key={i}>
              <div className="skeleton-line short" />
              <div className="skeleton-line title" />
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          compact
          title={q ? "未找到匹配的话题" : "暂无话题"}
        />
      ) : (
        <>
          <ol className="rank-list">
            {filteredItems.map((topic, index) => {
              const isActive = activeTopicId === topic.id;
              const rank = index + 1;
              return (
                <li className="rank-item" key={topic.id}>
                  <button
                    type="button"
                    className="rank-link topic-rank-link"
                    onClick={() => onSelectTopic(topic.id, topic.name)}
                  >
                    <span className="rank-num">{rank}</span>
                    <span className="rank-name" title={topic.name}>
                      <span className="topic-tag">{formatTopicName(topic.name)}</span>
                    </span>
                    <span className="rank-votes">
                      <span className="rank-votes-icon" aria-hidden="true">
                        🔥
                      </span>
                      <span className="rank-votes-label">热度</span>
                      <span>{formatCount(topic.hotScore ?? 0)}</span>
                    </span>
                    {isActive && (
                      <span className="topic-rank-active-badge">浏览中</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>

          {/* 滚动加载更多哨兵：搜索时保留占位，避免列表高度突变引起页面横移 */}
          <div
            ref={q ? undefined : sentinelRef}
            className={"topic-rank-more" + (q ? " topic-rank-more--hidden" : "")}
            aria-hidden={q ? "true" : undefined}
          >
            {loadingMore ? (
              <span className="ph-spinner" aria-hidden="true" />
            ) : loadedAll ? (
              <span className="topic-rank-end">已全部加载</span>
            ) : (
              <span className="ph-spinner" aria-hidden="true" />
            )}
          </div>
        </>
      )}
    </div>
  );
}
