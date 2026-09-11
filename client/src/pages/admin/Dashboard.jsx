import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchAdminBanners,
  fetchAdminNavs,
  fetchAdminOpsOverview,
  fetchAdminProducts,
} from "../../api";
import EcosystemStats from "../../components/EcosystemStats";

function formatCount(n) {
  const num = Number(n) || 0;
  if (num >= 10000) return `${(num / 10000).toFixed(1).replace(/\.0$/, "")}万`;
  return String(num);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState({
    products: { pending: 0, approved: 0, rejected: 0, all: 0 },
    banners: 0,
    navs: 0,
  });
  const [ops, setOps] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");
      const [pending, approved, rejected, all, banners, navs, overview] =
        await Promise.all([
          fetchAdminProducts("pending"),
          fetchAdminProducts("approved"),
          fetchAdminProducts("rejected"),
          fetchAdminProducts("all"),
          fetchAdminBanners(),
          fetchAdminNavs(),
          fetchAdminOpsOverview().catch(() => null),
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
      setOps(overview);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const kpis = ops?.kpis;
  const funnel = ops?.funnel;
  const funnelMax = Math.max(
    funnel?.build || 0,
    funnel?.publish || 0,
    funnel?.experience || 0,
    funnel?.share || 0,
    1,
  );

  return (
    <div className="dash">
      {error && <div className="error">{error}</div>}

      <div className="dash-section">
        <h2 className="dash-section-title">关键指标看板</h2>
        <p className="admin-hint">
          应用审核与下架 · 渠道推广许可 · 榜单与激励系统
        </p>
        {loading ? (
          <div className="dash-loading">加载中...</div>
        ) : (
          <div className="dash-grid ph-ops-kpi-grid">
            <div className="dash-card dash-card-primary">
              <span className="dash-card-label">今日活跃构建者</span>
              <span className="dash-card-value">
                {formatCount(kpis?.activeBuildersToday ?? 0)}
              </span>
            </div>
            <div className="dash-card dash-card-success">
              <span className="dash-card-label">本周新增应用</span>
              <span className="dash-card-value">
                {formatCount(kpis?.weekNewApps ?? dashboard.products.all)}
              </span>
            </div>
            <div className="dash-card dash-card-warning">
              <span className="dash-card-label">待审核应用</span>
              <span className="dash-card-value">
                {kpis?.pending ?? dashboard.products.pending}
              </span>
            </div>
            <div className="dash-card dash-card-neutral">
              <span className="dash-card-label">广场日均浏览</span>
              <span className="dash-card-value">
                {formatCount(kpis?.avgDailyViews ?? 0)}
              </span>
            </div>
            <div className="dash-card dash-card-primary">
              <span className="dash-card-label">华为码道相关转化</span>
              <span className="dash-card-value">
                {formatCount(kpis?.maodaoConversions ?? 0)}
              </span>
              <span className="dash-card-sub">
                单次激励 ¥{kpis?.maodaoReward ?? 9.9}
              </span>
            </div>
            <div className="dash-card dash-card-success">
              <span className="dash-card-label">已发放 / 激励池</span>
              <span className="dash-card-value">
                ¥{formatCount(kpis?.incentivePaid ?? 0)}
              </span>
              <span className="dash-card-sub">
                池 ¥{formatCount(kpis?.incentivePool ?? 0)}
              </span>
            </div>
          </div>
        )}
      </div>

      {!loading && funnel && (
        <div className="dash-section">
          <h2 className="dash-section-title">核心漏斗 · 构建 → 发布 → 体验（近 7 天）</h2>
          <div className="ph-ops-funnel">
            {[
              ["构建提交", funnel.build],
              ["审核通过", funnel.publish],
              ["累计浏览", funnel.experience],
              ["分享回流", funnel.share],
            ].map(([label, value]) => (
              <div key={label} className="ph-ops-funnel-item">
                <div className="ph-ops-funnel-meta">
                  <span>{label}</span>
                  <strong>{formatCount(value)}</strong>
                </div>
                <div className="ph-ops-funnel-track">
                  <span
                    style={{ width: `${Math.max(6, (value / funnelMax) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && ops?.sceneDistribution?.length > 0 && (
        <div className="dash-section">
          <h2 className="dash-section-title">场景分布 · 已发布应用</h2>
          <div className="ph-ops-scene-list">
            {ops.sceneDistribution.map((item) => (
              <div key={item.scene} className="ph-ops-scene-row">
                <span className="ph-ops-scene-name">{item.scene}</span>
                <div className="ph-ops-funnel-track">
                  <span style={{ width: `${Math.max(4, item.percent)}%` }} />
                </div>
                <span className="ph-ops-scene-count">
                  {item.count} · {item.percent}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && (
        <div className="dash-section">
          <div className="ph-ops-section-head">
            <h2 className="dash-section-title">应用审核队列</h2>
            <button
              type="button"
              className="ph-btn-secondary"
              onClick={() => navigate("/admin/products")}
            >
              进入审核
            </button>
          </div>
          {ops?.pendingPreview?.length ? (
            <div className="ph-ops-review-list">
              {ops.pendingPreview.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="ph-ops-review-item"
                  onClick={() => navigate("/admin/products")}
                >
                  <strong>{item.name}</strong>
                  <span>
                    {item.submittedBy || "未知"} ·{" "}
                    {(item.submittedAt || "").slice(0, 10)}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="admin-hint">暂无待审核应用</p>
          )}
        </div>
      )}

      <div className="dash-section">
        <h2 className="dash-section-title">快捷入口</h2>
        <div className="dash-actions">
          <button
            type="button"
            className="dash-action"
            onClick={() => navigate("/admin/products")}
          >
            应用审核 / 下架
            <span className="dash-action-badge">
              {dashboard.products.pending}
            </span>
          </button>
          <button
            type="button"
            className="dash-action"
            onClick={() => navigate("/admin/shares")}
          >
            渠道推广许可
          </button>
          <button
            type="button"
            className="dash-action"
            onClick={() => navigate("/admin/incentives")}
          >
            榜单激励配置
          </button>
          <button
            type="button"
            className="dash-action"
            onClick={() => navigate("/admin/rankings")}
          >
            榜单管理
          </button>
        </div>
      </div>

      <div className="dash-section dash-section-eco">
        <EcosystemStats />
      </div>
    </div>
  );
}
