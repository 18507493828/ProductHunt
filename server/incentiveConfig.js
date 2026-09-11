/** 榜单激励系统默认配置（运营端可改） */

export const DEFAULT_INCENTIVE_CONFIG = {
  type: "mixed", // point | cash | mixed
  weekTop1: 100,
  weekTop2: 50,
  weekTop3: 30,
  monthTop1: 300,
  quarterTop1: 1000,
  maodao: 9.9,
  pool: 50000,
  paid: 18420,
};

export function normalizeIncentiveConfig(raw) {
  const input = raw && typeof raw === "object" ? raw : {};
  const type = ["point", "cash", "mixed"].includes(input.type)
    ? input.type
    : DEFAULT_INCENTIVE_CONFIG.type;
  const num = (v, fallback) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };
  return {
    type,
    weekTop1: num(input.weekTop1, DEFAULT_INCENTIVE_CONFIG.weekTop1),
    weekTop2: num(input.weekTop2, DEFAULT_INCENTIVE_CONFIG.weekTop2),
    weekTop3: num(input.weekTop3, DEFAULT_INCENTIVE_CONFIG.weekTop3),
    monthTop1: num(input.monthTop1, DEFAULT_INCENTIVE_CONFIG.monthTop1),
    quarterTop1: num(input.quarterTop1, DEFAULT_INCENTIVE_CONFIG.quarterTop1),
    maodao: num(input.maodao, DEFAULT_INCENTIVE_CONFIG.maodao),
    pool: num(input.pool, DEFAULT_INCENTIVE_CONFIG.pool),
    paid: num(input.paid, DEFAULT_INCENTIVE_CONFIG.paid),
  };
}
