/** 作品评分维度：等权，各 1–5 星（与 server/ratingDimensions.js 保持一致） */
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

export function overallFromRatings(ratings) {
  if (!ratings || typeof ratings !== "object") return 0;
  const values = RATING_DIMENSION_KEYS.map((key) => Number(ratings[key])).filter(
    (v) => Number.isFinite(v) && v >= 1 && v <= 5,
  );
  if (values.length !== RATING_DIMENSION_KEYS.length) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

export function isCompleteRatings(ratings) {
  if (!ratings || typeof ratings !== "object") return false;
  return RATING_DIMENSION_KEYS.every((key) => {
    const score = Number(ratings[key]);
    return Number.isInteger(score) && score >= 1 && score <= 5;
  });
}
