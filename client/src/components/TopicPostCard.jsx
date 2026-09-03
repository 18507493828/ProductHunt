import { Link, useNavigate } from "react-router-dom";
import { Eye, Heart, MessageCircle, ArrowUpRight } from "lucide-react";
import CachedImage from "./CachedImage";
import TopicRichText from "./TopicRichText";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TopicPostCard({ post, onLike, likeBusy }) {
  const navigate = useNavigate();
  const detailPath = `/topic-post/${post.id}`;

  return (
    <article className="ph-topic-post-card">
      <div className="ph-topic-post-main">
        <button
          type="button"
          className="ph-topic-post-cover-btn"
          onClick={() => navigate(detailPath)}
          aria-label={`查看：${post.title}`}
        >
          {post.imageUrl ? (
            <div className="ph-topic-post-cover">
              <CachedImage src={post.imageUrl} alt="" />
            </div>
          ) : (
            <div
              className="ph-topic-post-cover ph-topic-post-cover--placeholder"
              aria-hidden="true"
            >
              <span>{(post.title || "话").trim()[0]}</span>
            </div>
          )}
        </button>
        <div className="ph-topic-post-body">
          <h3 className="ph-topic-post-title">
            <Link to={detailPath}>{post.title}</Link>
          </h3>
          <TopicRichText
            text={post.content}
            as="p"
            className="ph-topic-post-excerpt"
          />
          <div className="ph-topic-post-meta">
            <span className="ph-topic-post-author">{post.submittedBy}</span>
            <span>{formatDate(post.submittedAt)}</span>
          </div>
        </div>
      </div>
      <div className="ph-topic-post-actions">
        <button
          type="button"
          className={"ph-topic-post-action" + (post.likedByMe ? " active" : "")}
          onClick={() => onLike?.(post)}
          disabled={likeBusy}
        >
          <Heart size={14} aria-hidden="true" />
          {post.likeCount ?? 0}
        </button>
        <Link to={detailPath} className="ph-topic-post-action">
          <MessageCircle size={14} aria-hidden="true" />
          {post.commentCount ?? 0}
        </Link>
        <span className="ph-topic-post-action static">
          <Eye size={14} aria-hidden="true" />
          {post.viewCount ?? 0}
        </span>
        {post.linkUrl && (
          <a
            className="ph-topic-post-action ph-topic-post-action--link"
            href={post.linkUrl}
            target="_blank"
            rel="noreferrer noopener"
            onClick={(e) => e.stopPropagation()}
          >
            外链
            <ArrowUpRight size={13} aria-hidden="true" />
          </a>
        )}
      </div>
    </article>
  );
}

export function TopicPostCardSkeleton() {
  return (
    <div className="ph-topic-post-card skeleton">
      <div className="ph-topic-post-skeleton-cover skeleton-media" />
      <div className="ph-topic-post-skeleton-body">
        <div className="skeleton-line title" />
        <div className="skeleton-line" />
        <div className="skeleton-line short" />
      </div>
    </div>
  );
}
