import { useEffect, useState } from "react";
import EmptyState from "../../components/EmptyState";
import {
  fetchAdminIncentiveGrants,
  fetchAdminMaodaoConversions,
  markIncentiveGrantPaid,
  rejectIncentiveGrant,
} from "../../api";

const TABS = [
  { id: "usage", label: "码道使用" },
  { id: "grants", label: "发奖列表" },
];

const RANGE_OPTIONS = [
  { id: "all", label: "全部" },
  { id: "week", label: "近 7 天" },
  { id: "month", label: "近 30 天" },
  { id: "quarter", label: "近 90 天" },
];

const GRANT_STATUS = [
  { id: "all", label: "全部状态" },
  { id: "pending", label: "待发放" },
  { id: "paid", label: "已发放" },
  { id: "rejected", label: "已驳回" },
];

function statusLabel(status) {
  if (status === "paid") return "已发放";
  if (status === "rejected") return "已驳回";
  if (status === "pending") return "待发放";
  return status || "—";
}

function statusClass(status) {
  if (status === "paid" || status === "approved") return "status-approved";
  if (status === "rejected") return "status-rejected";
  return "status-pending";
}

export default function MaodaoRewards() {
  const [tab, setTab] = useState("usage");
  const [q, setQ] = useState("");
  const [draftQ, setDraftQ] = useState("");
  const [range, setRange] = useState("all");
  const [grantStatus, setGrantStatus] = useState("pending");
  const [usage, setUsage] = useState({ items: [], total: 0, users: 0 });
  const [grants, setGrants] = useState({
    items: [],
    total: 0,
    summary: { pending: 0, paid: 0, rejected: 0, pendingAmount: 0, paidAmount: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");

  async function loadUsage(keyword = q, nextRange = range) {
    const data = await fetchAdminMaodaoConversions({
      q: keyword,
      range: nextRange,
    });
    setUsage(data);
  }

  async function loadGrants(keyword = q, status = grantStatus) {
    const data = await fetchAdminIncentiveGrants({
      q: keyword,
      status: status === "all" ? "" : status,
      toolId: "madao",
    });
    setGrants(data);
  }

  async function refresh(keyword = q) {
    try {
      setLoading(true);
      setError("");
      if (tab === "usage") {
        await loadUsage(keyword, range);
      } else {
        await loadGrants(keyword, grantStatus);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, range, grantStatus]);

  async function handlePaid(grant) {
    if (!window.confirm(`确认已向「${grant.nickname || grant.username}」发放 ¥${grant.amount}？`)) {
      return;
    }
    try {
      setActionId(grant.id);
      setError("");
      await markIncentiveGrantPaid(grant.id);
      await loadGrants();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId("");
    }
  }

  async function handleReject(grant) {
    const note = window.prompt("驳回原因（可选）", "");
    if (note === null) return;
    try {
      setActionId(grant.id);
      setError("");
      await rejectIncentiveGrant(grant.id, note);
      await loadGrants();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId("");
    }
  }

  return (
    <>
      <div className="admin-toolbar">
        <div className="admin-period-tabs" role="tablist" aria-label="码道发奖">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={
                "admin-period-tab" + (tab === item.id ? " is-active" : "")
              }
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <form
          className="admin-filter-bar"
          onSubmit={(e) => {
            e.preventDefault();
            setQ(draftQ.trim());
            refresh(draftQ.trim());
          }}
        >
          <input
            className="admin-filter-input"
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
            placeholder="搜索用户 / 应用 / 推广码"
          />
          {tab === "usage" ? (
            <select
              className="admin-filter-select"
              value={range}
              onChange={(e) => setRange(e.target.value)}
            >
              {RANGE_OPTIONS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          ) : (
            <select
              className="admin-filter-select"
              value={grantStatus}
              onChange={(e) => setGrantStatus(e.target.value)}
            >
              {GRANT_STATUS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          )}
          <div className="admin-filter-actions">
            <button type="submit" className="admin-btn admin-btn-primary">
              筛选
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-ghost"
              onClick={() => {
                setDraftQ("");
                setQ("");
                refresh("");
              }}
            >
              重置
            </button>
          </div>
        </form>
        <div className="admin-stat-chips">
          {tab === "usage" ? (
            <>
              <span>应用 {usage.total}</span>
              <span>用户 {usage.users}</span>
            </>
          ) : (
            <>
              <span>待发 {grants.summary.pending}</span>
              <span>已发 {grants.summary.paid}</span>
              <span>待发金额 ¥{grants.summary.pendingAmount}</span>
            </>
          )}
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="admin-empty">加载中...</div>
      ) : tab === "usage" ? (
        usage.items.length === 0 ? (
          <EmptyState title="暂无码道使用记录" />
        ) : (
          <div className="admin-data-table-wrap">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>应用</th>
                  <th>提交者</th>
                  <th>推广码</th>
                  <th>状态</th>
                  <th>提交时间</th>
                  <th>浏览</th>
                </tr>
              </thead>
              <tbody>
                {usage.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                      <div className="admin-table-sub">
                        {item.buildToolName || "华为码道"}
                      </div>
                    </td>
                    <td>{item.submittedNickname || item.submittedBy || "—"}</td>
                    <td>{item.inviteCode || "—"}</td>
                    <td>
                      <span className={"status-badge " + statusClass(item.status)}>
                        {item.status === "approved"
                          ? "已上架"
                          : item.status === "pending"
                            ? "待审"
                            : item.status}
                      </span>
                    </td>
                    <td>{(item.submittedAt || "").slice(0, 10) || "—"}</td>
                    <td>{item.viewCount || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : grants.items.length === 0 ? (
        <EmptyState title="暂无发奖记录" />
      ) : (
        <div className="admin-data-table-wrap">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>用户</th>
                <th>关联应用</th>
                <th>金额</th>
                <th>状态</th>
                <th>入账时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {grants.items.map((grant) => (
                <tr key={grant.id}>
                  <td>
                    <strong>{grant.nickname || grant.username}</strong>
                    <div className="admin-table-sub">@{grant.username}</div>
                  </td>
                  <td>{grant.productName || grant.productId || "—"}</td>
                  <td>¥{grant.amount}</td>
                  <td>
                    <span className={"status-badge " + statusClass(grant.status)}>
                      {statusLabel(grant.status)}
                    </span>
                  </td>
                  <td>{(grant.grantedAt || grant.createdAt || "").slice(0, 10) || "—"}</td>
                  <td>
                    <div className="admin-masonry-actions">
                      {grant.status === "pending" ? (
                        <>
                          <button
                            type="button"
                            className="admin-btn admin-btn-primary"
                            disabled={actionId === grant.id}
                            onClick={() => handlePaid(grant)}
                          >
                            标记已发放
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn-ghost"
                            disabled={actionId === grant.id}
                            onClick={() => handleReject(grant)}
                          >
                            驳回
                          </button>
                        </>
                      ) : (
                        <span className="admin-table-sub">
                          {grant.paidAt
                            ? `发放于 ${(grant.paidAt || "").slice(0, 10)}`
                            : grant.note || "—"}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
