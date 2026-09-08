/** 作品评分维度：等权，各 1–5 星 */
export const RATING_DIMENSIONS = [
  { key: "creativity", label: "创意性" },
  { key: "completeness", label: "完成度" },
  { key: "usefulness", label: "实用性" },
  { key: "experience", label: "体验感" },
];

export const RATING_DIMENSION_KEYS = RATING_DIMENSIONS.map((d) => d.key);

export const RATING_TIPS = ["很差", "较差", "一般", "满意", "非常满意"];

export function emptyRatings() {
  return Object.fromEntries(RATING_DIMENSION_KEYS.map((key) => [key, 0]));
}

/** Normalize one user's rating: object of dims or legacy single number → { key: 1-5 } or null */
export function normalizeUserRatings(raw) {
  if (raw == null) return null;

  if (typeof raw === "number" || typeof raw === "string") {
    const score = Number(raw);
    if (!Number.isInteger(score) || score < 1 || score > 5) return null;
    return Object.fromEntries(RATING_DIMENSION_KEYS.map((key) => [key, score]));
  }

  if (typeof raw !== "object") return null;

  const out = {};
  for (const key of RATING_DIMENSION_KEYS) {
    const score = Number(raw[key]);
    if (!Number.isInteger(score) || score < 1 || score > 5) return null;
    out[key] = score;
  }
  return out;
}

export function overallFromRatings(ratings) {
  const normalized = normalizeUserRatings(ratings);
  if (!normalized) return 0;
  const sum = RATING_DIMENSION_KEYS.reduce((acc, key) => acc + normalized[key], 0);
  return Math.round((sum / RATING_DIMENSION_KEYS.length) * 10) / 10;
}

export function parseVotePayload(body) {
  if (!body || typeof body !== "object") return null;
  if (body.ratings != null) return normalizeUserRatings(body.ratings);
  if (body.rating != null) return normalizeUserRatings(body.rating);
  return null;
}
