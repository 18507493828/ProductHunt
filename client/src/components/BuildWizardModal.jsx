import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, Sparkles, X } from "lucide-react";
import { useModalMotion } from "../useModalMotion";
import {
  BUILD_SCENES,
  BUILD_TOOLS,
  buildTaskBrief,
  getSceneById,
  getToolById,
  upsertBuildDraft,
} from "../buildConfig";

export default function BuildWizardModal({
  open,
  onClose,
  username,
  onCompleted,
}) {
  const { mounted, overlayClassName, panelClassName } = useModalMotion(open);
  const [step, setStep] = useState(1);
  const [sceneId, setSceneId] = useState("");
  const [topic, setTopic] = useState("");
  const [toolId, setToolId] = useState("");

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setSceneId("");
    setTopic("");
    setToolId("");
  }, [open]);

  const scene = useMemo(() => getSceneById(sceneId), [sceneId]);
  const tool = useMemo(() => getToolById(toolId), [toolId]);
  const topics = scene?.topics || [];

  function goStep(n) {
    setStep(n);
  }

  function selectScene(id) {
    setSceneId(id);
    setTopic("");
    setToolId("");
    setStep(2);
  }

  function selectTopic(name) {
    setTopic(name);
    setToolId("");
    setStep(3);
  }

  function selectTool(id) {
    setToolId(id);
    setStep(4);
  }

  function finish({ openPublish = false } = {}) {
    if (!scene || !topic || !tool || !username) return;
    const draft = {
      id: `draft-${Date.now()}`,
      sceneId: scene.id,
      sceneName: scene.name,
      topic,
      toolId: tool.id,
      toolName: tool.name,
      inviteCode: tool.inviteCode,
      downloadUrl: tool.downloadUrl,
      sponsored: !!tool.sponsored,
      incentive: tool.incentive || 0,
      taskBrief: buildTaskBrief({ scene, topic, tool }),
      status: "ready",
      createdAt: new Date().toISOString(),
    };
    upsertBuildDraft(username, draft);
    onCompleted?.(draft, { openPublish });
    onClose?.();
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
            <p className="ph-build-eyebrow">我要构建</p>
            <h2 id="build-wizard-title">选择场景 → 选择场景话题 → 选择构建工具</h2>
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
            { n: 4, label: "生成任务书并构建" },
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
              {BUILD_SCENES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={
                    "ph-build-card" + (sceneId === s.id ? " selected" : "")
                  }
                  onClick={() => selectScene(s.id)}
                >
                  <span className="ph-build-card-emoji" aria-hidden="true">
                    {s.emoji}
                  </span>
                  <strong>{s.name}</strong>
                  <span>{s.topics.length} 个预置话题</span>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="ph-build-hint">
                场景：{scene?.emoji} {scene?.name} · 每个场景预置 3~5 个实用话题
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
                话题：{topic} · 选择「华为码道」完成构建并成功发布，可获 9.9
                元现金激励（官方赞助活动）
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
                          官方赞助 · ¥{t.incentive} 激励
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
                      <span>推广码 {t.inviteCode}</span>
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
              <p className="ph-build-hint">应用任务书已生成 · 点击开始构建将携带任务书跳转至所选工具</p>
              <div className="ph-build-brief-card">
                <div className="ph-build-brief-row">
                  <span>场景</span>
                  <strong>
                    {scene.emoji} {scene.name}
                  </strong>
                </div>
                <div className="ph-build-brief-row">
                  <span>场景话题</span>
                  <strong>{topic}</strong>
                </div>
                <div className="ph-build-brief-row">
                  <span>构建工具</span>
                  <strong>
                    {tool.name}
                    <em className="ph-build-code">{tool.inviteCode}</em>
                  </strong>
                </div>
                {tool.sponsored && (
                  <div className="ph-build-incentive">
                    华为码道赞助活动：完成构建并成功发布通过审核后，系统将自动发放 ¥
                    {tool.incentive} 现金激励（每个账号限 1 次）
                  </div>
                )}
                <pre className="ph-build-brief-text">
                  {buildTaskBrief({ scene, topic, tool })}
                </pre>
                <a
                  className="ph-build-download"
                  href={tool.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink size={16} />
                  点击下载 {tool.name}（任务书将自动携带推广码）
                </a>
              </div>
              <div className="ph-build-nav-row">
                <button type="button" className="ph-btn-secondary" onClick={() => goStep(3)}>
                  上一步
                </button>
                <a
                  className="ph-btn-primary"
                  href={tool.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => finish({ openPublish: false })}
                >
                  <Sparkles size={16} />
                  🚀 开始构建
                </a>
                <button
                  type="button"
                  className="ph-btn-secondary"
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
