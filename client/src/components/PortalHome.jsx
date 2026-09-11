import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Eye, Rocket, Share2, Sparkles, Users, Boxes, Coins } from "lucide-react";
import { fetchProducts, fetchStats } from "../api";
import { BUILD_SCENES, heatScore, inferSceneIdFromText } from "../buildConfig";
import ProductCard, { ProductCardSkeleton } from "./ProductCard";

function formatCount(n) {
  const num = Number(n) || 0;
  if (num >= 10000) return `${(num / 10000).toFixed(1).replace(/\.0$/, "")}万`;
  return String(num);
}

const PILLARS = [
  {
    id: "build",
    icon: Sparkles,
    title: "我要构建",
    desc: "选场景 → 选话题 → 选工具 → 生成任务书，4 步构建，10 分钟拥有你的 AI 应用。",
    preview: "场景 · 话题 · 工具 · 任务书 · 华为码道 ¥9.9 激励",
  },
  {
    id: "publish",
    icon: Rocket,
    title: "我要发布",
    desc: "按表单一键提交审核，上架应用广场，让你的应用被更多人看见和体验。",
    preview: "上架应用广场 · 全网开发者可体验",
  },
  {
    id: "promote",
    icon: Share2,
    title: "我要霸榜",
    desc: "一键分享到小红书 / 抖音 / 朋友圈 / CSDN，热度冲上周榜赢现金激励。",
    preview: "小红书 · 抖音 · 朋友圈 · CSDN 博客",
  },
];

export default function PortalHome({
  onOpenSquare,
  onOpenBuild,
  onOpenPublish,
  onOpenPromote,
  onVote,
  votingId,
}) {
  const [stats, setStats] = useState(null);
  const [hot, setHot] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sceneFilter, setSceneFilter] = useState("all");
  const [sort, setSort] = useState("hot");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchStats().catch(() => null),
      fetchProducts({ category: "全部", range: "all" }).catch(() => []),
    ]).then(([s, list]) => {
      if (cancelled) return;
      setStats(s);
      setHot(Array.isArray(list) ? list : []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredHot = useMemo(() => {
    let list = [...hot];
    if (sceneFilter !== "all") {
      const scene = BUILD_SCENES.find((s) => s.id === sceneFilter);
      list = list.filter((p) => {
        const sid = inferSceneIdFromText(
          `${p.topicName || ""}\n${p.name || ""}\n${p.tagline || ""}\n${p.description || ""}`,
        );
        return sid === sceneFilter || (scene && (p.topicName || "").includes(scene.name));
      });
    }
    if (sort === "new") {
      list.sort((a, b) =>
        String(b.submittedAt || "").localeCompare(String(a.submittedAt || "")),
      );
    } else if (sort === "likes") {
      list.sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));
    } else {
      list.sort((a, b) => heatScore(b) - heatScore(a));
    }
    return list.slice(0, 6);
  }, [hot, sceneFilter, sort]);

  function handlePillar(id) {
    if (id === "build") onOpenBuild?.();
    else if (id === "publish") onOpenPublish?.();
    else onOpenPromote?.();
  }

  const displayMetrics = [
    {
      label: "注册开发者",
      value: formatCount(stats?.userCount ?? stats?.totalFollowers ?? 0),
      icon: Users,
    },
    {
      label: "上架应用",
      value: formatCount(stats?.totalResources ?? 0),
      icon: Boxes,
    },
    {
      label: "累计浏览量",
      value: formatCount(stats?.totalViews ?? 0),
      icon: Eye,
    },
    {
      label: "已发放激励",
      value:
        stats?.incentivePaid != null
          ? `¥${formatCount(stats.incentivePaid)}`
          : "¥0",
      icon: Coins,
    },
  ];

  return (
    <>
      <section className="ph-page-header ph-portal-hero">
        <div className="ph-section-inner">
          <div className="ph-page-header-inner">
            <p className="ph-page-eyebrow">
              <span className="ph-page-eyebrow-dot" aria-hidden="true" />
              CSDN 出品 · 社区开发者应用共创平台
            </p>
            <h1 className="ph-page-title">
              用 AI 构建你的场景应用
              <br />
              <span className="ph-page-title-accent">发布 · 霸榜 · 赢激励</span>
            </h1>
            <p className="ph-page-desc">
              全国首个社区驱动、面向泛用户开发应用的作品平台。不用从零搭建，选好场景与工具，10
              分钟做出你的应用；一键发布应用广场，全网推广冲榜赢现金。
            </p>
            <div className="ph-page-header-actions">
              <div className="ph-page-header-cta">
                <button
                  type="button"
                  className="ph-btn-primary ph-btn-hero"
                  onClick={onOpenBuild}
                >
                  <Sparkles size={16} strokeWidth={2.2} aria-hidden="true" />
                  我要构建
                </button>
                <button
                  type="button"
                  className="ph-btn-secondary ph-btn-hero"
                  onClick={onOpenSquare}
                >
                  逛逛应用广场 →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="ph-section ph-portal-metrics-wrap">
        <div className="ph-section-inner">
          <div className="ph-portal-metrics ph-portal-metrics-4" aria-label="平台核心数据">
            {displayMetrics.map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="ph-portal-metric">
                  <span className="ph-portal-metric-icon" aria-hidden="true">
                    <Icon size={18} />
                  </span>
                  <div>
                    <strong>{loading ? "—" : m.value}</strong>
                    <span>{m.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="ph-portal-pillars">
            <div className="ph-portal-pillars-head">
              <h2>平台三大核心能力</h2>
              <p>构建 · 发布 · 霸榜，一站完成</p>
            </div>
            <div className="ph-portal-pillar-grid">
              {PILLARS.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className="ph-portal-pillar"
                    onClick={() => handlePillar(p.id)}
                  >
                    <span className="ph-portal-pillar-icon" aria-hidden="true">
                      <Icon size={20} />
                    </span>
                    <h3>{p.title}</h3>
                    <p>{p.desc}</p>
                    <div className="ph-portal-pillar-preview">{p.preview}</div>
                    <span className="ph-portal-pillar-cta">
                      了解并开始 <ArrowRight size={14} />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="ph-portal-hot">
            <div className="ph-portal-hot-head">
              <h2>热门应用速览</h2>
              <button type="button" className="ph-empty-link" onClick={onOpenSquare}>
                查看全部应用 →
              </button>
            </div>
            <div className="ph-portal-hot-filters">
              <div className="ph-filters" role="tablist" aria-label="场景筛选">
                <button
                  type="button"
                  className={"ph-filter" + (sceneFilter === "all" ? " active" : "")}
                  onClick={() => setSceneFilter("all")}
                >
                  全部
                </button>
                {BUILD_SCENES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={"ph-filter" + (sceneFilter === s.id ? " active" : "")}
                    onClick={() => setSceneFilter(s.id)}
                  >
                    {s.emoji} {s.name}
                  </button>
                ))}
              </div>
              <div className="ph-period-rank-tabs" role="tablist" aria-label="排序">
                {[
                  ["hot", "最热"],
                  ["new", "最新"],
                  ["likes", "点赞最多"],
                ].map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    className={"ph-period-rank-tab" + (sort === k ? " active" : "")}
                    onClick={() => setSort(k)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <div className="ph-product-grid ph-product-grid-compact">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductCardSkeleton key={i} size="sm" />
                ))}
              </div>
            ) : filteredHot.length === 0 ? (
              <p className="ph-build-empty">暂无上架应用，登录后去构建并发布第一个吧</p>
            ) : (
              <div className="ph-product-grid ph-product-grid-compact">
                {filteredHot.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onVote={onVote}
                    votingDisabled={votingId === product.id}
                    showCategory
                    showMeta
                    showStats
                    size="sm"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
