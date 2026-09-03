import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCampaigns, fetchProducts } from "../api";
import EmptyState from "./EmptyState";

const TOP_N = 10;

export default function RankList() {
  const [campaigns, setCampaigns] = useState([]);
  const [tab, setTab] = useState("all");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    fetchCampaigns()
      .then((list) => {
        if (!ignore) setCampaigns(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!ignore) setCampaigns([]);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const tabs = useMemo(
    () => [
      { key: "all", label: "总榜", type: "all" },
      ...campaigns.map((campaign) => ({
        key: campaign.id,
        label: campaign.rankLabel || campaign.title,
        type: "campaign",
        campaignId: campaign.id,
      })),
    ],
    [campaigns],
  );

  useEffect(() => {
    if (!tabs.some((item) => item.key === tab)) {
      setTab("all");
    }
  }, [tabs, tab]);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");
    const current = tabs.find((item) => item.key === tab);
    const promise =
      current?.type === "campaign"
        ? fetchProducts({ category: "全部", campaign: current.campaignId })
        : fetchProducts({ category: "全部", range: "all" });
    promise
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
  }, [tab, tabs]);

  const activeTab = tabs.find((item) => item.key === tab);

  return (
    <div className="rank-card">
      <h2 className="rank-title">热门榜单</h2>
      <div className="rank-tabs" role="tablist" aria-label="榜单">
        {tabs.map((t) => (
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
        <EmptyState
          compact
          title={
            activeTab?.type === "campaign"
              ? `暂无${activeTab.label}`
              : "暂无数据"
          }
        />
      ) : (
        <ol className="rank-list">
          {items.map((product, index) => (
            <li className="rank-item" key={product.id}>
              <Link className="rank-link" to={`/resource/${product.id}`}>
                <span className="rank-num">{index + 1}</span>
                <span className="rank-name" title={product.name}>
                  {product.name}
                </span>
                <span className="rank-votes">
                  <span className="rank-votes-icon">🔥</span>
                  <span className="rank-votes-label">热度值</span>
                  <span>{product.voteCount ?? 0}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
