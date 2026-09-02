import { createPortal } from "react-dom";
import { Upload } from "lucide-react";

export default function TopicPostUploadModal({
  open,
  topicName,
  submitting,
  error,
  form,
  imageUploading,
  onClose,
  onChange,
  onImageChange,
  onSubmit,
}) {
  if (!open) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="topic-post-modal-title"
      >
        <div className="modal-header">
          <div>
            <p className="modal-eyebrow">话题内容</p>
            <h2 id="topic-post-modal-title">
              发布到 {topicName ? `#${topicName}#` : "话题"}
            </h2>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={submitting}
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        <form className="modal-body" onSubmit={onSubmit}>
          <label className="modal-field">
            <span>
              标题 <span className="field-required">*</span>
            </span>
            <input
              value={form.title}
              onChange={(e) => onChange("title", e.target.value)}
              placeholder="一句话概括你要分享的内容"
              maxLength={80}
              disabled={submitting}
              required
            />
          </label>

          <label className="modal-field">
            <span>
              正文 <span className="field-required">*</span>
            </span>
            <textarea
              value={form.content}
              onChange={(e) => onChange("content", e.target.value)}
              placeholder="分享经验、教程、观点、案例…"
              rows={6}
              maxLength={2000}
              disabled={submitting}
              required
            />
          </label>

          <div className="modal-field">
            <span>配图（选填）</span>
            <div className="ph-upload">
              {form.imageUrl ? (
                <div className="ph-upload-preview">
                  <img src={form.imageUrl} alt="配图预览" />
                  <button
                    type="button"
                    className="ph-upload-remove"
                    onClick={() => onChange("imageUrl", "")}
                    disabled={submitting || imageUploading}
                    aria-label="移除图片"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label
                  className={
                    imageUploading ? "ph-upload-trigger uploading" : "ph-upload-trigger"
                  }
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={onImageChange}
                    disabled={submitting || imageUploading}
                    hidden
                  />
                  <Upload className="ph-upload-icon" size={26} aria-hidden="true" />
                  <span className="ph-upload-text">
                    {imageUploading ? "上传中..." : "点击上传配图"}
                  </span>
                </label>
              )}
            </div>
          </div>

          <label className="modal-field">
            <span>相关链接（选填）</span>
            <input
              value={form.linkUrl}
              onChange={(e) => onChange("linkUrl", e.target.value)}
              placeholder="https://..."
              disabled={submitting}
            />
          </label>

          {error && <div className="modal-error">{error}</div>}

          <div className="modal-actions">
            <button
              type="button"
              className="modal-btn secondary"
              onClick={onClose}
              disabled={submitting}
            >
              取消
            </button>
            <button type="submit" className="modal-btn primary" disabled={submitting}>
              {submitting ? "发布中..." : "发布内容"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
