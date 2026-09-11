/**
 * 把库里已有样例应用的 url / app_platform 对齐到 /apps/<slug>/
 * 不删数据、不改投票；仅修补落地页字段。
 *
 * 触发：
 * - 默认：发现 example.com / 非 /apps/ 落地页时自动修补
 * - 强制：SYNC_APP_LANDINGS=1
 */
import { listProducts, writeProduct } from "./store.js";
import { APP_LANDING_BY_NAME, landingUrl } from "./appLandingMap.js";

function needsLandingFix(url) {
  const u = String(url || "").trim();
  if (!u) return true;
  if (/example\.com/i.test(u)) return true;
  if (/placeholder|localhost:\d+/i.test(u)) return true;
  // 已是本站部署路径则不必改（除非强制）
  if (/^\/apps\/[\w.-]+(?:\/[\w.-]*)*\/?$/i.test(u)) return false;
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
    if (!meta) continue;

    const nextUrl = landingUrl(meta.slug);
    const nextPlatform = meta.platform;
    const urlDirty = forceEnv || needsLandingFix(product.url) || product.url !== nextUrl;
    const platformDirty =
      forceEnv || String(product.appPlatform || "").toLowerCase() !== nextPlatform;

    if (!urlDirty && !platformDirty) continue;

    product.url = nextUrl;
    product.appPlatform = nextPlatform;
    product.updatedAt = new Date().toISOString();
    await writeProduct(product);
    updated += 1;
    console.log(
      `[sync-landings] ${product.name} → ${nextUrl} (${nextPlatform})`,
    );
  }

  if (updated === 0) {
    console.log("[sync-landings] nothing to update");
  } else {
    console.log(`[sync-landings] updated ${updated} product(s)`);
  }
  return updated;
}
