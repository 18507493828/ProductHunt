import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/EmptyState";
import {
  fetchAdminBuildConfig,
  updateAdminBuildConfig,
} from "../../api";
import { getSceneIcon } from "../../sceneIcons";

function emptyScene(sort = 1) {
  return {
    id: "",
    emoji: "📌",
    name: "",
    enabled: true,
    sort,
    topics: [],
  };
}

export default function Topics() {
  const [scenes, setScenes] = useState([]);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activeSceneId, setActiveSceneId] = useState("");

  const [sceneModalOpen, setSceneModalOpen] = useState(false);
  const [editingSceneIndex, setEditingSceneIndex] = useState(-1);
  const [sceneForm, setSceneForm] = useState(emptyScene());

  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [topicName, setTopicName] = useState("");

  const activeIndex = useMemo(
    () => scenes.findIndex((s) => (s.id || s.name) === activeSceneId),
    [scenes, activeSceneId],
  );
  const activeScene = activeIndex >= 0 ? scenes[activeIndex] : null;

  async function load() {
    try {
      setLoading(true);
      setError("");
      const data = await fetchAdminBuildConfig();
      const list = Array.isArray(data?.scenes) ? data.scenes : [];
      setScenes(list);
      setTools(Array.isArray(data?.tools) ? data.tools : []);
      setActiveSceneId((prev) => {
        if (prev && list.some((s) => (s.id || s.name) === prev)) return prev;
        return list[0] ? list[0].id || list[0].name : "";
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function persist(nextScenes, successMsg) {
    const result = await updateAdminBuildConfig({
      scenes: nextScenes,
      tools,
    });
    const next = result.config?.scenes || nextScenes;
    setScenes(next);
    setTools(result.config?.tools || tools);
    setMessage(successMsg || result.message || "已保存");
    return next;
  }

  function openCreateScene() {
    setEditingSceneIndex(-1);
    setSceneForm(emptyScene(scenes.length + 1));
    setError("");
    setMessage("");
    setSceneModalOpen(true);
  }

  function openEditScene() {
    if (!activeScene || activeIndex < 0) return;
    setEditingSceneIndex(activeIndex);
    setSceneForm({
      ...activeScene,
      topics: Array.isArray(activeScene.topics) ? activeScene.topics : [],
    });
    setError("");
    setMessage("");
    setSceneModalOpen(true);
  }

  function updateSceneForm(key, value) {
    setSceneForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSceneSubmit(e) {
    e.preventDefault();
    const name = sceneForm.name.trim();
    if (!name) {
      setError("请填写场景名称");
      return;
    }

    const nextScene = {
      ...sceneForm,
      id: sceneForm.id || undefined,
      name,
      emoji: sceneForm.emoji || "📌",
      enabled: sceneForm.enabled !== false,
      sort: Number(sceneForm.sort) || scenes.length + 1,
      topics: Array.isArray(sceneForm.topics) ? sceneForm.topics : [],
    };

    try {
      setSaving(true);
      setError("");
      const nextScenes = [...scenes];
      if (editingSceneIndex >= 0) {
        nextScenes[editingSceneIndex] = {
          ...nextScene,
          id: scenes[editingSceneIndex].id || nextScene.id,
          topics: scenes[editingSceneIndex].topics || [],
        };
      } else {
        nextScenes.push({ ...nextScene, topics: [] });
      }
      const saved = await persist(
        nextScenes,
        editingSceneIndex >= 0 ? "场景已更新" : "场景已新增",
      );
      const target =
        editingSceneIndex >= 0
          ? saved[editingSceneIndex]
          : saved[saved.length - 1];
      if (target) setActiveSceneId(target.id || target.name);
      setSceneModalOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleScene() {
    if (activeIndex < 0) return;
    try {
      setError("");
      const next = scenes.map((s, i) =>
        i === activeIndex ? { ...s, enabled: !(s.enabled !== false) } : s,
      );
      await persist(next, "显示状态已更新");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteScene() {
    if (!activeScene || activeIndex < 0) return;
    if (
      !window.confirm(
        `确定删除场景「${activeScene.name}」及其全部话题？`,
      )
    ) {
      return;
    }
    try {
      setError("");
      const next = scenes.filter((_, i) => i !== activeIndex);
      const saved = await persist(next, "场景已删除");
      setActiveSceneId(saved[0] ? saved[0].id || saved[0].name : "");
    } catch (err) {
      setError(err.message);
    }
  }

  function openAddTopic() {
    if (!activeScene) return;
    setTopicName("");
    setError("");
    setMessage("");
    setTopicModalOpen(true);
  }

  async function handleTopicSubmit(e) {
    e.preventDefault();
    if (activeIndex < 0 || !activeScene) return;
    const name = topicName.trim();
    if (!name) {
      setError("请填写话题名称");
      return;
    }
    const exists = (activeScene.topics || []).some(
      (t) => String(t.name || "").trim() === name,
    );
    if (exists) {
      setError("该场景下已有同名话题");
      return;
    }

    const nextTopic = {
      id: "",
      name,
      enabled: true,
      sort: (activeScene.topics || []).length + 1,
    };

    try {
      setSaving(true);
      setError("");
      const next = scenes.map((s, i) =>
        i === activeIndex
          ? { ...s, topics: [...(s.topics || []), nextTopic] }
          : s,
      );
      await persist(next, "话题已新增");
      setTopicModalOpen(false);
      setTopicName("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleTopic(topicIndex) {
    if (activeIndex < 0) return;
    try {
      setError("");
      const next = scenes.map((s, i) => {
        if (i !== activeIndex) return s;
        const topics = (s.topics || []).map((t, j) =>
          j === topicIndex ? { ...t, enabled: !(t.enabled !== false) } : t,
        );
        return { ...s, topics };
      });
      await persist(next, "话题显示状态已更新");
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteTopic(topicIndex, name) {
    if (activeIndex < 0) return;
    if (!window.confirm(`确定删除话题「${name}」？`)) return;
    try {
      setError("");
      const next = scenes.map((s, i) => {
        if (i !== activeIndex) return s;
        return {
          ...s,
          topics: (s.topics || []).filter((_, j) => j !== topicIndex),
        };
      });
      await persist(next, "话题已删除");
    } catch (err) {
      setError(err.message);
    }
  }

  const SceneIcon = activeScene
    ? getSceneIcon(activeScene.id || activeScene.name)
    : null;

  return (
    <>
      <div className="admin-toolbar">
        <button type="button" className="add-banner-btn" onClick={openCreateScene}>
          新增场景
        </button>
        {activeScene ? (
          <button type="button" className="admin-btn admin-btn-primary" onClick={openAddTopic}>
            新增话题
          </button>
        ) : null}
      </div>

      <p className="admin-tip" style={{ margin: "0 0 12px", color: "var(--ph-text-muted, #6b7280)", fontSize: 13 }}>
        此处为客户端广场 / 发布的唯一场景与话题来源。修改后前台筛选与发布选项会同步更新。
      </p>

      {error && <div className="error">{error}</div>}
      {message && <div className="admin-success">{message}</div>}

      {loading ? (
        <div className="dash-loading">加载中...</div>
      ) : scenes.length === 0 ? (
        <EmptyState title="还没有场景" />
      ) : (
        <div className="admin-scene-tabs-layout">
          <div
            className="admin-period-tabs admin-scene-tabs"
            role="tablist"
            aria-label="场景"
          >
            {scenes.map((scene) => {
              const key = scene.id || scene.name;
              const Icon = getSceneIcon(key);
              const active = key === activeSceneId;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={
                    "admin-period-tab admin-scene-tab" +
                    (active ? " is-active" : "") +
                    (scene.enabled === false ? " is-off" : "")
                  }
                  onClick={() => setActiveSceneId(key)}
                >
                  <span className="admin-scene-tab-icon" aria-hidden="true">
                    <Icon size={14} strokeWidth={2.2} />
                  </span>
                  {scene.name}
                </button>
              );
            })}
          </div>

          {activeScene ? (
            <section className="admin-scene-panel">
              <header className="admin-scene-panel-head">
                <div className="admin-scene-panel-title">
                  <span className="admin-scene-icon" aria-hidden="true">
                    {SceneIcon ? <SceneIcon size={18} strokeWidth={2.2} /> : null}
                  </span>
                  <div>
                    <h2>{activeScene.name}</h2>
                    <p>话题 {(activeScene.topics || []).length} 个</p>
                  </div>
                  <span
                    className={
                      "status-badge " +
                      (activeScene.enabled !== false
                        ? "status-approved"
                        : "status-rejected")
                    }
                  >
                    {activeScene.enabled !== false ? "展示中" : "已隐藏"}
                  </span>
                </div>
                <div className="admin-scene-panel-actions">
                  <button
                    type="button"
                    className="admin-btn admin-btn-ghost"
                    onClick={openEditScene}
                  >
                    编辑场景
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn-ghost"
                    onClick={toggleScene}
                  >
                    {activeScene.enabled !== false ? "隐藏场景" : "展示场景"}
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn-danger"
                    onClick={handleDeleteScene}
                  >
                    删除场景
                  </button>
                </div>
              </header>

              {(activeScene.topics || []).length === 0 ? (
                <EmptyState
                  title="该场景还没有话题"
                  description="点击上方「新增话题」，一次添加一条"
                />
              ) : (
                <div className="admin-data-table-wrap">
                  <table className="admin-data-table">
                    <thead>
                      <tr>
                        <th>话题名称</th>
                        <th className="admin-table-center">状态</th>
                        <th className="admin-table-center">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(activeScene.topics || []).map((topic, topicIndex) => (
                        <tr key={topic.id || `${topic.name}-${topicIndex}`}>
                          <td>
                            <strong>{topic.name}</strong>
                          </td>
                          <td className="admin-table-center">
                            <span
                              className={
                                "status-badge " +
                                (topic.enabled !== false
                                  ? "status-approved"
                                  : "status-rejected")
                              }
                            >
                              {topic.enabled !== false ? "展示中" : "已隐藏"}
                            </span>
                          </td>
                          <td className="admin-table-center">
                            <div className="admin-table-actions">
                              <button
                                type="button"
                                className="admin-btn admin-btn-ghost"
                                onClick={() => toggleTopic(topicIndex)}
                              >
                                {topic.enabled !== false ? "隐藏" : "显示"}
                              </button>
                              <button
                                type="button"
                                className="admin-btn admin-btn-danger"
                                onClick={() =>
                                  deleteTopic(topicIndex, topic.name)
                                }
                              >
                                删除
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : null}
        </div>
      )}

      {sceneModalOpen && (
        <div className="modal-overlay">
          <form className="modal-card" onSubmit={handleSceneSubmit}>
            <div className="modal-header">
              <div>
                <p className="modal-eyebrow">构建场景</p>
                <h2>{editingSceneIndex >= 0 ? "编辑场景" : "新增场景"}</h2>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => !saving && setSceneModalOpen(false)}
                aria-label="关闭"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="admin-topic-form-row">
                <label className="modal-field">
                  <span>场景图标</span>
                  <div className="admin-scene-icon-preview">
                    {(() => {
                      const Icon = getSceneIcon(sceneForm.id || sceneForm.name);
                      return <Icon size={18} strokeWidth={2.2} />;
                    })()}
                    <span>按场景名称自动匹配</span>
                  </div>
                </label>
                <label className="modal-field">
                  <span>场景名称 *</span>
                  <input
                    value={sceneForm.name}
                    onChange={(e) => updateSceneForm("name", e.target.value)}
                    placeholder="例如：校园"
                    maxLength={20}
                    disabled={saving}
                    required
                  />
                </label>
              </div>
              <label className="banner-toggle">
                <input
                  type="checkbox"
                  checked={sceneForm.enabled !== false}
                  onChange={(e) => updateSceneForm("enabled", e.target.checked)}
                  disabled={saving}
                />
                <span>启用展示</span>
              </label>
              <p className="modal-hint">
                场景保存后，请在对应 Tab 下逐条「新增话题」。
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="modal-btn secondary"
                onClick={() => !saving && setSceneModalOpen(false)}
                disabled={saving}
              >
                取消
              </button>
              <button type="submit" className="modal-btn primary" disabled={saving}>
                {saving ? "保存中..." : "保存场景"}
              </button>
            </div>
          </form>
        </div>
      )}

      {topicModalOpen && (
        <div className="modal-overlay">
          <form className="modal-card" onSubmit={handleTopicSubmit}>
            <div className="modal-header">
              <div>
                <p className="modal-eyebrow">{activeScene?.name || "场景"}</p>
                <h2>新增话题</h2>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => !saving && setTopicModalOpen(false)}
                aria-label="关闭"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <label className="modal-field">
                <span>话题名称 *</span>
                <input
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  placeholder="例如：校园二手书买卖"
                  maxLength={40}
                  disabled={saving}
                  required
                  autoFocus
                />
              </label>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="modal-btn secondary"
                onClick={() => !saving && setTopicModalOpen(false)}
                disabled={saving}
              >
                取消
              </button>
              <button type="submit" className="modal-btn primary" disabled={saving}>
                {saving ? "保存中..." : "新增话题"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
