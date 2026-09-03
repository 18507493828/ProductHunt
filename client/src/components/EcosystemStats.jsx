import { useEffect, useState } from "react";
import {
  Box,
  Eye,
  Flame,
  MessageCircle,
  Star,
  ThumbsUp,
  TrendingUp,
  Users,
} from "lucide-react";
import { fetchStats } from "../api";
import { formatTopicName } from "../topicUtils";

function formatCount(n) {
  const num = Number(n) || 0;
  if (num >= 10000) return `${(num / 10000).toFixed(1).replace(/\.0$/, "")}万`;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(num);
}

function StatsSkeleton() {
  return (
    <section className="ph-eco-dashboard ph-eco-dashboard--loading" aria-hidden="true">
      <div className="ph-eco-dashboard-head">
        <div className="skeleton-line title" />
        <div className="skeleton-line short" />
      </div>
      <div className="ph-eco-metrics">
        {Array.from({ length: 6 }).map((_, i) => (
          <div className="ph-eco-metric skeleton" key={i}>
            <div className="skeleton-line title" />
            <div className="skeleton-line short" />
          </div>
        ))}
      </div>
      <div className="ph-eco-dashboard-panels">
        <div className="ph-eco-panel skeleton">
          <div className="skeleton-line title" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="skeleton-line" key={i} />
          ))}
        </div>
        <div className="ph-eco-panel skeleton">
          <div className="skeleton-line title" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="skeleton-line" key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function EcosystemStats({ onCategoryClick, onTopicClick }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchStats()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <StatsSkeleton />;
  if (!stats) return null;

  const metrics = [
    {
      label: "生态资源",
      value: stats.totalResources,
      hint: stats.recentResources7d
        ? `近 7 日 +${stats.recentResources7d}`
        : "已收录资源",
      icon: Box,
      tone: "purple",
    },
    {
      label: "话题内容",
      value: stats.totalTopicPosts ?? 0,
      hint: stats.recentTopicPosts7d
        ? `近 7 日 +${stats.recentTopicPosts7d}`
        : `${stats.totalTopics ?? 0} 个话题`,
      icon: Flame,
      tone: "orange",
    },
    {
      label: "社区评分",
      value: stats.totalVotes,
      hint:
        stats.avgRating > 0
          ? `均分 ${stats.avgRating} · ${stats.ratingCount ?? 0} 次`
          : "累计评分人次",
      icon: ThumbsUp,
      tone: "blue",
    },
    {
      label: "浏览互动",
      value: stats.totalViews,
      hint: "资源 + 话题浏览",
      icon: Eye,
      tone: "green",
    },
    {
      label: "评论留言",
      value: stats.totalComments,
      hint: "全站讨论量",
      icon: MessageCircle,
      tone: "pink",
    },
    {
      label: "话题关注",
      value: stats.totalFollowers ?? 0,
      hint: stats.totalTopicLikes
        ? `${formatCount(stats.totalTopicLikes)} 次点赞`
        : "社区关注度",
      icon: Users,
      tone: "violet",
    },
  ];

  const categories = stats.categoryCounts || [];
  const topTopics = stats.topTopics || [];
  const maxCategoryCount = categories[0]?.count || 1;

  return (
    <section className="ph-eco-dashboard" aria-label="生态总览">
      <div className="ph-eco-dashboard-head">
        <div>
          <h2 className="ph-eco-dashboard-title">生态总览</h2>
          <p className="ph-eco-dashboard-sub">
            实时汇总 Agent 生态资源、话题讨论与社区互动数据
          </p>
        </div>
        <div className="ph-eco-dashboard-badge">
          <TrendingUp size={14} aria-hidden="true" />
          数据看板
        </div>
      </div>

      <div className="ph-eco-metrics">
        {metrics.map((item) => {
          const Icon = item.icon;
          return (
            <div className={`ph-eco-metric ph-eco-metric--${item.tone}`} key={item.label}>
              <div className="ph-eco-metric-icon" aria-hidden="true">
                <Icon size={18} />
              </div>
              <div className="ph-eco-metric-body">
                <span className="ph-eco-metric-value">{formatCount(item.value)}</span>
                <span className="ph-eco-metric-label">{item.label}</span>
                <span className="ph-eco-metric-hint">{item.hint}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="ph-eco-dashboard-panels">
        <div className="ph-eco-panel">
          <div className="ph-eco-panel-head">
            <h3 className="ph-eco-panel-title">分类分布</h3>
            <span className="ph-eco-panel-meta">{categories.length} 个分类</span>
          </div>
          {categories.length === 0 ? (
            <p className="ph-eco-panel-empty">暂无分类数据</p>
          ) : (
            <ul className="ph-eco-category-bars">
              {categories.map((item) => (
                <li className="ph-eco-category-bar" key={item.category}>
                  <button
                    type="button"
                    className="ph-eco-category-bar-btn"
                    onClick={() => onCategoryClick?.(item.category)}
                    disabled={!onCategoryClick}
                  >
                    <div className="ph-eco-category-bar-head">
                      <span className="ph-eco-category-bar-name">{item.category}</span>
                      <span className="ph-eco-category-bar-count">
                        {item.count}
                        <em>{item.percent}%</em>
                      </span>
                    </div>
                    <div className="ph-eco-category-bar-track" aria-hidden="true">
                      <span
                        className="ph-eco-category-bar-fill"
                        style={{
                          width: `${Math.max(6, Math.round((item.count / maxCategoryCount) * 100))}%`,
                        }}
                      />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="ph-eco-panel">
          <div className="ph-eco-panel-head">
            <h3 className="ph-eco-panel-title">热门话题</h3>
            <span className="ph-eco-panel-meta">Top {topTopics.length}</span>
          </div>
          {topTopics.length === 0 ? (
            <p className="ph-eco-panel-empty">暂无话题数据</p>
          ) : (
            <ol className="ph-eco-hot-topics">
              {topTopics.map((topic, index) => (
                <li className="ph-eco-hot-topic" key={topic.id}>
                  <button
                    type="button"
                    className="ph-eco-hot-topic-btn"
                    onClick={() => onTopicClick?.(topic.id, topic.name)}
                    disabled={!onTopicClick}
                  >
                    <span className="ph-eco-hot-topic-rank">{index + 1}</span>
                    <span className="ph-eco-hot-topic-name">
                      {formatTopicName(topic.name)}
                    </span>
                    <span className="ph-eco-hot-topic-stats">
                      <Flame size={12} aria-hidden="true" />
                      {formatCount(topic.hotScore)}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          )}
          {stats.avgRating > 0 && (
            <div className="ph-eco-panel-footer">
              <Star size={14} aria-hidden="true" fill="currentColor" />
              全站资源均分 <strong>{stats.avgRating}</strong>
              <span>（{stats.ratingCount} 次评分）</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
