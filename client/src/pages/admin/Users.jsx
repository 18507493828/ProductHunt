import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/EmptyState";
import { fetchAdminUsers, updateAdminUser } from "../../api";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [draftQ, setDraftQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");

  async function loadUsers(keyword = q) {
    try {
      setLoading(true);
      setError("");
      const data = await fetchAdminUsers({ q: keyword });
      setUsers(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const admins = users.filter((u) => u.role === "admin").length;
    const maodaoUsers = users.filter((u) => (u.maodaoProductCount || 0) > 0)
      .length;
    return {
      total: users.length,
      admins,
      maodaoUsers,
    };
  }, [users]);

  async function toggleRole(user) {
    const nextRole = user.role === "admin" ? "user" : "admin";
    const label = nextRole === "admin" ? "设为管理员" : "取消管理员";
    if (
      !window.confirm(
        `确定将「${user.nickname || user.username}」${label}吗？`,
      )
    ) {
      return;
    }
    try {
      setActionId(user.id);
      setError("");
      await updateAdminUser(user.id, { role: nextRole });
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId("");
    }
  }

  return (
    <>
      <div className="admin-toolbar">
        <form
          className="admin-filter-bar"
          onSubmit={(e) => {
            e.preventDefault();
            setQ(draftQ.trim());
            loadUsers(draftQ.trim());
          }}
        >
          <input
            className="admin-filter-input"
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
            placeholder="搜索用户名 / 昵称"
          />
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
                loadUsers("");
              }}
            >
              重置
            </button>
          </div>
        </form>
        <div className="admin-stat-chips">
          <span>用户 {stats.total}</span>
          <span>管理员 {stats.admins}</span>
          <span>码道用户 {stats.maodaoUsers}</span>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="admin-empty">加载中...</div>
      ) : users.length === 0 ? (
        <EmptyState title="暂无用户" />
      ) : (
        <div className="admin-data-table-wrap">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>用户</th>
                <th className="admin-table-center">角色</th>
                <th className="admin-table-center">应用数</th>
                <th className="admin-table-center">码道应用</th>
                <th className="admin-table-center">注册时间</th>
                <th className="admin-table-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.nickname || user.username}</strong>
                    <div className="admin-table-sub">@{user.username}</div>
                  </td>
                  <td className="admin-table-center">
                    <span
                      className={
                        "status-badge " +
                        (user.role === "admin"
                          ? "status-approved"
                          : "status-pending")
                      }
                    >
                      {user.role === "admin" ? "管理员" : "用户"}
                    </span>
                  </td>
                  <td className="admin-table-center">{user.productCount || 0}</td>
                  <td className="admin-table-center">
                    {user.maodaoProductCount || 0}
                  </td>
                  <td className="admin-table-center">
                    {(user.createdAt || "").slice(0, 10) || "—"}
                  </td>
                  <td className="admin-table-center">
                    <button
                      type="button"
                      className="admin-btn admin-btn-ghost"
                      disabled={actionId === user.id}
                      onClick={() => toggleRole(user)}
                    >
                      {user.role === "admin" ? "取消管理员" : "设为管理员"}
                    </button>
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
