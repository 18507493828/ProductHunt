import { useEffect, useState } from "react";
import EmptyState from "../../components/EmptyState";
import {
  createNav,
  deleteNav,
  fetchAdminNavs,
  reorderNavs,
  updateNav,
} from "../../api";

const EMPTY_NAV_FORM = {
  title: "",
  url: "",
  enabled: true,
};

export default function Navs() {
  const [navs, setNavs] = useState([]);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_NAV_FORM);
  const [saving, setSaving] = useState(false);

  async function loadNavs() {
    try {
      setError("");
      const list = await fetchAdminNavs();
      setNavs(list);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadNavs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openModal(nav = null) {
    setEditingId(nav ? nav.id : null);
    setForm(
      nav
        ? {
            title: nav.title || "",
            url: nav.url || "",
            enabled: nav.enabled !== false,
          }
        : EMPTY_NAV_FORM
    );
    setError("");
    setModalOpen(true);
  }

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const { title, url, enabled } = form;

    if (!title.trim()) {
      setError("请填写导航名称");
      return;
    }
    if (!/^https?:\/\/.+/i.test(url.trim())) {
      setError("链接需以 http:// 或 https:// 开头");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const payload = { title, url, enabled };
      if (editingId) {
        await updateNav(editingId, payload);
      } else {
        await createNav(payload);
      }
      setModalOpen(false);
      await loadNavs();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`确定删除导航「${title}」吗？`)) return;
    try {
      setActionId(id);
      setError("");
      await deleteNav(id);
      await loadNavs();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId("");
    }
  }

  async function handleToggle(nav) {
    try {
      setActionId(nav.id);
      setError("");
      await updateNav(nav.id, { enabled: !nav.enabled });
      await loadNavs();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId("");
    }
  }

  async function handleMove(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= navs.length) return;
    const next = [...navs];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    try {
      setError("");
      await reorderNavs(next.map((nav) => nav.id));
      await loadNavs();
    } catch (err) {
      setError(err.message);
      await loadNavs();
    }
  }

  return (
    <>
      <div className="admin-toolbar">
        <span className="admin-toolbar-hint">
          顶部导航会按顺序展示在 Logo 右侧，共 {navs.length} 个
        </span>
        <button
          type="button"
          className="add-banner-btn"
          onClick={() => openModal()}
        >
          + 新增导航
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {navs.length === 0 ? (
        <EmptyState title="还没有导航" description="点击「新增导航」创建第一个" />
      ) : (
        <div className="nav-grid">
          {navs.map((nav, index) => (
            <article className="ph-card nav-card" key={nav.id}>
              <div className="ph-card-body">
                <div className="ph-card-top">
                  <span className="nav-card-index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2 className="ph-card-title" title={nav.title}>
                    {nav.title}
                  </h2>
                  <span
                    className={
                      "ph-card-badge " + (nav.enabled ? "on" : "off")
                    }
                  >
                    {nav.enabled ? "展示中" : "已停用"}
                  </span>
                </div>
                <div className="ph-card-meta">
                  <span>顺序：第 {index + 1} 位</span>
                  <a
                    href={nav.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    title={nav.url}
                  >
                    {nav.url}
                  </a>
                </div>
                <div className="ph-card-actions">
                  <button
                    type="button"
                    className="card-btn move"
                    disabled={index === 0 || actionId === nav.id}
                    onClick={() => handleMove(index, -1)}
                    title="上移"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="card-btn move"
                    disabled={index === navs.length - 1 || actionId === nav.id}
                    onClick={() => handleMove(index, 1)}
                    title="下移"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className={nav.enabled ? "card-btn off" : "card-btn on"}
                    disabled={actionId === nav.id}
                    onClick={() => handleToggle(nav)}
                  >
                    {nav.enabled ? "停用" : "启用"}
                  </button>
                  <button
                    type="button"
                    className="card-btn edit"
                    disabled={actionId === nav.id}
                    onClick={() => openModal(nav)}
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    className="card-btn del"
                    disabled={actionId === nav.id}
                    onClick={() => handleDelete(nav.id, nav.title)}
                  >
                    删除
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay">
          <form className="modal" onSubmit={handleSubmit}>
            <div className="modal-header">
              <div>
                <p className="modal-eyebrow">导航管理</p>
                <h2>{editingId ? "编辑导航" : "新增导航"}</h2>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setModalOpen(false)}
                aria-label="关闭"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-field">
                <span>导航名称 *</span>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => updateForm("title", e.target.value)}
                  placeholder="例如：码道官方网站"
                  maxLength={30}
                />
              </div>

              <div className="modal-field">
                <span>链接地址 *</span>
                <input
                  type="text"
                  value={form.url}
                  onChange={(e) => updateForm("url", e.target.value)}
                  placeholder="https://...（点击导航打开的链接）"
                />
              </div>

              <div className="modal-field">
                <span>状态</span>
                <label className="banner-toggle">
                  <input
                    type="checkbox"
                    checked={form.enabled}
                    onChange={(e) => updateForm("enabled", e.target.checked)}
                  />
                  <span>
                    {form.enabled ? "启用（展示在顶部导航栏）" : "停用"}
                  </span>
                </label>
              </div>

              {error && <div className="modal-error">{error}</div>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-btn secondary"
                  onClick={() => setModalOpen(false)}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="modal-btn primary"
                  disabled={saving}
                >
                  {saving ? "保存中..." : editingId ? "保存修改" : "添加导航"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
