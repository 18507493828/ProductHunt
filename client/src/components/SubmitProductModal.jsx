import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Upload } from "lucide-react";
import {
  fetchCampaigns,
  fetchCategoryOptions,
  fetchTopics,
  submitProduct,
  updateProduct,
  uploadImage,
} from "../api";
import { useAuth } from "../AuthContext";
import { useToast } from "../Toast";
import { useModalMotion } from "../useModalMotion";

const EMPTY_FORM = {
  name: "",
  tagline: "",
  url: "",
  categories: [],
  campaign: "",
  description: "",
  imageUrl: "",
  topicName: "",
};

/**
 * 上传/编辑资源弹窗。
 * lockedCampaignId：锁定活动（活动详情页一键参与时使用）
 */
export default function SubmitProductModal({
  open,
  onClose,
  onSuccess,
  editingProduct = null,
  lockedCampaignId = "",
  initialCampaignId = "",
}) {
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState(EMPTY_FORM);
  const [categories, setCategories] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [topicAll, setTopicAll] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [topicSuggestOpen, setTopicSuggestOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [error, setError] = useState("");

  const editingId = editingProduct?.id || "";
  const locked = Boolean(lockedCampaignId);
  const { mounted, overlayClassName, panelClassName } = useModalMotion(open);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;

    setError("");
    setTopicSuggestOpen(false);

    if (editingProduct) {
      setSelectedTopicId(editingProduct.topicId || "");
      setForm({
        name: editingProduct.name || "",
        tagline: editingProduct.tagline || "",
        url: editingProduct.url || "",
        categories: editingProduct.categories?.length
          ? editingProduct.categories
          : editingProduct.category
            ? [editingProduct.category]
            : [],
        campaign: editingProduct.campaign || "",
        description: editingProduct.description || "",
        imageUrl: editingProduct.imageUrl || "",
        topicName: editingProduct.topicName || "",
      });
    } else {
      setSelectedTopicId("");
      setForm({
        ...EMPTY_FORM,
        campaign: lockedCampaignId || initialCampaignId || "",
      });
    }

    Promise.all([
      fetchCategoryOptions().catch(() => ({ categories: [] })),
      fetchCampaigns().catch(() => []),
      fetchTopics({ all: true }).catch(() => ({ items: [] })),
    ]).then(([catRes, campaignList, topicRes]) => {
      if (cancelled) return;
      setCategories(catRes?.categories || []);
      setCampaigns(Array.isArray(campaignList) ? campaignList : []);
      const items = topicRes?.items || [];
      setTopicAll(items);
      if (editingProduct && !editingProduct.topicName && editingProduct.topicId) {
        const hit = items.find((t) => t.id === editingProduct.topicId);
        if (hit) {
          setForm((prev) => ({ ...prev, topicName: hit.name || "" }));
          setSelectedTopicId(hit.id);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open, editingProduct, lockedCampaignId, initialCampaignId]);

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleCategory(category) {
    setForm((prev) => {
      const list = Array.isArray(prev.categories) ? prev.categories : [];
      if (list.includes(category)) {
        return { ...prev, categories: list.filter((c) => c !== category) };
      }
      return { ...prev, categories: [...list, category] };
    });
    setError("");
  }

  function handleTopicNameChange(value) {
    setSelectedTopicId("");
    updateForm("topicName", value);
    setTopicSuggestOpen(value.trim().length > 0);
  }

  function handlePickTopic(topic) {
    setSelectedTopicId(topic.id);
    updateForm("topicName", topic.name);
    setTopicSuggestOpen(false);
    setError("");
  }

  function topicSuggestions() {
    const q = (form.topicName || "").trim().toLowerCase();
    if (!q) return [];
    return topicAll.filter((t) => t.name.toLowerCase().includes(q)).slice(0, 8);
  }

  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!/^image\/(jpeg|png|gif|webp)$/i.test(file.type)) {
      setError("仅支持 JPG / PNG / GIF / WebP 图片");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("图片不能超过 2MB");
      return;
    }

    try {
      setImageUploading(true);
      setError("");
      const { url } = await uploadImage(file);
      updateForm("imageUrl", url);
    } catch (err) {
      setError(err.message);
    } finally {
      setImageUploading(false);
    }
  }

  function handleClose() {
    if (submitting) return;
    onClose?.();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmedName = form.name.trim();
    const trimmedTagline = form.tagline.trim();
    const trimmedUrl = form.url.trim();

    if (!trimmedName) {
      setError("请填写资源名称");
      return;
    }
    if (!trimmedTagline) {
      setError("请填写一句话介绍");
      return;
    }
    if (!trimmedUrl) {
      setError("请填写演示链接");
      return;
    }
    if (!/^https?:\/\/.+/i.test(trimmedUrl)) {
      setError("演示链接需以 http:// 或 https:// 开头");
      return;
    }
    if (!(form.categories || []).length) {
      setError("请至少选择一个分类");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const payload = {
        name: form.name,
        tagline: form.tagline,
        url: form.url,
        categories: form.categories || [],
        campaign: locked
          ? lockedCampaignId
          : form.campaign || "",
        description: form.description,
        imageUrl: form.imageUrl,
        topicId: selectedTopicId || "",
        topicName: (form.topicName || "").trim(),
      };
      const result = editingId
        ? await updateProduct(editingId, payload)
        : await submitProduct(payload);

      toast.success(
        editingId ? "保存成功" : "上传成功",
        result.message &&
          result.message !== "保存成功" &&
          result.message !== "上传成功"
          ? result.message
          : "",
      );
      onSuccess?.(result, { editing: Boolean(editingId), campaignId: payload.campaign });
      onClose?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!mounted) return null;

  const lockedCampaign = campaigns.find((c) => c.id === lockedCampaignId);

  return createPortal(
    <div className={overlayClassName} onClick={handleClose}>
      <div
        className={panelClassName}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="submit-product-modal-title"
      >
        <div className="modal-header">
          <div>
            <h2 id="submit-product-modal-title">
              {editingId
                ? "编辑资源"
                : locked
                  ? `参与「${lockedCampaign?.title || "活动"}」`
                  : "上传你的资源"}
            </h2>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={handleClose}
            disabled={submitting}
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="modal-field">
            <span>封面图</span>
            <div className="ph-upload">
              {form.imageUrl ? (
                <div className="ph-upload-preview">
                  <img src={form.imageUrl} alt="封面图预览" />
                  <button
                    type="button"
                    className="ph-upload-remove"
                    onClick={() => updateForm("imageUrl", "")}
                    disabled={submitting || imageUploading}
                    aria-label="移除图片"
                    title="移除图片"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label
                  className={
                    imageUploading
                      ? "ph-upload-trigger uploading"
                      : "ph-upload-trigger"
                  }
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleImageChange}
                    disabled={submitting || imageUploading}
                    hidden
                  />
                  <Upload
                    className="ph-upload-icon"
                    size={26}
                    aria-hidden="true"
                  />
                  <span className="ph-upload-text">
                    {imageUploading ? "上传中..." : "点击上传图片"}
                  </span>
                  <span className="ph-upload-sub">
                    JPG / PNG / GIF / WebP，不超过 2MB，选填
                  </span>
                </label>
              )}
            </div>
          </div>

          <label className="modal-field">
            <span>
              资源名称 <span className="field-required">*</span>
            </span>
            <input
              value={form.name}
              onChange={(e) => updateForm("name", e.target.value)}
              placeholder="例如：代码审查专家、Notion 链接器"
              maxLength={50}
              disabled={submitting}
              required
            />
          </label>

          <label className="modal-field">
            <span>
              一句话介绍 <span className="field-required">*</span>
            </span>
            <input
              value={form.tagline}
              onChange={(e) => updateForm("tagline", e.target.value)}
              placeholder="用一句话说清这个资源能做什么"
              maxLength={100}
              disabled={submitting}
              required
            />
          </label>

          <label className="modal-field">
            <span>
              演示链接 <span className="field-required">*</span>
            </span>
            <input
              value={form.url}
              onChange={(e) => updateForm("url", e.target.value)}
              placeholder="https://github.com/... 或在线演示地址"
              disabled={submitting}
              required
            />
          </label>

          <div className="modal-field">
            <span>
              分类 <span className="field-required">*</span>
              <span className="field-hint">（可多选）</span>
            </span>
            <div className="modal-category-options">
              {categories.map((category) => {
                const selected = (form.categories || []).includes(category);
                return (
                  <button
                    key={category}
                    type="button"
                    className={
                      selected ? "modal-category active" : "modal-category"
                    }
                    onClick={() => toggleCategory(category)}
                    disabled={submitting}
                    aria-pressed={selected}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          {locked ? (
            <div className="modal-field">
              <span>活动</span>
              <div className="modal-category-options">
                <span className="modal-category active">
                  {lockedCampaign?.title || "当前活动"}
                </span>
              </div>
            </div>
          ) : (
            campaigns.length > 0 && (
              <div className="modal-field">
                <span>
                  活动
                  <span className="field-hint">（可选）</span>
                </span>
                <div className="modal-category-options">
                  <button
                    type="button"
                    className={
                      !form.campaign
                        ? "modal-category active"
                        : "modal-category"
                    }
                    onClick={() => updateForm("campaign", "")}
                    disabled={submitting}
                    aria-pressed={!form.campaign}
                  >
                    不参加
                  </button>
                  {campaigns.map((campaign) => {
                    const selected = form.campaign === campaign.id;
                    return (
                      <button
                        key={campaign.id}
                        type="button"
                        className={
                          selected
                            ? "modal-category active"
                            : "modal-category"
                        }
                        onClick={() =>
                          updateForm("campaign", selected ? "" : campaign.id)
                        }
                        disabled={submitting}
                        aria-pressed={selected}
                      >
                        {campaign.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          )}

          <div className="modal-field">
            <label className="modal-label" htmlFor="submit-product-topic-name">
              话题
            </label>
            <div className="topic-input-wrap">
              <input
                id="submit-product-topic-name"
                className="modal-input"
                placeholder="输入话题名称，如：AI 创作、独立开发…"
                value={form.topicName}
                maxLength={30}
                autoComplete="off"
                disabled={submitting}
                onChange={(e) => handleTopicNameChange(e.target.value)}
                onFocus={() =>
                  setTopicSuggestOpen((form.topicName || "").trim().length > 0)
                }
                onBlur={() => setTimeout(() => setTopicSuggestOpen(false), 120)}
              />
              {selectedTopicId && (
                <span className="topic-input-picked">已选话题</span>
              )}
              {topicSuggestOpen && (
                <div className="topic-suggest" role="listbox">
                  {topicSuggestions().length > 0 ? (
                    topicSuggestions().map((topic) => (
                      <button
                        type="button"
                        key={topic.id}
                        className="topic-suggest-item"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handlePickTopic(topic)}
                      >
                        <span className="topic-suggest-info">
                          <span className="topic-suggest-name">
                            #{topic.name}
                          </span>
                          <span className="topic-suggest-meta">
                            {topic.postCount ?? 0} 条内容 · 点击选用
                          </span>
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="topic-suggest-item topic-suggest-empty">
                      {(form.topicName || "").trim()
                        ? "无匹配话题，提交时将自动新建"
                        : "输入关键词搜索话题"}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <label className="modal-field">
            <span>详细介绍</span>
            <textarea
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
              placeholder="资源的能力说明、适用场景、使用方式（选填）"
              rows={4}
              maxLength={500}
              disabled={submitting}
            />
          </label>

          {error && <div className="modal-error">{error}</div>}

          <div className="modal-actions">
            <button
              type="button"
              className="modal-btn secondary"
              onClick={handleClose}
              disabled={submitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="modal-btn primary"
              disabled={submitting}
            >
              {submitting
                ? editingId
                  ? "保存中..."
                  : "上传中..."
                : editingId
                  ? "保存修改"
                  : isAdmin
                    ? "立即发布"
                    : "提交审核"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
