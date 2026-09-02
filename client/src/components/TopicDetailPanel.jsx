import { useEffect, useState } from "react";
import { ArrowLeft, Flame, Heart, MessageSquare, PenLine, Users } from "lucide-react";
import { fetchTopic, followTopic } from "../api";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";

function formatTopicName(name) {
  const n = (name || "").trim();
  if (!n) return "";
  return n.startsWith("#") && n.endsWith("#") ? n : `#${n}#`;
}

function formatCount(n) {
  const num = Number(n) || 0;
  if (num >= 10000) return `${(num / 10000).toFixed(1).replace(/\.0$/, "")}万`;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(num);
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getTopicInitial(name = "") {
  return (name.trim().replace(/^#+|#+$/g, "")[0] || "话").toUpperCase();
}

function TopicDetailSkeleton() {
  return (
    <div className="ph-topic-detail ph-topic-detail--loading">
      <div className="ph-topic-detail-hero skeleton-media" />
      <div className="ph-topic-detail-stats-bar">
        {Array.from({ length: 3 }).map((_, i) => (
          <div className="ph-topic-detail-stat skeleton" key={i}>
            <div className="skeleton-line title" />
            <div className="skeleton-line short" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TopicDetailPanel({ topicId, onClear, onPublish }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  useEffect(() => {
    if (!topicId) {
      setTopic(null);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    fetchTopic(topicId)
      .then((data) => {
        if (!cancelled) {
          setTopic(data);
          setFollowing(data.following === true);
        }
      })
      .catch(() => {
        if (!cancelled) setTopic(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [topicId]);

  async function handleFollow() {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      setFollowBusy(true);
      const result = await followTopic(topicId);
      setFollowing(result.following);
      setTopic((prev) =>
        prev ? { ...prev, followerCount: result.followerCount, following: result.following } : prev,
      );
    } finally {
      setFollowBusy(false);
    }
  }

  if (!topicId) return null;
  if (loading) return <TopicDetailSkeleton />;
  if (!topic) {
    return (
      <div className="ph-topic-detail ph-topic-detail--error">
        <button type="button" className="ph-topic-detail-back" onClick={onClear}>
          <ArrowLeft size={16} aria-hidden="true" />
          返回话题列表
        </button>
        <p>话题不存在或已下线</p>
      </div>
    );
  }

  const accent = topic.color || "var(--ph-accent)";
  const heroStyle = topic.coverImage
    ? {
        backgroundImage: `linear-gradient(135deg, rgba(10, 14, 26, 0.55) 0%, rgba(10, 14, 26, 0.75) 100%), url(${topic.coverImage})`,
      }
    : {
        background: `linear-gradient(135deg, ${accent} 0%, rgba(10, 14, 26, 0.85) 100%)`,
      };

  return (
    <div className="ph-topic-detail">
      <div className="ph-topic-detail-hero" style={heroStyle}>
        <div className="ph-topic-detail-hero-top">
          <button type="button" className="ph-topic-detail-back" onClick={onClear}>
            <ArrowLeft size={16} aria-hidden="true" />
            返回
          </button>
          <div className="ph-topic-detail-hero-actions">
            <button
              type="button"
              className={"ph-topic-detail-follow" + (following ? " following" : "")}
              onClick={handleFollow}
              disabled={followBusy}
            >
              <Heart size={14} aria-hidden="true" fill={following ? "currentColor" : "none"} />
              {following ? "已关注" : "关注"}
            </button>
            {onPublish && (
              <button type="button" className="ph-topic-detail-publish" onClick={onPublish}>
                <PenLine size={14} aria-hidden="true" />
                发布内容
              </button>
            )}
          </div>
        </div>

        <div className="ph-topic-detail-hero-main">
          <div
            className="ph-topic-detail-avatar"
            style={!topic.coverImage ? { background: accent } : undefined}
            aria-hidden="true"
          >
            {topic.coverImage ? (
              <img src={topic.coverImage} alt="" />
            ) : (
              getTopicInitial(topic.name)
            )}
          </div>
          <div className="ph-topic-detail-info">
            <h1 className="ph-topic-detail-name">{formatTopicName(topic.name)}</h1>
            <p className="ph-topic-detail-desc">
              {topic.description || "暂无话题简介，欢迎分享你的观点与经验"}
            </p>
            <div className="ph-topic-detail-meta">
              {topic.createdBy && <span>由 {topic.createdBy} 创建</span>}
              {topic.createdAt && <span>{formatDate(topic.createdAt)}</span>}
              {topic.region && topic.region !== "全国" && (
                <span className="ph-topic-detail-region">{topic.region}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="ph-topic-detail-stats-bar">
        <div className="ph-topic-detail-stat">
          <Flame size={16} aria-hidden="true" />
          <div>
            <strong>{formatCount(topic.hotScore ?? 0)}</strong>
            <span>热度</span>
          </div>
        </div>
        <div className="ph-topic-detail-stat">
          <MessageSquare size={16} aria-hidden="true" />
          <div>
            <strong>{topic.postCount ?? topic.productCount ?? 0}</strong>
            <span>内容</span>
          </div>
        </div>
        <div className="ph-topic-detail-stat">
          <Users size={16} aria-hidden="true" />
          <div>
            <strong>{topic.followerCount ?? 0}</strong>
            <span>关注</span>
          </div>
        </div>
      </div>
    </div>
  );
}
