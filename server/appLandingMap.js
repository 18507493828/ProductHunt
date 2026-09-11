/**
 * 样例应用：名称 → 部署落地页 / 形态
 * 从 sceneSeedData 派生，避免两处清单不一致
 */
import { SEED_APPS, appDeployUrl } from "./sceneSeedData.js";

export const APP_LANDING_BY_NAME = Object.fromEntries(
  SEED_APPS.flatMap((block) =>
    block.apps.map((app) => [
      app.name,
      { slug: app.slug, platform: app.platform || "h5" },
    ]),
  ),
);

export function landingUrl(slug) {
  return appDeployUrl(slug);
}
