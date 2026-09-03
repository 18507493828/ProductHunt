import { useEffect, useState } from "react";
import EmptyState from "../../components/EmptyState";
import {
  approveProduct,
  deleteProduct,
  fetchAdminProducts,
  fetchCampaigns,
  rejectProduct,
  setProductSpecial,
} from "../../api";

const STATUS_TABS = [
  { key: "pending", label: "待审核" },
  { key: "approved", label: "已上架" },
  { key: "rejected", label: "已拒绝" },
  { key: "all", label: "全部" },
];

const STATUS_LABEL = {
  pending: "待审核",
  approved: "已上架",
  rejected: "已拒绝",
};

export default function Products() {
  const [activeStatus, setActiveStatus] = useState("pending");
  const [products, setProducts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
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

  async function loadProducts(status = activeStatus) {
    try {
      setLoading(true);
      setError("");
      const list = await fetchAdminProducts(status);
      setProducts(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts(activeStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStatus]);

  useEffect(() => {
    fetchCampaigns()
      .then((list) => setCampaigns(Array.isArray(list) ? list : []))
      .catch(() => setCampaigns([]));
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
    if (!window.confirm(`确定删除资源「${name}」吗？此操作不可恢复。`)) return;

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

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="admin-empty">加载中...</div>
      ) : products.length === 0 ? (
        <EmptyState title="当前状态下没有资源" />
      ) : (
        <div className="admin-list">
          {products.map((product) => (
            <article className="admin-item" key={product.id}>
              <div className="admin-item-main">
                <div className="admin-item-top">
                  <h2>{product.name}</h2>
                  <span className={`status-badge status-${product.status}`}>
                    {STATUS_LABEL[product.status] || product.status}
                  </span>
                </div>
                <p>
                  {product.tagline}
                  {product.description ? ` —— ${product.description}` : ""}
                </p>
                <div className="admin-meta">
                  <span>
                    分类：
                    {(product.categories?.length
                      ? product.categories
                      : [product.category]
                    )
                      .filter(Boolean)
                      .join("、") || "—"}
                  </span>
                  <span>提交者：{product.submittedBy || "未知"}</span>
                  <span>{product.voteCount ?? 0} 票</span>
                  {product.campaignLabel && (
                    <span className="special-badge">{product.campaignLabel}</span>
                  )}
                  {product.url && (
                    <a href={product.url} target="_blank" rel="noreferrer noopener">
                      演示链接
                    </a>
                  )}
                  {product.rejectReason && (
                    <span>拒绝原因：{product.rejectReason}</span>
                  )}
                </div>
              </div>
              <div className="admin-actions">
                {product.status === "pending" && (
                  <>
                    <button
                      type="button"
                      className="approve-btn"
                      disabled={actionId === product.id}
                      onClick={() => handleApprove(product.id)}
                    >
                      通过上架
                    </button>
                    <button
                      type="button"
                      className="reject-btn"
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
                  className="delete-btn"
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
