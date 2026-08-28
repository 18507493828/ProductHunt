import { useEffect, useState } from "react";
import { fetchProducts } from "../api";

const TOP_N = 10;

export default function RankList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");
    fetchProducts({ range: "all" })
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
  }, []);

  return (
    <div className="rank-card">
      <h2 className="rank-title">榜单</h2>

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
          {items.map((product, index) => (
            <li className="rank-item" key={product.id}>
              <span className="rank-num">{index + 1}</span>
              <span className="rank-name" title={product.name}>
                {product.name}
              </span>
              <span className="rank-votes">
                <span className="rank-votes-icon">🔥</span>
                <span>{product.voteCount ?? 0}</span>
                <span className="rank-votes-label">热度值</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
