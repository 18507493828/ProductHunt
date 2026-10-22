import { useEffect, useRef, useState } from "react";
import EmptyState from "../../components/EmptyState";
import SubmitProductModal from "../../components/SubmitProductModal";
import {
  isHostedAppUrl,
  toAbsoluteDemoUrl,
} from "../../appPlatforms";
import {
  approveProduct,
  bulkApproveProducts,
  bulkDeleteProducts,
  deleteProduct,
  fetchAdminProducts,
  fetchAdminCampaigns,
  fetchBuildConfig,
  fetchCategoryOptions,
  rejectProduct,
  setProductSpecial,
  unpublishProduct,
} from "../../api";

const STATUS_TABS = [
  { key: "pending", label: "待审核" },
  { key: "approved", label: "已上架" },
  { key: "rejected", label: "未通过" },
  { key: "offline", label: "已下架" },
  { key: "all", label: "全部" },
];

const STATUS_LABEL = {
  pending: "待审核",
  approved: "已上架",
  rejected: "未通过",
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
  const [editingProduct, setEditingProduct] = useState(null);
  /* 批量操作：勾选的作品 id、正在执行的批量动作（approve / delete） */
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  const selectAllRef = useRef(null);

  const campaignOptions = [
    { id: "", label: "无活动" },
    ...campaigns.map((item) => ({
      id: item.id,
      label:
        item.title + (item.enabled === false ? "（隐）" : ""),
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

  /* 切标签 / 改筛选后清空勾选，避免批量操作到当前看不到的作品 */
  useEffect(() => {
    setSelectedIds([]);
  }, [activeStatus, filters]);

  const allSelected =
    products.length > 0 && selectedIds.length === products.length;

  /* 只有待审核的作品能批量通过；已上架 / 未通过 / 已下架的选中项会被跳过 */
  const selectedProducts = products.filter((item) =>
    selectedIds.includes(item.id),
  );
  const approvableIds = selectedProducts
    .filter((item) => item.status === "pending")
    .map((item) => item.id);
  const skippedSelectedCount = selectedProducts.length - approvableIds.length;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        selectedIds.length > 0 && selectedIds.length < products.length;
    }
  }, [selectedIds, products.length]);

  function toggleOne(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function toggleAll() {
    setSelectedIds((prev) =>
      prev.length === products.length ? [] : products.map((item) => item.id),
    );
  }

  async function handleBulkApprove() {
    if (!approvableIds.length) return;
    if (
      approvableIds.length > 10 &&
      !window.confirm(`确定通过选中的 ${approvableIds.length} 个待审核应用吗？`)
    ) {
      return;
    }
    try {
      setBulkAction("approve");
      setError("");
      const result = await bulkApproveProducts(approvableIds);
      const failedCount = result?.failed?.length || 0;
      if (failedCount) {
        setError(`${result?.message || "批量通过完成"}，其中 ${failedCount} 个失败`);
      }
      setSelectedIds([]);
      await loadProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setBulkAction("");
    }
  }

  async function handleBulkDelete() {
    if (!selectedIds.length) return;
    if (
      !window.confirm(
        `确定删除选中的 ${selectedIds.length} 个应用吗？此操作不可恢复。`,
      )
    ) {
      return;
    }
    try {
      setBulkAction("delete");
      setError("");
      const result = await bulkDeleteProducts(selectedIds);
      const failedCount = result?.failed?.length || 0;
      if (failedCount) {
        setError(`${result?.message || "批量删除完成"}，其中 ${failedCount} 个失败`);
      }
      setSelectedIds([]);
      await loadProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setBulkAction("");
    }
  }

  useEffect(() => {
    fetchAdminCampaigns()
      .then((list) => setCampaigns(Array.isArray(list) ? list : []))
      .catch(() => setCampaigns([]));
    Promise.all([
      fetchBuildConfig().catch(() => null),
      fetchCategoryOptions().catch(() => ({ categories: [] })),
    ]).then(([buildConfig, catRes]) => {
      const sceneNames = (buildConfig?.scenes || [])
        .filter((s) => s && s.enabled !== false && s.name)
        .sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0))
        .map((s) => s.name);
      const fallback = Array.isArray(catRes?.categories)
        ? catRes.categories
        : Array.isArray(catRes)
          ? catRes
          : [];
      setCategories(sceneNames.length ? sceneNames : fallback);
    });
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

  async function handleOffline(id, name) {
    if (!window.confirm(`确定下架应用「${name}」？广场将不再展示。`)) return;
    try {
      setActionId(id);
      setError("");
      await unpublishProduct(id);
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
          <option value="">全部场景</option>
          {categories.map((item) => {
            const name = typeof item === "string" ? item : item.name;
            if (!name) return null;
            return (
              <option key={name} value={name}>
                {name}
              </option>
            );
          })}
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
              {item.enabled === false ? "（已隐藏）" : ""}
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

      {!loading && products.length > 0 && (
        <div className="admin-bulk-bar">
          <label className="admin-bulk-check">
            <input
              ref={selectAllRef}
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
            />
            <span>全选</span>
          </label>
          <span className="admin-bulk-count">
            已选 {selectedIds.length} / {products.length}
          </span>
          <div className="admin-bulk-actions">
            {selectedIds.length > 0 && (
              <button
                type="button"
                className="admin-btn admin-btn-ghost"
                disabled={Boolean(bulkAction)}
                onClick={() => setSelectedIds([])}
              >
                取消选择
              </button>
            )}
            {approvableIds.length > 0 && (
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                disabled={Boolean(bulkAction)}
                onClick={handleBulkApprove}
              >
                {bulkAction === "approve"
                  ? "通过中..."
                  : `批量通过（${approvableIds.length}）`}
              </button>
            )}
            {selectedIds.length > 0 && approvableIds.length === 0 && (
              <span className="admin-bulk-hint">
                选中项中没有待审核应用
              </span>
            )}
            {approvableIds.length > 0 && skippedSelectedCount > 0 && (
              <span className="admin-bulk-hint">
                另 {skippedSelectedCount} 个非待审核项将跳过
              </span>
            )}
            <button
              type="button"
              className="admin-btn admin-btn-danger"
              disabled={!selectedIds.length || Boolean(bulkAction)}
              onClick={handleBulkDelete}
            >
              {bulkAction === "delete"
                ? "删除中..."
                : `批量删除${selectedIds.length ? `（${selectedIds.length}）` : ""}`}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="admin-empty">加载中...</div>
      ) : products.length === 0 ? (
        <EmptyState title="当前条件下没有应用" />
      ) : (
        <div className="admin-masonry">
          {products.map((product) => (
            <article
              className={
                "admin-masonry-card" +
                (selectedIds.includes(product.id) ? " is-selected" : "")
              }
              key={product.id}
            >
              <div className="admin-masonry-card-top">
                <div className="admin-masonry-card-top-left">
                  <input
                    type="checkbox"
                    className="admin-select-box"
                    checked={selectedIds.includes(product.id)}
                    onChange={() => toggleOne(product.id)}
                    aria-label={`选择 ${product.name}`}
                  />
                  <span className={`status-badge status-${product.status}`}>
                    {STATUS_LABEL[product.status] || product.status}
                  </span>
                </div>
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
                    .join("、") || "未选场景"}
                </span>
                <span>{product.submittedBy || "未知"}</span>
                <span>分享 {product.shareCount ?? 0}</span>
                <span>
                  {product.cardImageUrl ? "卡片封面：已设置" : "卡片封面：用详情页"}
                </span>
                {product.campaignLabel && (
                  <span className="special-badge">{product.campaignLabel}</span>
                )}
                {product.url && (
                  <a
                    className="admin-masonry-link"
                    href={product.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    title={toAbsoluteDemoUrl(product.url)}
                  >
                    {isHostedAppUrl(product.url) && (
                      <span className="admin-masonry-link-tag">站内发布</span>
                    )}
                    {toAbsoluteDemoUrl(product.url)}
                  </a>
                )}
                {product.rejectReason && (
                  <span>拒绝：{product.rejectReason}</span>
                )}
              </div>
              <div className="admin-masonry-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn-ghost"
                  disabled={actionId === product.id}
                  onClick={() => setEditingProduct(product)}
                >
                  编辑
                </button>
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
                  <>
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
                    <button
                      type="button"
                      className="admin-btn admin-btn-ghost"
                      disabled={actionId === product.id}
                      onClick={() => handleOffline(product.id, product.name)}
                    >
                      下架
                    </button>
                  </>
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

      <SubmitProductModal
        open={Boolean(editingProduct)}
        editingProduct={editingProduct}
        showCardCover
        onClose={() => setEditingProduct(null)}
        onSuccess={async () => {
          setEditingProduct(null);
          await loadProducts();
        }}
      />
    </>
  );
}
