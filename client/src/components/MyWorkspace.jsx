import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Rocket,
  Sparkles,
  Trophy,
} from "lucide-react";
import { loadBuildDrafts, removeBuildDraft } from "../buildConfig";
import MyProductsList from "./MyProductsList";

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

  const approved = useMemo(
    () => (products || []).filter((p) => (p.status || "approved") === "approved"),
    [products],
  );

  const kpi = useMemo(() => {
    const list = products || [];
    const views = list.reduce((s, p) => s + (p.viewCount || 0), 0);
    const votes = list.reduce((s, p) => s + (p.voteCount || 0), 0);
    const trials = Math.round(views * 0.2);
    const incentive = drafts.reduce((s, d) => s + (d.sponsored ? d.incentive || 0 : 0), 0);
    return {
      views,
      trials,
      votes,
      weekRank: approved.length ? Math.min(approved.length, 12) : "—",
      incentive,
      pending: list.filter((p) => p.status === "pending").length,
      approved: approved.length,
      drafts: drafts.length,
    };
  }, [products, approved, drafts]);

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
            我的工作台 · 构建应用、发布上架、全网霸榜，一站式管理
          </p>
        </div>
      </div>

      <div className="ph-my-pillars">
        <button type="button" className="ph-my-pillar" onClick={onBuild}>
          <span className="ph-my-pillar-icon">
            <Sparkles size={20} />
          </span>
          <strong>我要构建</strong>
          <span>选场景 → 选话题 → 选工具，3 步生成任务书，10 分钟构建应用。</span>
        </button>
        <button type="button" className="ph-my-pillar" onClick={() => onPublish?.()}>
          <span className="ph-my-pillar-icon">
            <Rocket size={20} />
          </span>
          <strong>我要发布</strong>
          <span>按表单提交 · 审核通过后上架应用广场</span>
        </button>
        <button type="button" className="ph-my-pillar" onClick={() => onPromote?.()}>
          <span className="ph-my-pillar-icon">
            <Trophy size={20} />
          </span>
          <strong>我要霸榜</strong>
          <span>推广已发布的应用，分享到多渠道，冲榜赢现金激励。</span>
        </button>
      </div>

      <div className="ph-my-kpi" aria-label="我的数据看板">
        <div className="ph-my-kpi-head">
          <BarChart3 size={16} />
          <h3>应用看板</h3>
        </div>
        <div className="ph-my-kpi-grid ph-my-kpi-grid-5">
          <div>
            <strong>{kpi.views}</strong>
            <span>总浏览量</span>
          </div>
          <div>
            <strong>{kpi.trials}</strong>
            <span>总体验数</span>
          </div>
          <div>
            <strong>{kpi.votes}</strong>
            <span>获赞总数</span>
          </div>
          <div>
            <strong>{kpi.weekRank}</strong>
            <span>周榜最高排名</span>
          </div>
          <div>
            <strong>¥{Number(kpi.incentive || 0).toFixed(2)}</strong>
            <span>累计激励</span>
          </div>
        </div>
      </div>

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
              全网推广你已发布的应用 · 提升榜单排位 · 赢取激励
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
