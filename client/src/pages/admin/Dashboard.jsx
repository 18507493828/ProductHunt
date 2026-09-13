import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAdminOpsOverview, fetchAdminProducts } from "../../api";
import EcosystemStats from "../../components/EcosystemStats";

const PERIODS = [
  { id: "week", label: "周" },
  { id: "month", label: "月" },
  { id: "quarter", label: "季" },
];

function formatCount(n) {
  const num = Number(n) || 0;
  if (num >= 10000) return `${(num / 10000).toFixed(1).replace(/\.0$/, "")}万`;
  return String(num);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [range, setRange] = useState("week");
  const [pendingCount, setPendingCount] = useState(0);
  const [ops, setOps] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadDashboard(nextRange = range) {
    try {
      setLoading(true);
      setError("");
      const [pending, overview] = await Promise.all([
        fetchAdminProducts("pending"),
        fetchAdminOpsOverview(nextRange).catch(() => null),
      ]);
      setPendingCount(Array.isArray(pending) ? pending.length : 0);
      setOps(overview);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const kpis = ops?.kpis;
  const funnel = ops?.funnel;
  const rangeLabel = ops?.rangeLabel || "近 7 天";
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
        <div className="ph-ops-section-head">
          <div className="admin-period-tabs" role="tablist" aria-label="统计周期">
            {PERIODS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={range === item.id}
                className={
                  "admin-period-tab" + (range === item.id ? " is-active" : "")
                }
                onClick={() => setRange(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

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
              <span className="dash-card-label">{rangeLabel}新增应用</span>
              <span className="dash-card-value">
                {formatCount(kpis?.periodNewApps ?? kpis?.weekNewApps ?? 0)}
              </span>
            </div>
            <div className="dash-card dash-card-warning">
              <span className="dash-card-label">待审核应用</span>
              <span className="dash-card-value">
                {kpis?.pending ?? pendingCount}
              </span>
            </div>
            <div className="dash-card dash-card-neutral">
              <span className="dash-card-label">上架应用浏览</span>
              <span className="dash-card-value">
                {formatCount(kpis?.totalViews ?? kpis?.avgDailyViews ?? 0)}
              </span>
            </div>
            <div className="dash-card dash-card-primary">
              <span className="dash-card-label">华为码道转化</span>
              <span className="dash-card-value">
                {formatCount(kpis?.maodaoConversions ?? 0)}
              </span>
              <span className="dash-card-sub">
                ¥{kpis?.maodaoReward ?? 9.9}/次
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
          <h2 className="dash-section-title">漏斗 · {rangeLabel}</h2>
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
          <h2 className="dash-section-title">场景分布</h2>
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
            <h2 className="dash-section-title">待审核</h2>
            <button
              type="button"
              className="ph-btn-secondary"
              onClick={() => navigate("/admin/products")}
            >
              全部
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
          ) : null}
        </div>
      )}

      <div className="dash-section dash-section-eco">
        <EcosystemStats compact />
      </div>
    </div>
  );
}
