import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, Sparkles, X } from "lucide-react";
import { useModalMotion } from "../useModalMotion";
import {
  BUILD_DEPLOYS,
  buildTaskBrief,
  getDeployById,
  getSceneById,
  getToolById,
  upsertBuildDraft,
} from "../buildConfig";
import useBuildCatalog from "../useBuildCatalog";
import { getSceneIcon } from "../sceneIcons";

export default function BuildWizardModal({
  open,
  onClose,
  username,
  onCompleted,
  initialDraft = null,
}) {
  const { mounted, overlayClassName, panelClassName } = useModalMotion(open);
  const { scenes: BUILD_SCENES, tools: BUILD_TOOLS } = useBuildCatalog();
  const [step, setStep] = useState(1);
  const [sceneId, setSceneId] = useState("");
  const [topic, setTopic] = useState("");
  const [toolId, setToolId] = useState("");
  const [deployId, setDeployId] = useState("");
  const [draftId, setDraftId] = useState("");
  const editingId = initialDraft?.id || draftId || "";

  useEffect(() => {
    if (!open) return;
    if (initialDraft?.id) {
      setDraftId(initialDraft.id);
      setSceneId(initialDraft.sceneId || "");
      setTopic(initialDraft.topic || "");
      setToolId(initialDraft.toolId || "");
      setDeployId(initialDraft.deployId || "");
      if (initialDraft.deployId) setStep(5);
      else if (initialDraft.toolId) setStep(4);
      else if (initialDraft.topic) setStep(3);
      else if (initialDraft.sceneId) setStep(2);
      else setStep(1);
      return;
    }
    setStep(1);
    setSceneId("");
    setTopic("");
    setToolId("");
    setDeployId("");
    setDraftId("");
  }, [open, initialDraft]);

  const scene = useMemo(() => getSceneById(sceneId), [sceneId, BUILD_SCENES]);
  const tool = useMemo(() => getToolById(toolId), [toolId, BUILD_TOOLS]);
  const deploy = useMemo(() => getDeployById(deployId), [deployId]);
  const topics = scene?.topics || [];
  const briefLocal =
    scene && topic && tool
      ? buildTaskBrief({ scene, topic, tool, deploy: null })
      : "";
  const briefFull =
    scene && topic && tool && deploy
      ? buildTaskBrief({ scene, topic, tool, deploy })
      : briefLocal;

  function goStep(n) {
    setStep(n);
  }

  function selectScene(id) {
    setSceneId(id);
    setTopic("");
    setToolId("");
    setDeployId("");
    setStep(2);
  }

  function selectTopic(name) {
    setTopic(name);
    setToolId("");
    setDeployId("");
    setStep(3);
  }

  function selectTool(id) {
    setToolId(id);
    setDeployId("");
    setStep(4);
  }

  function selectDeploy(id) {
    setDeployId(id);
  }

  function buildDraftPayload({ deployOverride } = {}) {
    if (!scene || !topic || !tool || !username) return null;
    const chosen = deployOverride === undefined ? deploy : deployOverride;
    const now = new Date().toISOString();
    return {
      id: editingId || `draft-${Date.now()}`,
      sceneId: scene.id,
      sceneName: scene.name,
      topic,
      toolId: tool.id,
      toolName: tool.name,
      inviteCode: tool.inviteCode,
      downloadUrl: tool.downloadUrl,
      deployId: chosen?.id || "",
      deployName: chosen?.name || "",
      deployUrl: chosen?.url || "",
      sponsored: !!tool.sponsored,
      incentive: tool.incentive || 0,
      taskBrief: buildTaskBrief({ scene, topic, tool, deploy: chosen }),
      status: "ready",
      createdAt: initialDraft?.createdAt || now,
      updatedAt: now,
    };
  }

  function persistDraft(options) {
    const draft = buildDraftPayload(options);
    if (!draft) return null;
    upsertBuildDraft(username, draft);
    setDraftId(draft.id);
    return draft;
  }

  /** 仅「保存并去发布」写入待发布任务书；编辑态「保存修改」也会写入 */
  function finish({ openPublish = false, skipLaunch = false } = {}) {
    if (!scene || !topic || !tool || !username) return;
    if (!deploy) return;
    const shouldPersist = openPublish || Boolean(initialDraft?.id);
    if (!shouldPersist) return;
    const draft = persistDraft();
    if (!draft) return;
    onCompleted?.(draft, {
      openPublish,
      isEdit: Boolean(initialDraft?.id),
      skipLaunch,
    });
    onClose?.();
  }

  function openDeploySite() {
    if (!deploy?.url) return;
    window.open(deploy.url, "_blank", "noopener,noreferrer");
    onCompleted?.(
      {
        toolName: tool?.name || "",
        deployName: deploy.name,
        topic: topic || "",
        sceneName: scene?.name || "",
      },
      { openDeploySite: true, skipPersist: true },
    );
  }

  function startLocalBuild() {
    if (!tool?.downloadUrl) return;
    window.open(tool.downloadUrl, "_blank", "noopener,noreferrer");
    onCompleted?.(
      {
        toolName: tool.name,
        topic: topic || "",
        sceneName: scene?.name || "",
      },
      { localBuildOnly: true, skipPersist: true },
    );
    setStep(5);
  }

  if (!mounted) return null;

  return createPortal(
    <div className={overlayClassName} onClick={onClose}>
      <div
        className={`${panelClassName} ph-build-wizard`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="build-wizard-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="ph-build-eyebrow">
              {initialDraft?.id ? "编辑任务书" : "我要构建"}
            </p>
            <h2 id="build-wizard-title">
              选场景 → 选话题 → 选工具 → 本地构建 → 官网部署
            </h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>

        <div className="ph-build-steps" aria-label="构建步骤">
          {[
            { n: 1, label: "选择场景" },
            { n: 2, label: "选择场景话题" },
            { n: 3, label: "选择构建工具" },
            { n: 4, label: "本地构建" },
            { n: 5, label: "官网部署" },
          ].map((s) => (
            <button
              key={s.n}
              type="button"
              className={
                "ph-build-step" +
                (step === s.n ? " active" : "") +
                (step > s.n ? " done" : "")
              }
              onClick={() => {
                if (s.n === 1) goStep(1);
                else if (s.n === 2 && sceneId) goStep(2);
                else if (s.n === 3 && topic) goStep(3);
                else if (s.n === 4 && toolId) goStep(4);
                else if (s.n === 5 && toolId) goStep(5);
              }}
            >
              <span>{s.n}</span>
              {s.label}
            </button>
          ))}
        </div>

        <div className="modal-body ph-build-body">
          {step === 1 && (
            <div className="ph-build-grid">
              {BUILD_SCENES.map((s) => {
                const Icon = getSceneIcon(s.id || s.name);
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={
                      "ph-build-card" + (sceneId === s.id ? " selected" : "")
                    }
                    onClick={() => selectScene(s.id)}
                  >
                    <span className="ph-build-card-icon" aria-hidden="true">
                      <Icon size={22} strokeWidth={2.2} />
                    </span>
                    <strong>{s.name}</strong>
                    <span>{s.topics.length} 个预置话题</span>
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="ph-build-hint">
                场景：{scene?.name} · 每个场景预置 3~5 个实用话题
              </p>
              <div className="ph-build-topics">
                {topics.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={"ph-build-topic" + (topic === t ? " selected" : "")}
                    data-topic={t}
                    onClick={() => selectTopic(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {topics.length === 0 && (
                <p className="ph-build-empty">请先选择场景</p>
              )}
              <div className="ph-build-nav-row">
                <button type="button" className="ph-btn-secondary" onClick={() => goStep(1)}>
                  上一步
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="ph-build-hint">
                话题：{topic}
                {BUILD_TOOLS.some((t) => t.sponsored && t.incentive > 0)
                  ? ` · 选择赞助工具完成构建并成功发布，可获现金激励`
                  : ""}
              </p>
              <div className="ph-build-tools">
                {BUILD_TOOLS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={
                      "ph-build-tool" + (toolId === t.id ? " selected" : "")
                    }
                    onClick={() => selectTool(t.id)}
                  >
                    <div className="ph-build-tool-top">
                      <strong>
                        {t.emoji ? `${t.emoji} ` : ""}
                        {t.name}
                        {t.recommended ? " · 推荐" : ""}
                      </strong>
                      {t.sponsored && (
                        <span className="ph-build-badge">
                          活动赞助 · ¥{t.incentive} 激励
                        </span>
                      )}
                    </div>
                    <p>{t.desc}</p>
                    <div className="ph-build-tool-meta">
                      <a
                        href={t.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={14} />
                        下载链接
                      </a>
                    </div>
                  </button>
                ))}
              </div>
              <div className="ph-build-nav-row">
                <button type="button" className="ph-btn-secondary" onClick={() => goStep(2)}>
                  上一步
                </button>
              </div>
            </div>
          )}

          {step === 4 && scene && tool && (
            <div className="ph-build-brief">
              <p className="ph-build-hint">
                先在本地用 {tool.name} 完成构建 · 构建完成后再去云厂商官网部署
              </p>
              <div className="ph-build-brief-card">
                <div className="ph-build-brief-row">
                  <span>场景</span>
                  <strong>{scene.name}</strong>
                </div>
                <div className="ph-build-brief-row">
                  <span>场景话题</span>
                  <strong>{topic}</strong>
                </div>
                <div className="ph-build-brief-row">
                  <span>构建工具</span>
                  <strong>{tool.name}</strong>
                </div>
                {tool.sponsored && (
                  <div className="ph-build-incentive">
                    华为码道赞助活动：完成构建并成功发布通过审核后，系统将自动发放 ¥
                    {tool.incentive} 现金激励（每个账号限 1 次）
                  </div>
                )}
                <pre className="ph-build-brief-text">{briefLocal}</pre>
                <a
                  className="ph-build-download"
                  href={tool.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink size={16} />
                  打开 {tool.name} 开始本地构建
                </a>
              </div>
              <div className="ph-build-nav-row">
                <button type="button" className="ph-btn-secondary" onClick={() => goStep(3)}>
                  上一步
                </button>
                {initialDraft?.id ? (
                  <button
                    type="button"
                    className="ph-btn-secondary"
                    onClick={() => finish({ openPublish: false, skipLaunch: true })}
                  >
                    保存修改
                  </button>
                ) : null}
                <button
                  type="button"
                  className="ph-btn-primary"
                  onClick={startLocalBuild}
                >
                  <Sparkles size={16} />
                  🚀 开始本地构建
                </button>
                <button
                  type="button"
                  className="ph-btn-secondary"
                  onClick={() => goStep(5)}
                >
                  下一步：官网部署
                </button>
              </div>
            </div>
          )}

          {step === 5 && scene && tool && (
            <div>
              <p className="ph-build-hint">
                本地构建完成后，选择云厂商并前往官网完成部署
              </p>
              <div className="ph-build-grid">
                {BUILD_DEPLOYS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className={
                      "ph-build-card" + (deployId === d.id ? " selected" : "")
                    }
                    onClick={() => selectDeploy(d.id)}
                  >
                    <span className="ph-build-card-emoji" aria-hidden="true">
                      {d.emoji}
                    </span>
                    <strong>{d.name}</strong>
                    <span>{d.desc}</span>
                  </button>
                ))}
              </div>

              {deploy ? (
                <div className="ph-build-brief" style={{ marginTop: 14 }}>
                  <div className="ph-build-brief-card">
                    <div className="ph-build-brief-row">
                      <span>本地工具</span>
                      <strong>{tool.name}</strong>
                    </div>
                    <div className="ph-build-brief-row">
                      <span>部署官网</span>
                      <strong>{deploy.name}</strong>
                    </div>
                    <pre className="ph-build-brief-text">{briefFull}</pre>
                    <a
                      className="ph-build-download"
                      href={deploy.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink size={16} />
                      打开 {deploy.name} 官网部署
                    </a>
                  </div>
                </div>
              ) : (
                <p className="ph-build-empty" style={{ marginTop: 12 }}>
                  请选择一个云厂商
                </p>
              )}

              <div className="ph-build-nav-row">
                <button type="button" className="ph-btn-secondary" onClick={() => goStep(4)}>
                  上一步
                </button>
                {initialDraft?.id ? (
                  <button
                    type="button"
                    className="ph-btn-secondary"
                    disabled={!deploy}
                    onClick={() => finish({ openPublish: false, skipLaunch: true })}
                  >
                    保存修改
                  </button>
                ) : null}
                <button
                  type="button"
                  className="ph-btn-primary"
                  disabled={!deploy}
                  onClick={openDeploySite}
                >
                  <ExternalLink size={16} />
                  去官网部署
                </button>
                <button
                  type="button"
                  className="ph-btn-secondary"
                  disabled={!deploy}
                  onClick={() => finish({ openPublish: true })}
                >
                  保存并去发布
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
