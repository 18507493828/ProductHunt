import { useEffect, useState } from "react";
import { fetchStats } from "../api";

function formatCount(n) {
  const num = Number(n) || 0;
  if (num >= 10000) return `${(num / 10000).toFixed(1).replace(/\.0$/, "")}万`;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(num);
}

export default function EcosystemStats({ onCategoryClick }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchStats()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!stats) return null;

  const items = [
    { label: "生态资源", value: stats.totalResources },
    { label: "话题讨论", value: stats.totalTopics },
    { label: "社区评分", value: stats.totalVotes },
    { label: "浏览互动", value: stats.totalViews },
    { label: "评论留言", value: stats.totalComments },
  ];

  return (
    <section className="ph-eco-stats" aria-label="生态数据">
      <div className="ph-eco-stats-grid">
        {items.map((item) => (
          <div className="ph-eco-stat" key={item.label}>
            <span className="ph-eco-stat-value">{formatCount(item.value)}</span>
            <span className="ph-eco-stat-label">{item.label}</span>
          </div>
        ))}
      </div>
      {stats.categoryCounts?.length > 0 && (
        <div className="ph-eco-categories">
          {stats.categoryCounts.slice(0, 6).map((item) => (
            <button
              type="button"
              className="ph-eco-cat-pill"
              key={item.category}
              onClick={() => onCategoryClick?.(item.category)}
              disabled={!onCategoryClick}
            >
              {item.category}
              <em>{item.count}</em>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
