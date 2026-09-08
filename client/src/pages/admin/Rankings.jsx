import { useEffect, useState } from "react";
import EmptyState from "../../components/EmptyState";
import {
  fetchAdminRankings,
  fetchCampaigns,
  updateProductRank,
} from "../../api";

export default function Rankings() {
  const [items, setItems] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [campaign, setCampaign] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");

  async function loadRankings(nextCampaign = campaign) {
    try {
      setLoading(true);
      setError("");
      const list = await fetchAdminRankings({
        campaign: nextCampaign || undefined,
      });
      setItems(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRankings();
    fetchCampaigns()
      .then((list) => setCampaigns(Array.isArray(list) ? list : []))
      .catch(() => setCampaigns([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function patchRank(product, payload) {
    try {
      setActionId(product.id);
      setError("");
      await updateProductRank(product.id, payload);
      await loadRankings();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId("");
    }
  }

  return (
    <>
      <div className="admin-toolbar">
        <div className="admin-filter-bar">
          <label className="admin-filter-field">
            <span>活动榜</span>
            <select
              className="admin-filter-select"
              value={campaign}
              onChange={(e) => {
                const value = e.target.value;
                setCampaign(value);
                loadRankings(value);
              }}
            >
              <option value="">总榜（全部已上架）</option>
              {campaigns.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.rankLabel || item.title}
                </option>
              ))}
            </select>
          </label>
          <p className="admin-hint">
            排序：置顶 → 权重 → 综合评分 → 评分人数 → 提交时间。隐藏后不出现在前台榜单。
          </p>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="admin-empty">加载中...</div>
      ) : items.length === 0 ? (
        <EmptyState title="暂无榜单数据" />
      ) : (
        <div className="admin-masonry">
          {items.map((product) => (
            <article
              className={
                "admin-masonry-card" +
                (product.rankHidden ? " is-off" : "")
              }
              key={product.id}
            >
              <div className="admin-masonry-card-top">
                <span
                  className={`status-badge status-${product.status || "approved"}`}
                >
                  {product.rankHidden
                    ? "已隐藏"
                    : product.rankPinned
                      ? "已置顶"
                      : `评分 ${product.avgRating || 0}`}
                </span>
                <span className="admin-masonry-sort">#{product.rank}</span>
              </div>
              <h2 className="admin-masonry-title">{product.name}</h2>
              {product.tagline && (
                <p className="admin-masonry-desc">{product.tagline}</p>
              )}
              <div className="admin-masonry-meta">
                <span>综合分 {product.avgRating || 0}</span>
                <span>
                  评分人数 {product.ratingCount || product.voteCount || 0}
                </span>
                <span>权重 {product.rankWeight || 0}</span>
                {product.campaignLabel && (
                  <span className="special-badge">{product.campaignLabel}</span>
                )}
              </div>
              <div className="admin-masonry-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  disabled={actionId === product.id}
                  onClick={() =>
                    patchRank(product, { rankPinned: !product.rankPinned })
                  }
                >
                  {product.rankPinned ? "取消置顶" : "置顶"}
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-ghost"
                  disabled={actionId === product.id}
                  onClick={() =>
                    patchRank(product, { rankHidden: !product.rankHidden })
                  }
                >
                  {product.rankHidden ? "取消隐藏" : "隐藏"}
                </button>
                <label className="admin-weight-field">
                  <span>权重</span>
                  <input
                    type="number"
                    className="admin-weight-input"
                    defaultValue={product.rankWeight || 0}
                    disabled={actionId === product.id}
                    onBlur={(e) => {
                      const next = Number(e.target.value);
                      if (
                        !Number.isFinite(next) ||
                        next === (product.rankWeight || 0)
                      ) {
                        return;
                      }
                      patchRank(product, { rankWeight: next });
                    }}
                  />
                </label>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
