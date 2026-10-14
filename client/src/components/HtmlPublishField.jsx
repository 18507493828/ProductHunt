import { useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  FileCode,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import { isHostedAppUrl, toAbsoluteDemoUrl } from "../appPlatforms";

const MAX_HTML_SIZE = 5 * 1024 * 1024;

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * 本地 HTML 发布：选好单个 .html / .htm 文件后先「待发布」，由父级在提交表单时
 * 才真正上传——提交成功才算发布成功，并把站内地址回写到 value。
 *
 * value        已发布的站内地址（/apps/<标识>/），由父级表单持有
 * pendingFile  已选中、等待随提交一起发布的文件
 * publishing   提交中（父级正在上传发布该文件）
 */
export default function HtmlPublishField({
  value = "",
  pendingFile = null,
  onPendingFileChange,
  disabled = false,
  publishing = false,
  onError,
}) {
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef(null);

  const published = isHostedAppUrl(value);
  const absoluteUrl = toAbsoluteDemoUrl(value);
  const busy = disabled || publishing;

  useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    },
    [],
  );

  function flashCopied() {
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 1800);
  }

  function pickFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!/\.html?$/i.test(file.name)) {
      onError?.("请上传 .html 或 .htm 单文件");
      return;
    }
    if (file.size > MAX_HTML_SIZE) {
      onError?.("HTML 文件不能超过 5MB");
      return;
    }

    onError?.("");
    onPendingFileChange?.(file);
  }

  async function copyLink() {
    const text = absoluteUrl;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      flashCopied();
      return;
    } catch {
      // 非 https 或 iframe 环境下退回 execCommand
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-1000px";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      flashCopied();
    } catch {
      onError?.("复制失败，请手动选中链接复制");
    }
  }

  // 已选中文件、等待提交发布
  if (pendingFile) {
    return (
      <div className="ph-page-card ph-page-pending">
        <div className="ph-page-info">
          <span className="ph-page-label">
            {publishing
              ? "正在发布，请稍候"
              : published
                ? "已选择新文件，提交后替换当前地址"
                : "文件已就绪，提交后生成访问地址"}
          </span>
          <span className="ph-page-file" title={pendingFile.name}>
            <FileCode size={14} aria-hidden="true" />
            {pendingFile.name}
            <span className="ph-page-size">{formatSize(pendingFile.size)}</span>
          </span>
        </div>
        <div className="ph-page-actions">
          <label className={busy ? "ph-page-btn disabled" : "ph-page-btn"}>
            <input
              type="file"
              accept=".html,.htm,text/html"
              onChange={pickFile}
              disabled={busy}
              hidden
            />
            <RefreshCw size={14} />
            重新选择
          </label>
          <button
            type="button"
            className="ph-page-btn"
            onClick={() => {
              onError?.("");
              onPendingFileChange?.(null);
            }}
            disabled={busy}
          >
            <X size={14} />
            取消
          </button>
        </div>
      </div>
    );
  }

  if (published) {
    return (
      <div className="ph-page-card">
        <div className="ph-page-info">
          <span className="ph-page-label">发布成功，访问地址</span>
          <a
            className="ph-page-url"
            href={value}
            target="_blank"
            rel="noreferrer noopener"
            title={absoluteUrl}
          >
            {absoluteUrl}
          </a>
        </div>
        <div className="ph-page-actions">
          <button
            type="button"
            className="ph-page-btn"
            onClick={copyLink}
            disabled={disabled}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "已复制" : "复制链接"}
          </button>
          <a
            className="ph-page-btn"
            href={value}
            target="_blank"
            rel="noreferrer noopener"
            onClick={(e) => {
              if (disabled) e.preventDefault();
            }}
            aria-disabled={disabled}
          >
            <ExternalLink size={14} />
            打开预览
          </a>
          <label className={disabled ? "ph-page-btn disabled" : "ph-page-btn"}>
            <input
              type="file"
              accept=".html,.htm,text/html"
              onChange={pickFile}
              disabled={disabled}
              hidden
            />
            <RefreshCw size={14} />
            更换文件
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="ph-upload">
      <label className="ph-upload-trigger">
        <input
          type="file"
          accept=".html,.htm,text/html"
          onChange={pickFile}
          disabled={disabled}
          hidden
        />
        <Upload className="ph-upload-icon" size={26} aria-hidden="true" />
        <span className="ph-upload-text">点击选择 HTML 文件</span>
        <span className="ph-upload-sub">
          单个 .html / .htm，不超过 5MB，样式脚本请内联；提交后生成访问地址
        </span>
      </label>
    </div>
  );
}
