/** 我要构建：场景 → 话题 → 工具（内容对齐 Demo；可由运营后台动态覆盖） */

export const BUILD_SCENES = [
  {
    id: "campus",
    emoji: "🎓",
    name: "校园",
    topics: [
      "校园二手书买卖",
      "校园篮球搭子",
      "校园周边餐厅团购",
      "社团活动一键组局",
      "失物招领雷达",
    ],
  },
  {
    id: "social",
    emoji: "💬",
    name: "社交",
    topics: [
      "周末饭搭子组局",
      "剧本杀狼人杀组局",
      "同城观影搭子",
      "宠物遛弯社交圈",
    ],
  },
  {
    id: "charity",
    emoji: "🌱",
    name: "公益",
    topics: [
      "旧物捐赠地图",
      "志愿时长记账本",
      "社区旧物置换角",
      "流浪动物救助台",
      "无障碍出行助手",
    ],
  },
  {
    id: "fitness",
    emoji: "💪",
    name: "健身",
    topics: [
      "健身房私教搭子",
      "食堂热量识别",
      "跑步路线推荐",
      "居家跟练打卡",
      "体测满分计划",
    ],
  },
  {
    id: "outdoor",
    emoji: "⛰️",
    name: "户外",
    topics: [
      "周末徒步组队",
      "露营装备清单",
      "城市骑行路线",
      "郊野天气雷达",
      "露营美食菜单",
    ],
  },
];

export const BUILD_TOOLS = [
  {
    id: "workbuddy",
    name: "WorkBuddy",
    emoji: "🤖",
    desc: "腾讯生态 AI 智能体，对话式全流程构建，适合快速出原型",
    downloadUrl: "https://www.workbuddy.cn/download",
    inviteCode: "CSDN-WB-001",
    recommended: true,
    sponsored: false,
  },
  {
    id: "trae",
    name: "Trae Work",
    emoji: "🧑‍💻",
    desc: "字节 AI IDE，面向工程化开发，适合有代码基础的构建者",
    downloadUrl: "https://www.trae.ai/download",
    inviteCode: "CSDN-TR-002",
    sponsored: false,
  },
  {
    id: "qwen",
    name: "千问 Work",
    emoji: "✨",
    desc: "阿里通义生态，模板与插件丰富，多端适配",
    downloadUrl: "https://qwen.aliyun.com/workbench",
    inviteCode: "CSDN-QW-003",
    sponsored: false,
  },
  {
    id: "madao",
    name: "华为码道",
    emoji: "🔥",
    desc: "华为云开发者工具 · 本期官方赞助",
    downloadUrl:
      "https://developer.huaweicloud.com/codeartsco.html?source=dmzntgwltcsdn1&sourcead=dmzntgwltcsdncpd1",
    inviteCode: "CSDN-MD-004",
    sponsored: true,
    incentive: 9.9,
  },
];

/** 运行时目录（后台配置可覆盖默认值，界面结构不变） */
let runtimeScenes = BUILD_SCENES;
let runtimeTools = BUILD_TOOLS;
const listeners = new Set();

function notifyBuildCatalog() {
  listeners.forEach((fn) => {
    try {
      fn({ scenes: runtimeScenes, tools: runtimeTools });
    } catch {
      /* ignore */
    }
  });
}

export function getBuildScenes() {
  return runtimeScenes;
}

export function getBuildTools() {
  return runtimeTools;
}

export function subscribeBuildCatalog(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function applyBuildConfig(config) {
  if (Array.isArray(config?.scenes)) {
    runtimeScenes = config.scenes.map((s) => ({
      id: s.id,
      emoji: s.emoji || "📌",
      name: s.name,
      topics: Array.isArray(s.topics)
        ? s.topics.map((t) => (typeof t === "string" ? t : t.name)).filter(Boolean)
        : [],
    }));
  }
  if (Array.isArray(config?.tools)) {
    runtimeTools = config.tools.map((t) => ({
      id: t.id,
      name: t.name,
      emoji: t.emoji || "🛠️",
      desc: t.desc || "",
      downloadUrl: t.downloadUrl || "",
      inviteCode: t.inviteCode || "",
      recommended: Boolean(t.recommended),
      sponsored: Boolean(t.sponsored),
      incentive: Number(t.incentive) || 0,
    }));
  }
  notifyBuildCatalog();
  return { scenes: runtimeScenes, tools: runtimeTools };
}

export function getSponsoredIncentive() {
  const sponsored = runtimeTools.find((t) => t.sponsored && t.incentive > 0);
  return sponsored?.incentive ?? 0;
}

export function getSceneById(id) {
  return runtimeScenes.find((s) => s.id === id) || null;
}

export function getToolById(id) {
  return runtimeTools.find((t) => t.id === id) || null;
}

export function inferSceneIdFromText(text) {
  const hay = String(text || "");
  for (const scene of runtimeScenes) {
    for (const topic of scene.topics) {
      if (hay.includes(topic)) return scene.id;
    }
  }
  for (const scene of runtimeScenes) {
    if (hay.includes(scene.name)) return scene.id;
  }
  return "";
}

/** 综合热度分（对齐 Demo）：浏览×1 + 体验×5 + 点赞×3 + 分享回流×8 */
export function heatScore(item) {
  const views = Number(item?.viewCount) || 0;
  const likes = Number(item?.voteCount) || 0;
  const shares = Number(item?.shareCount) || 0;
  const trials = Math.round(views * 0.2);
  return views * 1 + trials * 5 + likes * 3 + shares * 8;
}

const PERIOD_WINDOW_MS = {
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
  quarter: 90 * 24 * 60 * 60 * 1000,
};

/**
 * 周期榜热度：不按提交时间硬过滤（否则周榜常空），
 * 用半衰期让近期应用在周榜更靠前，月/季衰减更缓。
 */
export function periodHeatScore(item, period = "week") {
  const base = heatScore(item);
  const stamp = new Date(
    item?.reviewedAt || item?.submittedAt || item?.updatedAt || 0,
  ).getTime();
  if (!Number.isFinite(stamp) || stamp <= 0) return base;
  const age = Math.max(0, Date.now() - stamp);
  const window = PERIOD_WINDOW_MS[period] || PERIOD_WINDOW_MS.week;
  // 半衰期约等于周期窗口的一半（周榜 ≈ 3.5 天）
  const decay = Math.pow(0.5, age / (window * 0.5));
  return Math.round(base * (0.4 + 0.6 * decay));
}

/** 与运营端榜单一致：置顶 → 权重 → 周期热度 → 点赞 */
export function compareRankItems(a, b, period = "week") {
  const aPinned = a?.rankPinned === true;
  const bPinned = b?.rankPinned === true;
  if (aPinned !== bPinned) return aPinned ? -1 : 1;

  const weightDiff = (Number(b?.rankWeight) || 0) - (Number(a?.rankWeight) || 0);
  if (weightDiff !== 0) return weightDiff;

  const heatDiff =
    periodHeatScore(b, period) - periodHeatScore(a, period);
  if (heatDiff !== 0) return heatDiff;

  return (Number(b?.voteCount) || 0) - (Number(a?.voteCount) || 0);
}

/** 广场热度排序：置顶 → 权重 → 综合热度 */
export function compareHeatItems(a, b) {
  const aPinned = a?.rankPinned === true;
  const bPinned = b?.rankPinned === true;
  if (aPinned !== bPinned) return aPinned ? -1 : 1;
  const weightDiff = (Number(b?.rankWeight) || 0) - (Number(a?.rankWeight) || 0);
  if (weightDiff !== 0) return weightDiff;
  return heatScore(b) - heatScore(a);
}

export function buildTaskBrief({ scene, topic, tool }) {
  const sceneName = scene?.name || "";
  const toolName = tool?.name || "";
  const code = tool?.inviteCode || "";
  return [
    `请为我构建一个「${topic}」主题的应用：面向${sceneName}场景的普通用户，核心功能简洁聚焦，界面友好，包含首次引导与示例数据，输出可直接体验的 Web 应用。`,
    "",
    `【场景】${sceneName}`,
    `【场景话题】${topic}`,
    `【构建工具】${toolName}`,
    code ? `【推广码】${code}` : "",
    tool?.sponsored
      ? `【赞助激励】选择「华为码道」并成功发布通过审核后，可获 ¥${tool.incentive} 现金激励（每账号限 1 次）`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

const DRAFT_KEY = "vb_build_drafts_v1";

export function loadBuildDrafts(username) {
  if (!username) return [];
  try {
    const raw = localStorage.getItem(`${DRAFT_KEY}:${username}`);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveBuildDrafts(username, drafts) {
  if (!username) return;
  localStorage.setItem(`${DRAFT_KEY}:${username}`, JSON.stringify(drafts || []));
}

export function upsertBuildDraft(username, draft) {
  const list = loadBuildDrafts(username);
  const idx = list.findIndex((d) => d.id === draft.id);
  if (idx >= 0) list[idx] = draft;
  else list.unshift(draft);
  saveBuildDrafts(username, list);
  return list;
}

export function removeBuildDraft(username, draftId) {
  const list = loadBuildDrafts(username).filter((d) => d.id !== draftId);
  saveBuildDrafts(username, list);
  return list;
}
