import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  approveProduct,
  deleteProduct,
  fetchAdminProducts,
  rejectProduct,
} from "../api";
import "../App.css";
import { useAuth } from "../AuthContext";

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

export default function Admin() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [activeStatus, setActiveStatus] = useState("pending");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");

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
    if (isAdmin) {
      loadProducts(activeStatus);
    }
  }, [activeStatus, isAdmin]);

  async function handleApprove(id) {
    try {
      setActionId(id);
      setError("");
      await approveProduct(id);
      await loadProducts(activeStatus);
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
      await loadProducts(activeStatus);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId("");
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`确定删除产品「${name}」吗？此操作不可恢复。`)) return;

    try {
      setActionId(id);
      setError("");
      await deleteProduct(id);
      await loadProducts(activeStatus);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId("");
    }
  }

  if (authLoading) {
    return <div className="auth-page">加载中...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>无权限</h1>
          <p className="auth-tip">需要管理员账号才能访问后台</p>
          <Link to="/" className="auth-submit-link">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="ph-page">
      <div className="admin-page">
        <header className="admin-header">
          <div>
            <p className="eyebrow">管理</p>
            <h1>产品审核后台</h1>
            <p className="subtitle">管理员：{user.username}</p>
          </div>
          <Link to="/" className="admin-back">
            返回首页
          </Link>
        </header>

        <div className="admin-container">
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
            <div className="admin-empty">当前状态下没有产品</div>
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
                      <span>分类：{product.category}</span>
                      <span>提交者：{product.submittedBy || "未知"}</span>
                      <span>{product.voteCount ?? 0} 票</span>
                      {product.url && (
                        <a
                          href={product.url}
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          产品链接
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
        </div>
      </div>
    </div>
  );
}
