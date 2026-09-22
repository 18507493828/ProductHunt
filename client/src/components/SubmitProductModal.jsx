import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Upload } from "lucide-react";
import {
  fetchBuildConfig,
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
import {
  APP_PLATFORMS,
  DEFAULT_APP_PLATFORM,
  isValidDemoUrl,
} from "../appPlatforms";

const EMPTY_FORM = {
  name: "",
  tagline: "",
  url: "",
  categories: [],
  campaign: "",
  description: "",
  imageUrl: "",
  topicName: "",
  appPlatform: DEFAULT_APP_PLATFORM,
  buildToolId: "",
  price: "",
  originalPrice: "",
  buyUrl: "",
  purchaseNote: "",
};

/**
 * 上传/编辑应用弹窗（运营端与活动页共用）。
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
  const [buildScenes, setBuildScenes] = useState([]);
  const [buildTools, setBuildTools] = useState([]);
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

  const selectedSceneName = (form.categories || [])[0] || "";
  const selectedBuildScene = buildScenes.find(
    (s) => s.name === selectedSceneName,
  );
  const sceneTopicOptions = (selectedBuildScene?.topics || [])
    .map((t) => {
      if (typeof t === "string") return { name: t.trim(), enabled: true };
      return {
        name: String(t?.name || "").trim(),
        enabled: t?.enabled !== false,
      };
    })
    .filter((t) => t.name && t.enabled);
  const selectedTool = buildTools.find((t) => t.id === form.buildToolId);

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
        appPlatform: editingProduct.appPlatform || DEFAULT_APP_PLATFORM,
        buildToolId: editingProduct.buildToolId || "",
        price: editingProduct.price || "",
        originalPrice: editingProduct.originalPrice || "",
        buyUrl: editingProduct.buyUrl || "",
        purchaseNote: editingProduct.purchaseNote || "",
      });
    } else {
      setSelectedTopicId("");
      setForm({
        ...EMPTY_FORM,
        campaign: lockedCampaignId || initialCampaignId || "",
      });
    }

    Promise.all([
      fetchBuildConfig().catch(() => null),
      fetchCategoryOptions().catch(() => ({ categories: [] })),
      fetchCampaigns().catch(() => []),
      fetchTopics({ all: true }).catch(() => ({ items: [] })),
    ]).then(([buildConfig, catRes, campaignList, topicRes]) => {
      if (cancelled) return;
      // 与客户端广场/发布一致：优先用构建场景名
      const scenes = (buildConfig?.scenes || [])
        .filter((s) => s && s.enabled !== false && s.name)
        .sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0));
      setBuildScenes(scenes);
      const tools = (buildConfig?.tools || [])
        .filter((t) => t && t.enabled !== false && t.id)
        .sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0));
      setBuildTools(tools);
      const sceneNames = scenes.map((s) => s.name);
      const fallback = Array.isArray(catRes?.categories) ? catRes.categories : [];
      setCategories(sceneNames.length ? sceneNames : fallback);
      setCampaigns(Array.isArray(campaignList) ? campaignList : []);
      const items = topicRes?.items || [];
      setTopicAll(items);

      if (editingProduct) {
        setForm((prev) => {
          const next = { ...prev };
          if (!next.buildToolId) {
            next.buildToolId =
              tools.find((t) => t.id === editingProduct.buildToolId)?.id ||
              tools.find((t) => t.name === editingProduct.buildToolName)?.id ||
              "";
          }
          if (!next.topicName && editingProduct.topicId) {
            const hit = items.find((t) => t.id === editingProduct.topicId);
            if (hit) next.topicName = hit.name || "";
          }
          return next;
        });
        if (!editingProduct.topicName && editingProduct.topicId) {
          const hit = items.find((t) => t.id === editingProduct.topicId);
          if (hit) setSelectedTopicId(hit.id);
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

  function selectScene(scene) {
    setForm((prev) => ({
      ...prev,
      categories: [scene],
      topicName: "",
    }));
    setSelectedTopicId("");
    setTopicSuggestOpen(false);
    setError("");
  }

  function selectSceneTopic(topicName) {
    setSelectedTopicId("");
    setForm((prev) => ({ ...prev, topicName }));
    setTopicSuggestOpen(false);
    setError("");
  }

  function handleTopicNameChange(value) {
    setSelectedTopicId("");
    updateForm("topicName", value);
    setTopicSuggestOpen(value.trim().length > 0);
  }

  function handlePickTopic(topic) {
    setSelectedTopicId(topic.id || "");
    updateForm("topicName", topic.name);
    setTopicSuggestOpen(false);
    setError("");
  }

  function topicSuggestions() {
    const q = (form.topicName || "").trim().toLowerCase();
    if (!q) return [];

    // 优先匹配当前场景下的构建话题（运营后台创建的那批）
    const sceneHits = sceneTopicOptions
      .filter((t) => t.name.toLowerCase().includes(q))
      .map((t) => ({
        id: "",
        name: t.name,
        postCount: null,
        source: "scene",
      }));

    const communityHits = topicAll
      .filter((t) => String(t.name || "").toLowerCase().includes(q))
      .filter(
        (t) =>
          !sceneHits.some(
            (s) => s.name.toLowerCase() === String(t.name || "").toLowerCase(),
          ),
      )
      .map((t) => ({ ...t, source: "community" }));

    return [...sceneHits, ...communityHits].slice(0, 10);
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
    const topicName = (form.topicName || "").trim();

    if (!trimmedName) {
      setError("请填写应用名称");
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
    if (!isValidDemoUrl(trimmedUrl)) {
      setError("演示链接需为完整 http(s) 地址，例如 https://example.com/app");
      return;
    }
    if (!(form.categories || []).length) {
      setError("请选择所属场景");
      return;
    }
    if (!topicName) {
      setError("请选择或填写场景话题");
      return;
    }
    if (!form.appPlatform) {
      setError("请选择应用形态");
      return;
    }
    if (!form.buildToolId || !selectedTool) {
      setError("请选择构建工具");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const sceneName = (form.categories || [])[0] || "";
      const payload = {
        name: form.name,
        tagline: form.tagline,
        url: form.url,
        sceneName,
        category: sceneName,
        categories: sceneName ? [sceneName] : [],
        campaign: locked
          ? lockedCampaignId
          : form.campaign || "",
        description: form.description,
        imageUrl: form.imageUrl,
        topicId: selectedTopicId || "",
        topicName,
        appPlatform: form.appPlatform || DEFAULT_APP_PLATFORM,
        buildToolId: selectedTool.id,
        buildToolName: selectedTool.name || "",
        price: (form.price || "").trim(),
        originalPrice: (form.originalPrice || "").trim(),
        buyUrl: (form.buyUrl || "").trim(),
        purchaseNote: (form.purchaseNote || "").trim(),
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
    <div className={overlayClassName}>
      <div
        className={panelClassName}
        role="dialog"
        aria-modal="true"
        aria-labelledby="submit-product-modal-title"
      >
        <div className="modal-header">
          <div>
            <h2 id="submit-product-modal-title">
              {editingId
                ? "编辑应用"
                : locked
                  ? `参与「${lockedCampaign?.title || "活动"}」`
                  : "上传你的应用"}
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
              应用名称 <span className="field-required">*</span>
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
              placeholder="https://example.com/your-app"
              disabled={submitting}
              required
            />
          </label>

          <div className="modal-field">
            <span>
              所属场景 <span className="field-required">*</span>
            </span>
            <div className="modal-category-options">
              {categories.map((scene) => {
                const selected = (form.categories || [])[0] === scene;
                return (
                  <button
                    key={scene}
                    type="button"
                    className={
                      selected ? "modal-category active" : "modal-category"
                    }
                    onClick={() => selectScene(scene)}
                    disabled={submitting}
                    aria-pressed={selected}
                  >
                    {scene}
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
            <span>
              场景话题 <span className="field-required">*</span>
            </span>
            {!selectedSceneName ? (
              <p className="field-hint" style={{ margin: 0 }}>
                请先选择所属场景
              </p>
            ) : sceneTopicOptions.length > 0 ? (
              <div className="modal-category-options">
                {sceneTopicOptions.map((topic) => {
                  const selected = form.topicName === topic.name;
                  return (
                    <button
                      key={topic.name}
                      type="button"
                      className={
                        selected ? "modal-category active" : "modal-category"
                      }
                      onClick={() => selectSceneTopic(topic.name)}
                      disabled={submitting}
                      aria-pressed={selected}
                    >
                      {topic.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="field-hint" style={{ margin: 0 }}>
                该场景暂无预置话题，可在下方手动输入
              </p>
            )}
            <div className="topic-input-wrap" style={{ marginTop: 10 }}>
              <input
                id="submit-product-topic-name"
                className="modal-input"
                placeholder={
                  selectedSceneName
                    ? "搜索或输入话题，如：桌游、组队…"
                    : "请先选择场景后再填写话题"
                }
                value={form.topicName}
                maxLength={30}
                autoComplete="off"
                disabled={submitting || !selectedSceneName}
                onChange={(e) => handleTopicNameChange(e.target.value)}
                onFocus={() =>
                  setTopicSuggestOpen((form.topicName || "").trim().length > 0)
                }
                onBlur={() => setTimeout(() => setTopicSuggestOpen(false), 120)}
              />
              {selectedTopicId && (
                <span className="topic-input-picked">已选社区话题</span>
              )}
              {topicSuggestOpen && (
                <div className="topic-suggest" role="listbox">
                  {topicSuggestions().length > 0 ? (
                    topicSuggestions().map((topic) => (
                      <button
                        type="button"
                        key={`${topic.source}-${topic.id || topic.name}`}
                        className="topic-suggest-item"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handlePickTopic(topic)}
                      >
                        <span className="topic-suggest-info">
                          <span className="topic-suggest-name">
                            #{topic.name}
                          </span>
                          <span className="topic-suggest-meta">
                            {topic.source === "scene"
                              ? "当前场景话题 · 点击选用"
                              : `${topic.postCount ?? 0} 条内容 · 点击选用`}
                          </span>
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="topic-suggest-item topic-suggest-empty">
                      {(form.topicName || "").trim()
                        ? "无匹配话题，提交时将按输入新建"
                        : "输入关键词搜索话题"}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="modal-field">
            <span>
              应用形态 <span className="field-required">*</span>
            </span>
            <div className="modal-category-options">
              {APP_PLATFORMS.map((p) => {
                const selected = form.appPlatform === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={
                      selected ? "modal-category active" : "modal-category"
                    }
                    onClick={() => updateForm("appPlatform", p.id)}
                    disabled={submitting}
                    aria-pressed={selected}
                    title={p.tip}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="modal-field">
            <span>
              构建工具 <span className="field-required">*</span>
            </span>
            <div className="modal-category-options">
              {buildTools.map((t) => {
                const selected = form.buildToolId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={
                      selected ? "modal-category active" : "modal-category"
                    }
                    onClick={() => updateForm("buildToolId", t.id)}
                    disabled={submitting}
                    aria-pressed={selected}
                  >
                    {t.emoji ? `${t.emoji} ` : ""}
                    {t.name}
                    {t.sponsored && Number(t.incentive) > 0
                      ? ` · 活动赞助 ¥${t.incentive} 激励`
                      : t.sponsored
                        ? " · 活动赞助"
                        : ""}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="modal-row">
            <label className="modal-field">
              <span>
                售价
                <span className="field-hint">（建议 5000–10000）</span>
              </span>
              <input
                value={form.price}
                onChange={(e) => updateForm("price", e.target.value)}
                placeholder="例如：7800"
                maxLength={64}
                disabled={submitting}
              />
            </label>
            <label className="modal-field">
              <span>
                原价
                <span className="field-hint">（选填）</span>
              </span>
              <input
                value={form.originalPrice}
                onChange={(e) => updateForm("originalPrice", e.target.value)}
                placeholder="例如：19.9"
                maxLength={64}
                disabled={submitting}
              />
            </label>
          </div>

          <label className="modal-field">
            <span>
              购买链接
              <span className="field-hint">（选填，填写后购买弹窗可跳转）</span>
            </span>
            <input
              value={form.buyUrl}
              onChange={(e) => updateForm("buyUrl", e.target.value)}
              placeholder="https://example.com/buy"
              disabled={submitting}
            />
          </label>

          <label className="modal-field">
            <span>
              购买说明
              <span className="field-hint">（选填）</span>
            </span>
            <input
              value={form.purchaseNote}
              onChange={(e) => updateForm("purchaseNote", e.target.value)}
              placeholder="例如：含永久授权 / 限时优惠至月底"
              maxLength={500}
              disabled={submitting}
            />
          </label>

          <label className="modal-field">
            <span>详细介绍</span>
            <textarea
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
              placeholder="应用的能力说明、适用场景、使用方式（选填）"
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
