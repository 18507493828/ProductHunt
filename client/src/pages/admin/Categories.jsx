import { useEffect, useState } from "react";
import EmptyState from "../../components/EmptyState";
import {
  createCategory,
  deleteCategory,
  fetchAdminCategories,
  updateCategory,
} from "../../api";

const EMPTY_FORM = {
  name: "",
  sort: 0,
  enabled: true,
};

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function loadCategories() {
    try {
      setError("");
      const list = await fetchAdminCategories();
      setCategories(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function openModal(category = null) {
    setEditingId(category ? category.id : null);
    setForm(
      category
        ? {
            name: category.name || "",
            sort: category.sort ?? 0,
            enabled: category.enabled !== false,
          }
        : {
            ...EMPTY_FORM,
            sort: categories.length + 1,
          },
    );
    setError("");
    setModalOpen(true);
  }

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setError("请填写分类名称");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const payload = {
        name,
        sort: Number(form.sort) || 0,
        enabled: form.enabled !== false,
      };
      if (editingId) {
        await updateCategory(editingId, payload);
      } else {
        await createCategory(payload);
      }
      setModalOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      await loadCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleEnabled(category) {
    try {
      setActionId(category.id);
      setError("");
      await updateCategory(category.id, {
        name: category.name,
        sort: category.sort,
        enabled: !(category.enabled !== false),
      });
      await loadCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId("");
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`确定删除分类「${name}」？已发布资源上的该分类不会自动清除。`)) {
      return;
    }
    try {
      setActionId(id);
      setError("");
      await deleteCategory(id);
      await loadCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId("");
    }
  }

  return (
    <>
      <div className="admin-toolbar">
        <p className="admin-toolbar-hint">
          配置首页「全部标签」下的分类筛选，以及发布应用时可选的分类。
        </p>
        <button type="button" className="add-banner-btn" onClick={() => openModal()}>
          新增分类
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {categories.length === 0 ? (
        <EmptyState title="还没有分类配置" />
      ) : (
        <div className="admin-list">
          {categories.map((category) => (
            <article className="admin-item" key={category.id}>
              <div className="admin-item-main">
                <div className="admin-item-top">
                  <h2>{category.name}</h2>
                  <span
                    className={
                      "status-badge " +
                      (category.enabled !== false
                        ? "status-approved"
                        : "status-rejected")
                    }
                  >
                    {category.enabled !== false ? "展示中" : "已隐藏"}
                  </span>
                </div>
                <div className="admin-meta">
                  <span>ID：{category.id}</span>
                  <span>排序：{category.sort ?? 0}</span>
                </div>
              </div>
              <div className="admin-actions">
                <button
                  type="button"
                  className="approve-btn"
                  disabled={actionId === category.id}
                  onClick={() => openModal(category)}
                >
                  编辑
                </button>
                <button
                  type="button"
                  className={
                    category.enabled !== false ? "special-btn off" : "special-btn"
                  }
                  disabled={actionId === category.id}
                  onClick={() => toggleEnabled(category)}
                >
                  {category.enabled !== false ? "隐藏" : "展示"}
                </button>
                <button
                  type="button"
                  className="delete-btn"
                  disabled={actionId === category.id}
                  onClick={() => handleDelete(category.id, category.name)}
                >
                  删除
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {modalOpen && (
        <div
          className="modal-overlay"
          onClick={() => !saving && setModalOpen(false)}
        >
          <form
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
          >
            <div className="modal-header">
              <div>
                <p className="modal-eyebrow">分类</p>
                <h2>{editingId ? "编辑分类" : "新增分类"}</h2>
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
              <label className="modal-field">
                <span>分类名称 *</span>
                <input
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  placeholder="例如：AI 工具"
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
              <label className="banner-toggle">
                <input
                  type="checkbox"
                  checked={form.enabled !== false}
                  onChange={(e) => updateForm("enabled", e.target.checked)}
                  disabled={saving}
                />
                <span>启用展示</span>
              </label>
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
