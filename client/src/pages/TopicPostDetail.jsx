import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Eye, Heart, MessageCircle, ArrowUpRight } from "lucide-react";
import {
  fetchTopicPost,
  likeTopicPost,
  postTopicComment,
} from "../api";
import { useAuth } from "../AuthContext";
import { useToast } from "../Toast";
import EmptyState from "../components/EmptyState";
import CachedImage from "../components/CachedImage";

function formatTopicName(name) {
  const n = (name || "").trim();
  if (!n) return "";
  return n.startsWith("#") && n.endsWith("#") ? n : `#${n}#`;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TopicPostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchTopicPost(id)
      .then((data) => {
        if (!cancelled) setPost(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  function requireLogin() {
    if (!user) {
      navigate("/login");
      return false;
    }
    return true;
  }

  async function handleLike() {
    if (!requireLogin()) return;
    try {
      setLikeBusy(true);
      const result = await likeTopicPost(id);
      setPost((prev) =>
        prev
          ? { ...prev, likedByMe: result.liked, likeCount: result.likeCount }
          : prev,
      );
    } catch (err) {
      toast.error("操作失败", err.message);
    } finally {
      setLikeBusy(false);
    }
  }

  async function handleComment(e) {
    e.preventDefault();
    if (!requireLogin()) return;
    const content = comment.trim();
    if (!content) return;
    try {
      setCommentBusy(true);
      const result = await postTopicComment(id, content);
      setPost((prev) =>
        prev
          ? {
              ...prev,
              commentCount: result.commentCount,
              comments: [result.comment, ...(prev.comments || [])],
            }
          : prev,
      );
      setComment("");
      toast.success("评论成功");
    } catch (err) {
      toast.error("评论失败", err.message);
    } finally {
      setCommentBusy(false);
    }
  }

  return (
    <div className="ph-page ph-detail-page">
      <header className="ph-detail-nav">
        <div className="ph-section-inner ph-detail-nav-inner">
          <button type="button" className="ph-detail-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} aria-hidden="true" />
            返回
          </button>
          <Link to="/" className="ph-logo ph-detail-logo">
            <span className="ph-logo-text">Vibe Building</span>
          </Link>
        </div>
      </header>

      <main className="ph-section">
        <div className="ph-section-inner ph-detail-wrap">
          {loading ? (
            <div className="ph-detail-skeleton">
              <div className="skeleton-line title" />
              <div className="skeleton-line" />
            </div>
          ) : error ? (
            <EmptyState title={error} description="内容可能已下线或不存在" />
          ) : post ? (
            <>
              <article className="ph-topic-post-detail">
                {post.topicName && (
                  <p className="ph-topic-post-detail-topic">
                    {formatTopicName(post.topicName)}
                  </p>
                )}
                <h1 className="ph-detail-title">{post.title}</h1>
                <p className="ph-detail-meta">
                  {post.submittedBy} · {formatDate(post.submittedAt)}
                </p>

                {post.imageUrl && (
                  <div className="ph-topic-post-detail-cover">
                    <CachedImage src={post.imageUrl} alt="" loading="eager" />
                  </div>
                )}

                <div className="ph-detail-desc">{post.content}</div>

                <div className="ph-detail-metrics">
                  <span>
                    <Eye size={15} aria-hidden="true" />
                    {post.viewCount ?? 0} 浏览
                  </span>
                  <span>
                    <Heart size={15} aria-hidden="true" />
                    {post.likeCount ?? 0} 点赞
                  </span>
                  <span>
                    <MessageCircle size={15} aria-hidden="true" />
                    {post.commentCount ?? 0} 评论
                  </span>
                </div>

                <div className="ph-detail-actions">
                  <button
                    type="button"
                    className={"ph-btn-secondary" + (post.likedByMe ? " active" : "")}
                    onClick={handleLike}
                    disabled={likeBusy}
                  >
                    <Heart size={16} aria-hidden="true" />
                    {post.likedByMe ? "已点赞" : "点赞"}
                  </button>
                  {post.linkUrl && (
                    <a
                      className="ph-btn-primary"
                      href={post.linkUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      打开链接
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </a>
                  )}
                </div>
              </article>

              <section className="ph-detail-section">
                <h2>评论 ({post.comments?.length ?? 0})</h2>
                <form className="ph-comment-form" onSubmit={handleComment}>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={user ? "写下你的想法…" : "登录后可评论"}
                    rows={3}
                    maxLength={500}
                    disabled={!user || commentBusy}
                  />
                  <div className="ph-comment-form-actions">
                    <span className="ph-comment-hint">{comment.length}/500</span>
                    <button
                      type="submit"
                      className="ph-btn-primary"
                      disabled={!user || commentBusy || !comment.trim()}
                    >
                      {commentBusy ? "发送中…" : "发表评论"}
                    </button>
                  </div>
                </form>

                {!post.comments?.length ? (
                  <p className="ph-comment-empty">还没有评论</p>
                ) : (
                  <ul className="ph-comment-list">
                    {post.comments.map((item) => (
                      <li className="ph-comment-item" key={item.id}>
                        <div className="ph-comment-head">
                          <strong>{item.author}</strong>
                          <time>{formatDate(item.createdAt)}</time>
                        </div>
                        <p>{item.content}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
