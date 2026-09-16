/** 应用形态：发布时区分 H5 / PC / 小程序等 */

export const APP_PLATFORMS = [
  { id: "h5", label: "H5", tip: "手机网页应用" },
  { id: "pc", label: "PC", tip: "电脑网页应用" },
  { id: "miniprogram", label: "小程序", tip: "微信等小程序" },
  { id: "app", label: "App", tip: "原生或安装包应用" },
  { id: "other", label: "其他", tip: "其他形态" },
];

export const DEFAULT_APP_PLATFORM = "h5";

/** 应用访问链接：须为完整 http(s) 地址 */
export const DEMO_URL_PATTERN = /^https?:\/\/.+/i;

export function isValidDemoUrl(url) {
  return DEMO_URL_PATTERN.test(String(url || "").trim());
}

export function getAppPlatformLabel(id) {
  return APP_PLATFORMS.find((p) => p.id === id)?.label || "";
}

export function normalizeAppPlatform(raw) {
  const id = String(raw || "").trim().toLowerCase();
  return APP_PLATFORMS.some((p) => p.id === id) ? id : "";
}
