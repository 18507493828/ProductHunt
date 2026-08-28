import { useEffect, useState } from "react";
import { fetchProducts } from "../api";

const RANK_TABS = [
  { key: "week", label: "周榜" },
  { key: "month", label: "月榜" },
  { key: "all", label: "总榜" },
];

const TOP_N = 10;

export default function RankList() {
  const [tab, setTab] = useState("week");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");
    fetchProducts({ category: "全部", range: tab })
      .then((list) => {
        if (!ignore) setItems(list.slice(0, TOP_N));
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
    <div className="rank-card">
      <h2 className="rank-title">热门榜单</h2>
      <div className="rank-tabs" role="tablist" aria-label="榜单">
        {RANK_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={tab === t.key ? "rank-tab active" : "rank-tab"}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
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
      ) : items.length === 0 ? (
        <div className="rank-empty">暂无数据</div>
      ) : (
        <ol className="rank-list">
          {items.map((product, index) => {
            const content = (
              <>
                <span className="rank-num">{index + 1}</span>
                <span className="rank-name" title={product.name}>
                  {product.name}
                </span>
                <span className="rank-votes">
                  <span className="rank-votes-icon">🔥</span>
                  <span className="rank-votes-label">热度值</span>
                  <span>{product.voteCount ?? 0}</span>
                </span>
              </>
            );

            return product.url ? (
              <li className="rank-item" key={product.id}>
                <a
                  className="rank-link"
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {content}
                </a>
              </li>
            ) : (
              <li className="rank-item" key={product.id}>
                {content}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
