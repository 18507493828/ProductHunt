import { useEffect, useState } from "react";
import EmptyState from "../../components/EmptyState";
import {
  approveProduct,
  deleteProduct,
  fetchAdminProducts,
  fetchCampaigns,
  fetchCategoryOptions,
  rejectProduct,
  setProductSpecial,
} from "../../api";

const STATUS_TABS = [
  { key: "pending", label: "待审核" },
  { key: "approved", label: "已上架" },
  { key: "rejected", label: "已拒绝" },
  { key: "offline", label: "已下架" },
  { key: "all", label: "全部" },
];

const STATUS_LABEL = {
  pending: "待审核",
  approved: "已上架",
  rejected: "已拒绝",
  offline: "已下架",
};

export default function Products() {
  const [activeStatus, setActiveStatus] = useState("pending");
  const [products, setProducts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ q: "", campaign: "", category: "" });
  const [draftFilters, setDraftFilters] = useState({
    q: "",
    campaign: "",
    category: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");

  const campaignOptions = [
    { id: "", label: "不参加活动" },
    ...campaigns.map((item) => ({
      id: item.id,
      label: item.title,
    })),
  ];

  async function loadProducts(status = activeStatus, nextFilters = filters) {
    try {
      setLoading(true);
      setError("");
      const list = await fetchAdminProducts(status, nextFilters);
      setProducts(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts(activeStatus, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStatus, filters]);

  useEffect(() => {
    fetchCampaigns()
      .then((list) => setCampaigns(Array.isArray(list) ? list : []))
      .catch(() => setCampaigns([]));
    fetchCategoryOptions()
      .then((data) => {
        const list = Array.isArray(data?.categories)
          ? data.categories
          : Array.isArray(data)
            ? data
            : [];
        setCategories(list);
      })
      .catch(() => setCategories([]));
  }, []);

  async function handleApprove(id) {
    try {
      setActionId(id);
      setError("");
      await approveProduct(id);
      await loadProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId("");
    }
  }

  async function handleReject(id) {
    const reason = window.prompt("拒绝原因（可选）") || "";
    try {
      setActionId(id);
      setError("");
      await rejectProduct(id, reason);
      await loadProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId("");
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`确定删除应用「${name}」吗？此操作不可恢复。`)) return;

    try {
      setActionId(id);
      setError("");
      await deleteProduct(id);
      await loadProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId("");
    }
  }

  async function handleCampaign(product, campaign) {
    try {
      setActionId(product.id);
      setError("");
      await setProductSpecial(product.id, { campaign });
      await loadProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId("");
    }
  }

  return (
    <>
      <div className="tabs">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={activeStatus === tab.key ? "tab active" : "tab"}
            onClick={() => setActiveStatus(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form
        className="admin-filter-bar"
        onSubmit={(e) => {
          e.preventDefault();
          setFilters({
            q: draftFilters.q.trim(),
            campaign: draftFilters.campaign,
            category: draftFilters.category,
          });
        }}
      >
        <input
          className="admin-filter-input"
          value={draftFilters.q}
          onChange={(e) =>
            setDraftFilters((prev) => ({ ...prev, q: e.target.value }))
          }
          placeholder="搜索名称 / 简介 / 提交者"
        />
        <select
          className="admin-filter-select"
          value={draftFilters.category}
          onChange={(e) =>
            setDraftFilters((prev) => ({ ...prev, category: e.target.value }))
          }
        >
          <option value="">全部分类</option>
          {categories.map((item) => (
            <option key={item.name || item} value={item.name || item}>
              {item.name || item}
            </option>
          ))}
        </select>
        <select
          className="admin-filter-select"
          value={draftFilters.campaign}
          onChange={(e) =>
            setDraftFilters((prev) => ({ ...prev, campaign: e.target.value }))
          }
        >
          <option value="">全部活动</option>
          {campaigns.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
        <div className="admin-filter-actions">
          <button type="submit" className="admin-btn admin-btn-primary">
            筛选
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-ghost"
            onClick={() => {
              const empty = { q: "", campaign: "", category: "" };
              setDraftFilters(empty);
              setFilters(empty);
            }}
          >
            重置
          </button>
        </div>
      </form>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="admin-empty">加载中...</div>
      ) : products.length === 0 ? (
        <EmptyState title="当前条件下没有应用" />
      ) : (
        <div className="admin-masonry">
          {products.map((product) => (
            <article className="admin-masonry-card" key={product.id}>
              <div className="admin-masonry-card-top">
                <span className={`status-badge status-${product.status}`}>
                  {STATUS_LABEL[product.status] || product.status}
                </span>
                <span className="admin-masonry-sort">
                  {product.voteCount ?? 0} 评分
                </span>
              </div>
              <h2 className="admin-masonry-title">{product.name}</h2>
              {(product.tagline || product.description) && (
                <p className="admin-masonry-desc">
                  {product.tagline}
                  {product.description ? ` —— ${product.description}` : ""}
                </p>
              )}
              <div className="admin-masonry-meta">
                <span>
                  {(product.categories?.length
                    ? product.categories
                    : [product.category]
                  )
                    .filter(Boolean)
                    .join("、") || "未分类"}
                </span>
                <span>{product.submittedBy || "未知"}</span>
                <span>分享 {product.shareCount ?? 0}</span>
                {product.campaignLabel && (
                  <span className="special-badge">{product.campaignLabel}</span>
                )}
                {product.url && (
                  <a href={product.url} target="_blank" rel="noreferrer noopener">
                    演示链接
                  </a>
                )}
                {product.rejectReason && (
                  <span>拒绝：{product.rejectReason}</span>
                )}
              </div>
              <div className="admin-masonry-actions">
                {product.status === "pending" && (
                  <>
                    <button
                      type="button"
                      className="admin-btn admin-btn-primary"
                      disabled={actionId === product.id}
                      onClick={() => handleApprove(product.id)}
                    >
                      通过
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn-ghost"
                      disabled={actionId === product.id}
                      onClick={() => handleReject(product.id)}
                    >
                      拒绝
                    </button>
                  </>
                )}
                {product.status === "approved" && (
                  <label className="admin-campaign-field">
                    <span className="sr-only">活动归属</span>
                    <select
                      className="admin-campaign-select"
                      value={product.campaign || ""}
                      disabled={actionId === product.id}
                      onChange={(e) => handleCampaign(product, e.target.value)}
                    >
                      {campaignOptions.map((option) => (
                        <option key={option.id || "none"} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <button
                  type="button"
                  className="admin-btn admin-btn-danger"
                  disabled={actionId === product.id}
                  onClick={() => handleDelete(product.id, product.name)}
                >
                  删除
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
