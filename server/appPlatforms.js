/** 应用形态：发布时区分 H5 / PC / 小程序等 */

export const APP_PLATFORMS = [
  { id: "h5", label: "H5" },
  { id: "pc", label: "PC" },
  { id: "miniprogram", label: "小程序" },
  { id: "app", label: "App" },
  { id: "other", label: "其他" },
];

export const DEFAULT_APP_PLATFORM = "h5";

export function normalizeAppPlatform(raw) {
  const id = String(raw || "").trim().toLowerCase();
  return APP_PLATFORMS.some((p) => p.id === id) ? id : "";
}
