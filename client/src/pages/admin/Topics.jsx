import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/EmptyState";
import {
  fetchAdminBuildConfig,
  updateAdminBuildConfig,
} from "../../api";

function emptyTopic(sort = 1) {
  return { id: "", name: "", enabled: true, sort };
}

function emptyScene(sort = 1) {
  return {
    id: "",
    emoji: "📌",
    name: "",
    enabled: true,
    sort,
    topics: [emptyTopic(1)],
  };
}

export default function Topics() {
  const [scenes, setScenes] = useState([]);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [form, setForm] = useState(emptyScene());

  const flatTopics = useMemo(
    () =>
      scenes.flatMap((scene) =>
        (scene.topics || []).map((topic) => ({
          sceneId: scene.id,
          sceneName: scene.name,
          sceneEnabled: scene.enabled !== false,
          ...topic,
        })),
      ),
    [scenes],
  );

  async function load() {
    try {
      setLoading(true);
      setError("");
      const data = await fetchAdminBuildConfig();
      setScenes(Array.isArray(data?.scenes) ? data.scenes : []);
      setTools(Array.isArray(data?.tools) ? data.tools : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openModal(scene = null, index = -1) {
    setEditingIndex(index);
    setForm(
      scene
        ? {
            ...scene,
            topics:
              Array.isArray(scene.topics) && scene.topics.length
                ? scene.topics.map((t, i) => ({
                    id: t.id || "",
                    name: t.name || "",
                    enabled: t.enabled !== false,
                    sort: t.sort ?? i + 1,
                  }))
                : [emptyTopic(1)],
          }
        : emptyScene(scenes.length + 1),
    );
    setMessage("");
    setError("");
    setModalOpen(true);
  }

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateTopic(index, key, value) {
    setForm((prev) => {
      const topics = [...(prev.topics || [])];
      topics[index] = { ...topics[index], [key]: value };
      return { ...prev, topics };
    });
  }

  function addTopicRow() {
    setForm((prev) => ({
      ...prev,
      topics: [...(prev.topics || []), emptyTopic((prev.topics || []).length + 1)],
    }));
  }

  function removeTopicRow(index) {
    setForm((prev) => ({
      ...prev,
      topics: (prev.topics || []).filter((_, i) => i !== index),
    }));
  }

  async function persist(nextScenes, successMsg) {
    const result = await updateAdminBuildConfig({
      scenes: nextScenes,
      tools,
    });
    setScenes(result.config?.scenes || nextScenes);
    setTools(result.config?.tools || tools);
    setMessage(successMsg || result.message || "已保存");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setError("请填写场景名称");
      return;
    }
    const topics = (form.topics || [])
      .map((t, i) => ({
        ...t,
        name: String(t.name || "").trim(),
        sort: Number(t.sort) || i + 1,
      }))
      .filter((t) => t.name);
    if (!topics.length) {
      setError("至少保留一个话题");
      return;
    }

    const nextScene = {
      ...form,
      id: form.id || undefined,
      name,
      emoji: form.emoji || "📌",
      enabled: form.enabled !== false,
      sort: Number(form.sort) || scenes.length + 1,
      topics,
    };

    try {
      setSaving(true);
      setError("");
      const nextScenes = [...scenes];
      if (editingIndex >= 0) nextScenes[editingIndex] = nextScene;
      else nextScenes.push(nextScene);
      await persist(nextScenes, editingIndex >= 0 ? "场景已更新" : "场景已新增");
      setModalOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleScene(index) {
    try {
      setError("");
      const next = scenes.map((s, i) =>
        i === index ? { ...s, enabled: !(s.enabled !== false) } : s,
      );
      await persist(next, "显示状态已更新");
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleTopic(sceneIndex, topicIndex) {
    try {
      setError("");
      const next = scenes.map((s, i) => {
        if (i !== sceneIndex) return s;
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

  async function handleDeleteScene(index, name) {
    if (!window.confirm(`确定删除场景「${name}」及其全部话题？`)) return;
    try {
      setError("");
      const next = scenes.filter((_, i) => i !== index);
      await persist(next, "场景已删除");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="admin-toolbar">
        <button type="button" className="add-banner-btn" onClick={() => openModal()}>
          新增场景
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {message && <div className="admin-success">{message}</div>}

      {loading ? (
        <div className="dash-loading">加载中...</div>
      ) : scenes.length === 0 ? (
        <EmptyState title="还没有构建场景" />
      ) : (
        <div className="admin-topic-grid">
          {scenes.map((scene, sceneIndex) => (
            <article
              key={scene.id || scene.name}
              className={
                "admin-masonry-card" +
                (scene.enabled !== false ? "" : " is-off")
              }
            >
              <div className="admin-masonry-card-top">
                <span
                  className={
                    "status-badge " +
                    (scene.enabled !== false
                      ? "status-approved"
                      : "status-rejected")
                  }
                >
                  {scene.enabled !== false ? "展示中" : "已隐藏"}
                </span>
                <span className="admin-masonry-sort">#{scene.sort ?? 0}</span>
              </div>
              <h2 className="admin-masonry-title">
                <span aria-hidden>{scene.emoji || "📌"}</span> {scene.name}
              </h2>
              <p className="admin-masonry-id">{scene.id}</p>

              <ul className="admin-topic-list">
                {(scene.topics || []).map((topic, topicIndex) => (
                  <li key={topic.id || `${topic.name}-${topicIndex}`}>
                    <span
                      className={
                        topic.enabled !== false ? "" : "admin-topic-muted"
                      }
                    >
                      {topic.name}
                    </span>
                    <button
                      type="button"
                      className="admin-btn admin-btn-ghost"
                      onClick={() => toggleTopic(sceneIndex, topicIndex)}
                    >
                      {topic.enabled !== false ? "隐藏" : "显示"}
                    </button>
                  </li>
                ))}
              </ul>

              <div className="admin-masonry-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  onClick={() => openModal(scene, sceneIndex)}
                >
                  编辑
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-ghost"
                  onClick={() => toggleScene(sceneIndex)}
                >
                  {scene.enabled !== false ? "隐藏场景" : "展示场景"}
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-danger"
                  onClick={() => handleDeleteScene(sceneIndex, scene.name)}
                >
                  删除
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && flatTopics.length > 0 && (
        <p className="admin-hint" style={{ marginTop: 16 }}>
          当前话题共 {flatTopics.length} 个，其中展示中{" "}
          {flatTopics.filter((t) => t.enabled !== false && t.sceneEnabled).length}{" "}
          个
        </p>
      )}

      {modalOpen && (
        <div className="modal-overlay">
          <form className="modal-card admin-topic-modal" onSubmit={handleSubmit}>
            <div className="modal-header">
              <div>
                <p className="modal-eyebrow">构建话题</p>
                <h2>{editingIndex >= 0 ? "编辑场景" : "新增场景"}</h2>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => !saving && setModalOpen(false)}
                aria-label="关闭"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="admin-topic-form-row">
                <label className="modal-field">
                  <span>Emoji</span>
                  <input
                    value={form.emoji}
                    onChange={(e) => updateForm("emoji", e.target.value)}
                    maxLength={4}
                    disabled={saving}
                  />
                </label>
                <label className="modal-field">
                  <span>场景名称 *</span>
                  <input
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    placeholder="例如：校园"
                    maxLength={20}
                    disabled={saving}
                    required
                  />
                </label>
                <label className="modal-field">
                  <span>排序</span>
                  <input
                    type="number"
                    value={form.sort}
                    onChange={(e) => updateForm("sort", e.target.value)}
                    disabled={saving}
                  />
                </label>
              </div>

              <label className="banner-toggle">
                <input
                  type="checkbox"
                  checked={form.enabled !== false}
                  onChange={(e) => updateForm("enabled", e.target.checked)}
                  disabled={saving}
                />
                <span>启用展示</span>
              </label>

              <div className="admin-topic-editor">
                <div className="admin-topic-editor-head">
                  <strong>话题列表</strong>
                  <button
                    type="button"
                    className="admin-btn admin-btn-ghost"
                    onClick={addTopicRow}
                    disabled={saving}
                  >
                    添加话题
                  </button>
                </div>
                {(form.topics || []).map((topic, index) => (
                  <div className="admin-topic-editor-row" key={index}>
                    <input
                      value={topic.name}
                      onChange={(e) =>
                        updateTopic(index, "name", e.target.value)
                      }
                      placeholder="话题名称"
                      disabled={saving}
                    />
                    <label className="banner-toggle">
                      <input
                        type="checkbox"
                        checked={topic.enabled !== false}
                        onChange={(e) =>
                          updateTopic(index, "enabled", e.target.checked)
                        }
                        disabled={saving}
                      />
                      <span>显示</span>
                    </label>
                    <button
                      type="button"
                      className="admin-btn admin-btn-danger"
                      onClick={() => removeTopicRow(index)}
                      disabled={saving || (form.topics || []).length <= 1}
                    >
                      删
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="modal-btn secondary"
                onClick={() => !saving && setModalOpen(false)}
                disabled={saving}
              >
                取消
              </button>
              <button type="submit" className="modal-btn primary" disabled={saving}>
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
