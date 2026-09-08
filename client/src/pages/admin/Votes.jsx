import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/EmptyState";
import { RATING_DIMENSIONS } from "../../ratingDimensions";
import {
  deleteAdminVote,
  fetchAdminVotes,
} from "../../api";

export default function Votes() {
  const [votes, setVotes] = useState([]);
  const [q, setQ] = useState("");
  const [draftQ, setDraftQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");

  async function loadVotes(keyword = q) {
    try {
      setLoading(true);
      setError("");
      const list = await fetchAdminVotes({ q: keyword });
      setVotes(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const users = new Set(votes.map((item) => item.userId).filter(Boolean));
    const products = new Set(votes.map((item) => item.productId).filter(Boolean));
    return {
      total: votes.length,
      users: users.size,
      products: products.size,
    };
  }, [votes]);

  async function handleDelete(vote) {
    if (
      !window.confirm(
        `确定删除「${vote.nickname || vote.username || vote.userId}」对「${vote.productName}」的评分吗？`,
      )
    ) {
      return;
    }
    try {
      setActionId(vote.id);
      setError("");
      await deleteAdminVote(vote.productId, vote.userId);
      await loadVotes();
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
            loadVotes(draftQ.trim());
          }}
        >
          <input
            className="admin-filter-input"
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
            placeholder="搜索应用名 / 用户名"
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
                loadVotes("");
              }}
            >
              重置
            </button>
          </div>
        </form>
        <div className="admin-stat-chips">
          <span>评分 {stats.total}</span>
          <span>用户 {stats.users}</span>
          <span>应用 {stats.products}</span>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="admin-empty">加载中...</div>
      ) : votes.length === 0 ? (
        <EmptyState title="暂无投票数据" />
      ) : (
        <div className="admin-masonry">
          {votes.map((vote) => (
            <article className="admin-masonry-card" key={vote.id}>
              <div className="admin-masonry-card-top">
                <span className="status-badge status-approved">
                  综合 {vote.overall}
                </span>
              </div>
              <h2 className="admin-masonry-title">
                {vote.productName || vote.productId}
              </h2>
              <div className="admin-masonry-meta">
                <span>
                  {vote.nickname || vote.username || vote.userId || "未知"}
                </span>
                {vote.username && vote.nickname !== vote.username && (
                  <span>账号：{vote.username}</span>
                )}
              </div>
              <div className="admin-masonry-dims">
                {RATING_DIMENSIONS.map((dim) => (
                  <span key={dim.key}>
                    {dim.label} {vote.ratings?.[dim.key] ?? "—"}
                  </span>
                ))}
              </div>
              <div className="admin-masonry-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn-danger"
                  disabled={actionId === vote.id}
                  onClick={() => handleDelete(vote)}
                >
                  删除评分
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
