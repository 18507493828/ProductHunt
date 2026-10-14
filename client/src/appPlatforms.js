/** 应用形态：发布时区分 H5 / PC / 小程序等 */

export const APP_PLATFORMS = [
  { id: "h5", label: "H5", tip: "手机网页应用" },
  { id: "pc", label: "PC", tip: "电脑网页应用" },
  { id: "miniprogram", label: "小程序", tip: "微信等小程序" },
  { id: "app", label: "App", tip: "原生或安装包应用" },
  { id: "other", label: "其他", tip: "其他形态" },
];

export const DEFAULT_APP_PLATFORM = "h5";

/** 应用访问链接：完整 http(s)，或站内发布的本地 HTML 页（/apps/<标识>/） */
export const DEMO_URL_PATTERN = /^(https?:\/\/.+|\/apps\/[\w.-]+(?:\/[\w.-]*)*\/?)$/i;

export function isValidDemoUrl(url) {
  return DEMO_URL_PATTERN.test(String(url || "").trim());
}

/** 是否为站内托管的发布页（相对路径，或指向 /apps/ 的完整地址） */
export function isHostedAppUrl(url) {
  const value = String(url || "").trim();
  if (!value) return false;
  if (/^\/apps\//i.test(value)) return true;
  if (!/^https?:\/\//i.test(value)) return false;
  try {
    return /^\/apps\/[^/?#]/i.test(new URL(value).pathname);
  } catch {
    return false;
  }
}

/** 把站内相对路径补成可直接访问的完整地址 */
export function toAbsoluteDemoUrl(url) {
  const value = String(url || "").trim();
  if (!value || /^https?:\/\//i.test(value)) return value;
  if (typeof window === "undefined") return value;
  return `${window.location.origin}${value.startsWith("/") ? "" : "/"}${value}`;
}

/** 发布方式：在线链接 / 上传本地 HTML */
export const PUBLISH_MODES = [
  { id: "url", label: "在线链接", tip: "填写已部署的 http(s) 演示地址" },
  {
    id: "html",
    label: "本地 HTML",
    tip: "上传单个 HTML 文件，自动生成可访问链接",
  },
];

export function getAppPlatformLabel(id) {
  return APP_PLATFORMS.find((p) => p.id === id)?.label || "";
}

export function normalizeAppPlatform(raw) {
  const id = String(raw || "").trim().toLowerCase();
  return APP_PLATFORMS.some((p) => p.id === id) ? id : "";
}
