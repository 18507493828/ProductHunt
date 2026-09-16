import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchIncentiveConfig, fetchProducts } from "../api";
import EmptyState from "./EmptyState";
import { compareRankItems, periodHeatScore } from "../buildConfig";

const TABS = [
  { key: "week", label: "周榜" },
  { key: "month", label: "月榜" },
  { key: "quarter", label: "季榜" },
];

const TOP_N = 10;

function rewardAmounts(tab, incentive) {
  if (!incentive) return Array(TOP_N).fill(0);
  const pick = (t1, t2, t3, rest) =>
    Array.from({ length: TOP_N }, (_, i) => {
      if (i === 0) return Number(t1) || 0;
      if (i === 1) return Number(t2) || 0;
      if (i === 2) return Number(t3) || 0;
      return Number(rest) || 0;
    });
  if (tab === "month") {
    return pick(
      incentive.monthTop1,
      incentive.monthTop2,
      incentive.monthTop3,
      incentive.monthTop4to10,
    );
  }
  if (tab === "quarter") {
    return pick(
      incentive.quarterTop1,
      incentive.quarterTop2,
      incentive.quarterTop3,
      incentive.quarterTop4to10,
    );
  }
  return pick(
    incentive.weekTop1,
    incentive.weekTop2,
    incentive.weekTop3,
    incentive.weekTop4to10,
  );
}

function formatMoney(n) {
  const num = Number(n) || 0;
  if (Number.isInteger(num)) return `¥${num}`;
  return `¥${num}`;
}

export default function PeriodRankBoard({
  title = "🔥 码上创榜单",
  compact = false,
}) {
  const [tab, setTab] = useState("week");
  const [items, setItems] = useState([]);
  const [incentive, setIncentive] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchIncentiveConfig()
      .then((data) => setIncentive(data || null))
      .catch(() => setIncentive(null));
  }, []);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");
    fetchProducts({ category: "全部", range: "all" })
      .then((list) => {
        if (ignore) return;
        const ranked = (list || [])
          .map((item) => ({ ...item, _heat: periodHeatScore(item, tab) }))
          .sort((a, b) => compareRankItems(a, b, tab))
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

  const amounts = rewardAmounts(tab, incentive);

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
            {items.map((item, index) => {
              const prize = amounts[index] || 0;
              return (
                <li key={item.id} className="ph-period-rank-item">
                  <span
                    className={
                      "ph-period-rank-no" + (index < 3 ? ` top-${index + 1}` : "")
                    }
                  >
                    {index + 1}
                  </span>
                  <div className="ph-period-rank-main">
                    <Link to={`/resource/${item.id}`}>
                      {item.rankPinned ? "📌 " : ""}
                      {item.name}
                    </Link>
                    <p>
                      {item.submittedNickname || item.submittedBy || "构建者"}
                      {compact
                        ? ""
                        : ` · ${item.topicName || item.tagline || "场景应用"}`}
                    </p>
                  </div>
                  <div className="ph-period-rank-stats">
                    {prize > 0 ? (
                      <span className="ph-period-rank-prize" title="榜单激励">
                        {formatMoney(prize)}
                      </span>
                    ) : null}
                    {compact ? (
                      <span className="ph-period-rank-heat" title="热度">
                        🔥 {item._heat}
                      </span>
                    ) : (
                      <>
                        <span>浏览 {item.viewCount || 0}</span>
                        <span>点赞 {item.voteCount || 0}</span>
                        <span title="热度">🔥 热度 {item._heat}</span>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
