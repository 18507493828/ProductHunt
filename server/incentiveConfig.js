/** 榜单激励系统默认配置（运营端可改） */

export const DEFAULT_INCENTIVE_CONFIG = {
  type: "mixed", // point | cash | mixed
  weekTop1: 100,
  weekTop2: 50,
  weekTop3: 30,
  weekTop4to10: 10,
  monthTop1: 300,
  monthTop2: 150,
  monthTop3: 80,
  monthTop4to10: 20,
  quarterTop1: 1000,
  quarterTop2: 500,
  quarterTop3: 200,
  quarterTop4to10: 50,
  maodao: 9.9,
  pool: 50000,
  paid: 18420,
  // 首页激励文案；可用 {weekTop1}{monthTop1}{quarterTop1}{maodao} 等占位符
  heroCopy:
    "本期激励：冲周榜最高可得 ¥{weekTop1}，月榜 ¥{monthTop1}，季榜 ¥{quarterTop1}；选用华为码道构建并成功发布，还可再领 ¥{maodao} 活动激励。",
};

function num(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function normalizeIncentiveConfig(raw) {
  const input = raw && typeof raw === "object" ? raw : {};
  const type = ["point", "cash", "mixed"].includes(input.type)
    ? input.type
    : DEFAULT_INCENTIVE_CONFIG.type;
  const d = DEFAULT_INCENTIVE_CONFIG;
  const heroCopy = String(input.heroCopy ?? d.heroCopy)
    .trim()
    .slice(0, 500);
  return {
    type,
    weekTop1: num(input.weekTop1, d.weekTop1),
    weekTop2: num(input.weekTop2, d.weekTop2),
    weekTop3: num(input.weekTop3, d.weekTop3),
    weekTop4to10: num(input.weekTop4to10, d.weekTop4to10),
    monthTop1: num(input.monthTop1, d.monthTop1),
    monthTop2: num(input.monthTop2, d.monthTop2),
    monthTop3: num(input.monthTop3, d.monthTop3),
    monthTop4to10: num(input.monthTop4to10, d.monthTop4to10),
    quarterTop1: num(input.quarterTop1, d.quarterTop1),
    quarterTop2: num(input.quarterTop2, d.quarterTop2),
    quarterTop3: num(input.quarterTop3, d.quarterTop3),
    quarterTop4to10: num(input.quarterTop4to10, d.quarterTop4to10),
    maodao: num(input.maodao, d.maodao),
    pool: num(input.pool, d.pool),
    paid: num(input.paid, d.paid),
    heroCopy: heroCopy || d.heroCopy,
  };
}

/** 渲染首页激励文案（替换金额占位符） */
export function renderIncentiveHeroCopy(config) {
  const c = normalizeIncentiveConfig(config);
  return String(c.heroCopy || DEFAULT_INCENTIVE_CONFIG.heroCopy).replace(
    /\{(weekTop1|weekTop2|weekTop3|weekTop4to10|monthTop1|monthTop2|monthTop3|monthTop4to10|quarterTop1|quarterTop2|quarterTop3|quarterTop4to10|maodao|pool|paid)\}/g,
    (_, key) => String(c[key] ?? ""),
  );
}

/** 按周期返回 Top1–10 激励金额数组（长度 10） */
export function periodRewardAmounts(period, config) {
  const c = normalizeIncentiveConfig(config);
  const map = {
    week: [c.weekTop1, c.weekTop2, c.weekTop3, c.weekTop4to10],
    month: [c.monthTop1, c.monthTop2, c.monthTop3, c.monthTop4to10],
    quarter: [c.quarterTop1, c.quarterTop2, c.quarterTop3, c.quarterTop4to10],
  };
  const [t1, t2, t3, rest] = map[period] || map.week;
  return Array.from({ length: 10 }, (_, i) => {
    if (i === 0) return Number(t1) || 0;
    if (i === 1) return Number(t2) || 0;
    if (i === 2) return Number(t3) || 0;
    return Number(rest) || 0;
  });
}
