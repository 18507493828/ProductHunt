import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { fetchTopics } from "../api";
import EmptyState from "./EmptyState";

function formatTopicName(name) {
  const n = (name || "").trim();
  if (!n) return "";
  return n.startsWith("#") && n.endsWith("#") ? n : `#${n}#`;
}

function formatCount(n) {
  const num = Number(n) || 0;
  if (num >= 10000) return `${(num / 10000).toFixed(1).replace(/\.0$/, "")}万`;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(num);
}

const TABS = [
  { id: "hot", label: "热门" },
  { id: "new", label: "最新" },
];

export default function TopicExplore({ onSelectTopic, refreshKey = 0 }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("hot");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchTopics({
      tab: "hot",
      sort: activeTab,
      page: 1,
      pageSize: 24,
      q: appliedSearch,
    })
      .then((res) => {
        if (!cancelled) setItems(res?.items || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, appliedSearch, refreshKey]);

  function handleSearch(e) {
    e.preventDefault();
    setAppliedSearch(search.trim());
  }

  return (
    <div className="ph-topic-explore">
      <div className="ph-topic-explore-head">
        <h3 className="ph-topic-explore-title">发现话题</h3>
        <p className="ph-topic-explore-hint">
          浏览热门话题，点击顶部「创建话题」发起讨论
        </p>
      </div>

      <div className="ph-topic-explore-toolbar">
        <div className="ph-topic-explore-tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={"ph-topic-explore-tab" + (activeTab === tab.id ? " active" : "")}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <form className="ph-topic-explore-search" onSubmit={handleSearch}>
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            placeholder="搜索话题名称…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {appliedSearch && (
            <button
              type="button"
              className="ph-topic-explore-search-clear"
              onClick={() => {
                setSearch("");
                setAppliedSearch("");
              }}
            >
              清除
            </button>
          )}
        </form>
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="ph-topic-explore-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="ph-topic-explore-card skeleton" key={i}>
              <div className="skeleton-line title" />
              <div className="skeleton-line" />
            </div>
          ))}
        </div>
      ) : !items.length ? (
        <EmptyState
          compact
          title={appliedSearch ? `未找到「${appliedSearch}」相关话题` : "暂无话题"}
          description={appliedSearch ? "换个关键词试试，或创建新话题" : "点击顶部「创建话题」成为第一个创建者"}
        />
      ) : (
        <div className="ph-topic-explore-grid">
          {items.map((topic) => (
            <button
              type="button"
              key={topic.id}
              className="ph-topic-explore-card"
              onClick={() => onSelectTopic(topic.id, topic.name)}
            >
              {topic.coverImage ? (
                <div
                  className="ph-topic-explore-thumb"
                  style={{ backgroundImage: `url(${topic.coverImage})` }}
                  aria-hidden="true"
                />
              ) : (
                <span
                  className="ph-topic-explore-color"
                  style={{ background: topic.color || "var(--ph-accent)" }}
                  aria-hidden="true"
                />
              )}
              <div className="ph-topic-explore-body">
                <h3 className="ph-topic-explore-name">{formatTopicName(topic.name)}</h3>
                <p className="ph-topic-explore-desc">
                  {topic.description || "暂无简介"}
                </p>
                <div className="ph-topic-explore-meta">
                  <span>热度 {formatCount(topic.hotScore ?? 0)}</span>
                  <span>{topic.postCount ?? topic.productCount ?? 0} 条内容</span>
                  <span>{topic.followerCount ?? 0} 关注</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
