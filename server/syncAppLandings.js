/**
 * 把库里已有样例应用的 url / app_platform 对齐到完整落地页
 * 不删数据、不改投票；仅修补落地页字段。
 *
 * 触发：
 * - 默认：发现 example.com / 相对路径 /apps/... / 旧 IP 域名 / 非本站落地页时自动修补
 * - 强制：SYNC_APP_LANDINGS=1
 */
import { listProducts, writeProduct } from "./store.js";
import { APP_LANDING_BY_NAME, landingUrl } from "./appLandingMap.js";

const LEGACY_HOST_RE =
  /^https?:\/\/(159\.75\.116\.187|127\.0\.0\.1|localhost)(:\d+)?/i;

function publicBaseUrl() {
  return String(
    process.env.PUBLIC_BASE_URL ||
      process.env.VIBE_BASE_URL ||
      "https://vb.csdn.net",
  ).replace(/\/$/, "");
}

function rewriteLegacyHost(url) {
  const u = String(url || "").trim();
  if (!u) return u;
  if (LEGACY_HOST_RE.test(u)) {
    return u.replace(LEGACY_HOST_RE, publicBaseUrl());
  }
  if (/^\/apps\//i.test(u)) {
    return `${publicBaseUrl()}${u.startsWith("/") ? u : `/${u}`}`;
  }
  return u;
}

function needsLandingFix(url) {
  const u = String(url || "").trim();
  if (!u) return true;
  if (/example\.com/i.test(u)) return true;
  if (/placeholder|localhost:\d+/i.test(u)) return true;
  if (LEGACY_HOST_RE.test(u)) return true;
  // 相对 /apps/ 升为全路径
  if (/^\/apps\//i.test(u)) return true;
  // 已是完整 http(s) 落地页则不必改（除非强制）
  if (/^https?:\/\/.+/i.test(u)) return false;
  return true;
}

export async function syncAppLandings({ force = false } = {}) {
  const forceEnv =
    force ||
    process.env.SYNC_APP_LANDINGS === "1" ||
    process.env.SYNC_APP_LANDINGS === "true";

  const list = await listProducts();
  let updated = 0;

  for (const product of list) {
    const meta = APP_LANDING_BY_NAME[product.name];
    let nextUrl = "";
    let nextPlatform = String(product.appPlatform || "").toLowerCase();

    if (meta) {
      nextUrl = landingUrl(meta.slug);
      nextPlatform = meta.platform;
    } else {
      nextUrl = rewriteLegacyHost(product.url);
    }

    const urlDirty =
      forceEnv ||
      needsLandingFix(product.url) ||
      (nextUrl && product.url !== nextUrl);
    const platformDirty =
      Boolean(meta) &&
      (forceEnv ||
        String(product.appPlatform || "").toLowerCase() !== nextPlatform);

    if (!urlDirty && !platformDirty) continue;
    if (!nextUrl) continue;

    product.url = nextUrl;
    if (meta) product.appPlatform = nextPlatform;
    product.updatedAt = new Date().toISOString();
    await writeProduct(product);
    updated += 1;
    console.log(
      `[sync-landings] ${product.name} → ${nextUrl}${
        meta ? ` (${nextPlatform})` : ""
      }`,
    );
  }

  if (updated === 0) {
    console.log("[sync-landings] nothing to update");
  } else {
    console.log(`[sync-landings] updated ${updated} product(s)`);
  }
  return updated;
}
