import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Flame,
  Rocket,
  Share2,
  Sparkles,
  ThumbsUp,
  Trophy,
} from "lucide-react";
import {
  heatScore,
  loadBuildDrafts,
  removeBuildDraft,
} from "../buildConfig";
import { getAppPlatformLabel } from "../appPlatforms";
import MyProductsList from "./MyProductsList";
import MyTrendChart from "./MyTrendChart";

function fmt(n) {
  return Number(n || 0).toLocaleString("zh-CN");
}

function platformOf(product) {
  return (
    product?.appPlatformLabel ||
    getAppPlatformLabel(product?.appPlatform) ||
    product?.appPlatform ||
    "—"
  );
}

export default function MyWorkspace({
  user,
  products,
  loading,
  onBuild,
  onPromote,
  onPublish,
  onEdit,
  onUnpublish,
  unpublishingId = "",
  onOpenSquare,
  draftRefreshKey = 0,
}) {
  const [drafts, setDrafts] = useState([]);

  useEffect(() => {
    setDrafts(loadBuildDrafts(user?.username));
  }, [user?.username, draftRefreshKey]);

  const board = useMemo(() => {
    const list = products || [];
    const approved = list.filter((p) => (p.status || "approved") === "approved");
    const pending = list.filter((p) => p.status === "pending");
    const rejected = list.filter((p) => p.status === "rejected");
    const offline = list.filter((p) => p.status === "offline");

    const views = list.reduce((s, p) => s + (Number(p.viewCount) || 0), 0);
    const votes = list.reduce((s, p) => s + (Number(p.voteCount) || 0), 0);
    const shares = list.reduce((s, p) => s + (Number(p.shareCount) || 0), 0);
    const heat = list.reduce((s, p) => s + heatScore(p), 0);
    const incentive = drafts.reduce(
      (s, d) => s + (d.sponsored ? Number(d.incentive) || 0 : 0),
      0,
    );

    const ranked = [...list]
      .map((p) => ({
        product: p,
        heat: heatScore(p),
        views: Number(p.viewCount) || 0,
        votes: Number(p.voteCount) || 0,
        shares: Number(p.shareCount) || 0,
        platform: platformOf(p),
        tool: p.buildTool || p.toolName || "",
        scene: p.scene || p.sceneName || "",
        status: p.status || "approved",
      }))
      .sort((a, b) => b.heat - a.heat);

    const maxHeat = Math.max(...ranked.map((r) => r.heat), 1);

    const platforms = ranked.reduce((acc, row) => {
      const key = row.platform || "其他";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return {
      approved: approved.length,
      pending: pending.length,
      rejected: rejected.length,
      offline: offline.length,
      drafts: drafts.length,
      views,
      votes,
      shares,
      heat,
      incentive,
      ranked,
      maxHeat,
      platforms,
      top: ranked[0] || null,
    };
  }, [products, drafts]);

  function publishFromDraft(draft) {
    onPublish?.({
      name: `${draft.topic}`,
      tagline: `基于${draft.toolName}构建的${draft.sceneName}应用`,
      description: draft.taskBrief,
      topicName: draft.topic,
      buildTool: draft.toolName,
      buildToolId: draft.toolId,
      inviteCode: draft.inviteCode,
      scene: draft.sceneName,
      sceneId: draft.sceneId,
      sceneTopic: draft.topic,
      url: draft.downloadUrl || "https://",
    });
  }

  function deleteDraft(draft) {
    if (!draft?.id || !user?.username) return;
    if (
      !window.confirm(
        `确定删除任务书「${draft.sceneName} · ${draft.topic}」吗？删除后不可恢复。`,
      )
    ) {
      return;
    }
    setDrafts(removeBuildDraft(user.username, draft.id));
  }

  return (
    <div className="ph-my-workspace">
      <div className="ph-my-toolbar">
        <div>
          <h2 className="ph-section-title">
            你好，@{user?.nickname || user?.username}
          </h2>
          <p className="ph-my-sub">
            构建 · 发布 · 霸榜 —— 查看你的应用在广场与渠道上的真实表现
          </p>
        </div>
      </div>

      <div className="ph-my-pillars">
        <button type="button" className="ph-my-pillar" onClick={onBuild}>
          <span className="ph-my-pillar-icon">
            <Sparkles size={20} />
          </span>
          <strong>我要构建</strong>
          <span>选场景 → 选话题 → 选工具 → 生成任务书</span>
        </button>
        <button type="button" className="ph-my-pillar" onClick={() => onPublish?.()}>
          <span className="ph-my-pillar-icon">
            <Rocket size={20} />
          </span>
          <strong>我要发布</strong>
          <span>提交审核，通过后进入应用广场</span>
        </button>
        <button type="button" className="ph-my-pillar" onClick={() => onPromote?.()}>
          <span className="ph-my-pillar-icon">
            <Trophy size={20} />
          </span>
          <strong>我要霸榜</strong>
          <span>多渠道推广，提升热度与排位</span>
        </button>
      </div>

      {/* 发布漏斗：对齐产品实际状态，而不是 Demo 那套 KPI */}
      <section className="ph-my-pipeline" aria-label="发布进度">
        <button type="button" className="ph-my-pipe" onClick={onBuild}>
          <b>{board.drafts}</b>
          <span>构建草稿</span>
        </button>
        <span className="ph-my-pipe-arrow" aria-hidden>
          →
        </span>
        <div className="ph-my-pipe">
          <b>{board.pending}</b>
          <span>审核中</span>
        </div>
        <span className="ph-my-pipe-arrow" aria-hidden>
          →
        </span>
        <div className="ph-my-pipe is-live">
          <b>{board.approved}</b>
          <span>已上架</span>
        </div>
        <span className="ph-my-pipe-arrow" aria-hidden>
          →
        </span>
        <button type="button" className="ph-my-pipe" onClick={() => onPromote?.()}>
          <b>{fmt(board.shares)}</b>
          <span>分享回流</span>
        </button>
      </section>

      <section className="ph-my-insight" aria-label="应用表现">
        <div className="ph-my-insight-metrics">
          <article>
            <Eye size={16} />
            <div>
              <strong>{fmt(board.views)}</strong>
              <span>详情页浏览</span>
            </div>
          </article>
          <article>
            <ThumbsUp size={16} />
            <div>
              <strong>{fmt(board.votes)}</strong>
              <span>获得点赞</span>
            </div>
          </article>
          <article>
            <Share2 size={16} />
            <div>
              <strong>{fmt(board.shares)}</strong>
              <span>霸榜分享次数</span>
            </div>
          </article>
          <article>
            <Flame size={16} />
            <div>
              <strong>{fmt(board.heat)}</strong>
              <span>综合热度分</span>
            </div>
          </article>
        </div>

        <section className="ph-my-duo" aria-label="走势与热度">
          <header className="ph-my-duo-head">
            <div>
              <h3>表现概览</h3>
              <p>近 30 日累计走势与各应用热度贡献</p>
            </div>
          </header>
          <div className="ph-my-duo-body">
            <MyTrendChart
              views={board.views}
              votes={board.votes}
              shares={board.shares}
            />

            <aside className="ph-my-duo-heat">
              <div className="ph-my-duo-heat-title">
                <h4>热度贡献 TOP</h4>
                <span>浏览 + 点赞 + 分享加权</span>
              </div>
              {board.ranked.length === 0 ? (
                <div className="ph-my-heat-empty">发布应用后显示各应用热度占比</div>
              ) : (
                <ul className="ph-my-duo-heat-list">
                  {board.ranked.slice(0, 4).map((row, idx) => (
                    <li key={row.product.id}>
                      <div className="ph-my-duo-heat-top">
                        <span className="ph-my-heat-rank">#{idx + 1}</span>
                        <div className="ph-my-heat-main">
                          <strong>{row.product.name}</strong>
                          <span>
                            {row.platform}
                            {row.status !== "approved"
                              ? ` · ${
                                  row.status === "pending"
                                    ? "审核中"
                                    : row.status === "rejected"
                                      ? "未通过"
                                      : "已下架"
                                }`
                              : ""}
                          </span>
                        </div>
                        <b className="ph-my-heat-score">{fmt(row.heat)}</b>
                      </div>
                      <div className="ph-my-heat-bar" aria-hidden>
                        <i
                          style={{
                            width: `${Math.max(8, (row.heat / board.maxHeat) * 100)}%`,
                          }}
                        />
                      </div>
                      <div className="ph-my-duo-heat-foot">
                        <span>
                          览 {fmt(row.views)} · 赞 {fmt(row.votes)} · 享{" "}
                          {fmt(row.shares)}
                        </span>
                        {(row.status || "approved") === "approved" && (
                          <button
                            type="button"
                            onClick={() => onPromote?.(row.product)}
                          >
                            推广
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {Object.keys(board.platforms).length > 0 && (
                <p className="ph-my-duo-platform">
                  形态分布：
                  {Object.entries(board.platforms)
                    .map(([k, v]) => `${k} ${v}`)
                    .join(" · ")}
                </p>
              )}
            </aside>
          </div>
        </section>
      </section>

      {drafts.length > 0 && (
        <section className="ph-my-drafts">
          <h3>待发布的构建任务书</h3>
          <div className="ph-my-draft-list">
            {drafts.map((d) => (
              <article key={d.id} className="ph-my-draft">
                <div>
                  <strong>
                    {d.sceneName} · {d.topic}
                  </strong>
                  <p>
                    {d.toolName} · 推广码 {d.inviteCode}
                    {d.sponsored ? " · 赞助激励" : ""}
                  </p>
                </div>
                <div className="ph-my-draft-actions">
                  <button
                    type="button"
                    className="ph-btn-primary"
                    onClick={() => publishFromDraft(d)}
                  >
                    去发布
                  </button>
                  <button
                    type="button"
                    className="ph-btn-secondary ph-my-draft-delete"
                    onClick={() => deleteDraft(d)}
                  >
                    删除
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="ph-my-promote" id="ph-my-promote">
        <header className="ph-my-promote-head">
          <div>
            <h3>
              <Trophy size={16} /> 我要霸榜
            </h3>
            <p className="ph-my-sub">
              把已上架应用推到小红书 / 抖音 / 朋友圈 / CSDN，分享会计入回流热度
            </p>
          </div>
          <button
            type="button"
            className="ph-btn-primary"
            onClick={() => onPromote?.()}
          >
            📢 立即推广
          </button>
        </header>
        <p className="ph-my-promote-link-row">
          <button type="button" className="ph-text-link" onClick={onOpenSquare}>
            查看完整榜单 →
          </button>
        </p>
      </section>

      <section className="ph-my-apps">
        <h3>我的应用</h3>
        <MyProductsList
          products={products}
          loading={loading}
          onSubmit={() => onPublish?.()}
          onEdit={onEdit}
          onUnpublish={onUnpublish}
          unpublishingId={unpublishingId}
        />
      </section>
    </div>
  );
}
