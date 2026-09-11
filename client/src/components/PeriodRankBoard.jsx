import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProducts } from "../api";
import EmptyState from "./EmptyState";
import { periodHeatScore } from "../buildConfig";

const TABS = [
  { key: "week", label: "周榜" },
  { key: "month", label: "月榜" },
  { key: "quarter", label: "季榜" },
];

const TOP_N = 10;

export default function PeriodRankBoard({
  title = "🔥 码上创榜单",
  compact = false,
}) {
  const [tab, setTab] = useState("week");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");
    // 周期榜应对「已上架应用」按周期热度排序，不能按提交时间硬过滤
    // （否则超过 7 天提交的应用会让周榜整页为空）
    fetchProducts({ category: "全部", range: "all" })
      .then((list) => {
        if (ignore) return;
        const ranked = (list || [])
          .map((item) => ({ ...item, _heat: periodHeatScore(item, tab) }))
          .sort(
            (a, b) =>
              b._heat - a._heat || (b.voteCount || 0) - (a.voteCount || 0),
          )
          .slice(0, TOP_N);
        setItems(ranked);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [tab]);

  return (
    <section
      className={"ph-period-rank" + (compact ? " ph-period-rank--sidebar" : "")}
      aria-label={title}
    >
      <div className="ph-period-rank-head">
        <div>
          <h2>{title}</h2>
        </div>
        <div className="ph-period-rank-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              className={"ph-period-rank-tab" + (tab === t.key ? " active" : "")}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ph-period-rank-body">
        {error ? (
          <div className="rank-empty">{error}</div>
        ) : loading ? (
          <div className="ph-period-rank-list">
            {Array.from({ length: 5 }).map((_, i) => (
              <div className="ph-period-rank-item skeleton" key={i}>
                <div className="skeleton-line short" />
                <div className="skeleton-line title" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState title="该榜单暂无应用" description="发布并推广后冲榜" />
        ) : (
          <ol className="ph-period-rank-list">
            {items.map((item, index) => (
              <li key={item.id} className="ph-period-rank-item">
                <span
                  className={
                    "ph-period-rank-no" + (index < 3 ? ` top-${index + 1}` : "")
                  }
                >
                  {index + 1}
                </span>
                <div className="ph-period-rank-main">
                  <Link to={`/resource/${item.id}`}>{item.name}</Link>
                  <p>
                    {item.submittedNickname || item.submittedBy || "构建者"}
                    {compact ? "" : ` · ${item.topicName || item.tagline || "场景应用"}`}
                  </p>
                </div>
                <div className="ph-period-rank-stats">
                  {compact ? (
                    <span>{item._heat}</span>
                  ) : (
                    <>
                      <span>览 {item.viewCount || 0}</span>
                      <span>赞 {item.voteCount || 0}</span>
                      <span>热度 {item._heat}</span>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
