import { useEffect, useState } from "react";
import EmptyState from "../../components/EmptyState";
import {
  fetchAdminRankings,
  fetchAdminCampaigns,
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
    fetchAdminCampaigns()
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
                  {item.enabled === false ? "（已隐藏）" : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="admin-empty">加载中...</div>
      ) : items.length === 0 ? (
        <EmptyState title="暂无榜单数据" />
      ) : (
        <div className="admin-rank-grid">
          {items.map((product) => {
            const statusLabel = product.rankHidden
              ? "已隐藏"
              : product.rankPinned
                ? "已置顶"
                : "上榜中";
            const statusClass = product.rankHidden
              ? "is-hidden"
              : product.rankPinned
                ? "is-pinned"
                : "is-live";
            return (
              <article
                className={
                  "admin-rank-card" + (product.rankHidden ? " is-off" : "")
                }
                key={product.id}
              >
                <header className="admin-rank-card-head">
                  <span className="admin-rank-card-no" aria-label={`第 ${product.rank} 名`}>
                    #{product.rank}
                  </span>
                  <span className={"admin-rank-card-status " + statusClass}>
                    {statusLabel}
                  </span>
                </header>

                <div className="admin-rank-card-body">
                  <h2 className="admin-rank-card-title" title={product.name}>
                    {product.name}
                  </h2>
                  {product.tagline ? (
                    <p className="admin-rank-card-desc" title={product.tagline}>
                      {product.tagline}
                    </p>
                  ) : null}
                  <div className="admin-rank-card-stats">
                    <span>
                      综合分 <strong>{product.avgRating || 0}</strong>
                    </span>
                    <span>
                      评分人数{" "}
                      <strong>
                        {product.ratingCount || product.voteCount || 0}
                      </strong>
                    </span>
                    {product.campaignLabel ? (
                      <span className="admin-rank-card-campaign">
                        {product.campaignLabel}
                      </span>
                    ) : null}
                  </div>
                </div>

                <footer className="admin-rank-card-foot">
                  <div className="admin-rank-card-btns">
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
                  </div>
                  <label className="admin-rank-weight">
                    <span>权重</span>
                    <input
                      type="number"
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
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
