import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchAdminBanners,
  fetchAdminNavs,
  fetchAdminProducts,
} from "../../api";

const STAT_CARDS = [
  { key: "pending", label: "待审核资源", tone: "warning" },
  { key: "approved", label: "已上架资源", tone: "success" },
  { key: "rejected", label: "已拒绝资源", tone: "danger" },
  { key: "all", label: "资源总数", tone: "primary" },
  { key: "banners", label: "轮播图", tone: "neutral" },
  { key: "navs", label: "导航栏", tone: "neutral" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState({
    products: { pending: 0, approved: 0, rejected: 0, all: 0 },
    banners: 0,
    navs: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");
      const [pending, approved, rejected, all, banners, navs] =
        await Promise.all([
          fetchAdminProducts("pending"),
          fetchAdminProducts("approved"),
          fetchAdminProducts("rejected"),
          fetchAdminProducts("all"),
          fetchAdminBanners(),
          fetchAdminNavs(),
        ]);
      setDashboard({
        products: {
          pending: Array.isArray(pending) ? pending.length : 0,
          approved: Array.isArray(approved) ? approved.length : 0,
          rejected: Array.isArray(rejected) ? rejected.length : 0,
          all: Array.isArray(all) ? all.length : 0,
        },
        banners: Array.isArray(banners) ? banners.length : 0,
        navs: Array.isArray(navs) ? navs.length : 0,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <div className="dash">
      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="dash-loading">加载中...</div>
      ) : (
        <>
          <div className="dash-grid">
            {STAT_CARDS.map((card) => (
              <div
                className={`dash-card dash-card-${card.tone}`}
                key={card.key}
              >
                <span className="dash-card-label">{card.label}</span>
                <span className="dash-card-value">
                  {card.key === "banners"
                    ? dashboard.banners
                    : card.key === "navs"
                      ? dashboard.navs
                      : dashboard.products[card.key]}
                </span>
              </div>
            ))}
          </div>

          <div className="dash-section">
            <h2 className="dash-section-title">快捷操作</h2>
            <div className="dash-actions">
              <button
                type="button"
                className="dash-action"
                onClick={() => navigate("/admin/products")}
              >
                审核待处理资源
                <span className="dash-action-badge">
                  {dashboard.products.pending}
                </span>
              </button>
              <button
                type="button"
                className="dash-action"
                onClick={() => navigate("/admin/banners")}
              >
                管理首页轮播图
              </button>
              <button
                type="button"
                className="dash-action"
                onClick={() => navigate("/admin/navs")}
              >
                管理顶部导航
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
