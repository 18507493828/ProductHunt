/** 构建场景 / 话题 / 工具默认配置（运营后台可改） */

export const DEFAULT_BUILD_SCENES = [
  {
    id: "campus",
    emoji: "🎓",
    name: "校园",
    enabled: true,
    sort: 1,
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
    enabled: true,
    sort: 2,
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
    enabled: true,
    sort: 3,
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
    enabled: true,
    sort: 4,
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
    enabled: true,
    sort: 5,
    topics: [
      "周末徒步组队",
      "露营装备清单",
      "城市骑行路线",
      "郊野天气雷达",
      "露营美食菜单",
    ],
  },
];

export const DEFAULT_BUILD_TOOLS = [
  {
    id: "madao",
    name: "华为码道",
    emoji: "🔥",
    desc: "华为云开发者工具 · 本期活动赞助",
    downloadUrl:
      "https://developer.huaweicloud.com/codeartsco.html?source=dmzntgwltcsdn1&sourcead=dmzntgwltcsdncpd1",
    inviteCode: "CSDN-MD-004",
    deployId: "huawei",
    recommended: false,
    sponsored: true,
    incentive: 9.9,
    enabled: true,
    sort: 1,
  },
  {
    id: "workbuddy",
    name: "WorkBuddy",
    emoji: "🤖",
    desc: "腾讯生态 AI 智能体，对话式全流程构建，适合快速出原型",
    downloadUrl: "https://www.workbuddy.cn/?fromSource=CSDNsmc",
    inviteCode: "CSDN-WB-001",
    deployId: "tencent",
    recommended: true,
    sponsored: false,
    incentive: 0,
    enabled: true,
    sort: 2,
  },
  {
    id: "trae",
    name: "Trae Work",
    emoji: "🧑‍💻",
    desc: "字节 AI IDE，面向工程化开发，适合有代码基础的构建者",
    downloadUrl: "https://www.trae.ai/download?fromSource=CSDNsmc",
    inviteCode: "CSDN-TR-002",
    deployId: "volcano",
    recommended: false,
    sponsored: false,
    incentive: 0,
    enabled: true,
    sort: 3,
  },
  {
    id: "qwen",
    name: "千问 Work",
    emoji: "✨",
    desc: "阿里通义生态，模板与插件丰富，多端适配",
    downloadUrl:
      "https://b.qianwen.com/apps/qkhomepage_twofoufeb/routes/l5Utxkrh6",
    inviteCode: "CSDN-QW-003",
    deployId: "aliyun",
    recommended: false,
    sponsored: false,
    incentive: 0,
    enabled: true,
    sort: 4,
  },
];

/** 云部署厂商（构建向导最后一步；激励文案运营可配） */
export const DEFAULT_BUILD_DEPLOYS = [
  {
    id: "tencent",
    name: "腾讯云",
    emoji: "",
    desc: "云服务器、云开发与 Serverless，适合快速上线 Web 应用",
    url: "https://partner.cloud.tencent.com/invitation/10003541998365ba1b6492d43?inviteType=2",
    promo: "限时5折",
    promoDesc:
      "通过活动通道开通，云服务器等产品享限时 5 折优惠（以官网活动页为准）",
    enabled: true,
    sort: 1,
  },
  {
    id: "huawei",
    name: "华为云",
    emoji: "",
    desc: "弹性云服务器与 CodeArts，与华为码道生态衔接",
    url: "https://www.huaweicloud.com/product/ecs.html?fromSource=CSDNsmc",
    promo: "限时免费",
    promoDesc:
      "新用户可通过活动通道领取限时免费体验额度（以官网活动页为准）",
    enabled: true,
    sort: 2,
  },
  {
    id: "aliyun",
    name: "阿里云",
    emoji: "",
    desc: "ECS / 函数计算 / 静态托管，部署模板丰富",
    url: "https://www.aliyun.com/product/ecs?fromSource=CSDNsmc",
    promo: "限时5折",
    promoDesc: "活动通道下单 ECS 等产品享限时 5 折优惠（以官网活动页为准）",
    enabled: true,
    sort: 3,
  },
  {
    id: "volcano",
    name: "火山引擎",
    emoji: "",
    desc: "字节跳动云与 AI 基础设施，适合内容与推荐类应用",
    url: "https://www.volcengine.com/product/ecs?fromSource=CSDNsmc",
    promo: "限时免费",
    promoDesc:
      "新用户可通过活动通道领取限时免费云资源体验（以官网活动页为准）",
    enabled: true,
    sort: 4,
  },
];

const TOOL_DEFAULT_DEPLOY = {
  madao: "huawei",
  workbuddy: "tencent",
  trae: "volcano",
  qwen: "aliyun",
};

function slugify(text, fallback = "item") {
  const raw = String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u4e00-\u9fa5-]/gi, "")
    .slice(0, 48);
  return raw || fallback;
}

function normalizeTopic(raw, index = 0) {
  if (typeof raw === "string") {
    const name = raw.trim();
    return {
      id: slugify(name, `topic-${index + 1}`),
      name,
      enabled: true,
      sort: index + 1,
    };
  }
  const input = raw && typeof raw === "object" ? raw : {};
  const name = String(input.name || "").trim();
  return {
    id: String(input.id || slugify(name, `topic-${index + 1}`)).trim(),
    name,
    enabled: input.enabled !== false,
    sort: Number.isFinite(Number(input.sort)) ? Number(input.sort) : index + 1,
  };
}

function normalizeScene(raw, index = 0) {
  const input = raw && typeof raw === "object" ? raw : {};
  const topics = Array.isArray(input.topics)
    ? input.topics.map((t, i) => normalizeTopic(t, i)).filter((t) => t.name)
    : [];
  return {
    id: String(input.id || slugify(input.name, `scene-${index + 1}`)).trim(),
    emoji: String(input.emoji || "📌").trim() || "📌",
    name: String(input.name || "").trim(),
    enabled: input.enabled !== false,
    sort: Number.isFinite(Number(input.sort)) ? Number(input.sort) : index + 1,
    topics,
  };
}

function normalizeTool(raw, index = 0) {
  const input = raw && typeof raw === "object" ? raw : {};
  const incentive = Number(input.incentive);
  const id = String(input.id || slugify(input.name, `tool-${index + 1}`)).trim();
  let downloadUrl = String(input.downloadUrl || "").trim();
  // 旧默认下载链自动升级到最新运营链接（自定义其它地址不覆盖）
  const legacyUrls = {
    workbuddy: ["https://www.workbuddy.cn/download"],
    trae: ["https://www.trae.ai/download"],
    qwen: ["https://qwen.aliyun.com/workbench"],
  };
  const latest = DEFAULT_BUILD_TOOLS.find((t) => t.id === id);
  if (latest && (legacyUrls[id] || []).includes(downloadUrl)) {
    downloadUrl = latest.downloadUrl;
  }
  return {
    id,
    name: String(input.name || "").trim(),
    emoji: String(input.emoji || "🛠️").trim() || "🛠️",
    desc: String(input.desc || "")
      .trim()
      .replace(/官方赞助/g, "活动赞助"),
    downloadUrl,
    inviteCode: String(input.inviteCode || "").trim(),
    deployId:
      String(input.deployId || "").trim() || TOOL_DEFAULT_DEPLOY[id] || "",
    recommended: Boolean(input.recommended),
    sponsored: Boolean(input.sponsored),
    incentive: Number.isFinite(incentive) && incentive >= 0 ? incentive : 0,
    enabled: input.enabled !== false,
    sort:
      id === "madao"
        ? 0
        : Number.isFinite(Number(input.sort))
          ? Number(input.sort)
          : index + 1,
  };
}

function normalizeDeploy(raw, index = 0) {
  const input = raw && typeof raw === "object" ? raw : {};
  const id = String(input.id || slugify(input.name, `deploy-${index + 1}`)).trim();
  const fallback = DEFAULT_BUILD_DEPLOYS.find((d) => d.id === id);
  return {
    id,
    name: String(input.name || fallback?.name || "").trim(),
    emoji: String(input.emoji || fallback?.emoji || "").trim(),
    desc: String(input.desc || fallback?.desc || "").trim(),
    url: String(input.url || fallback?.url || "").trim(),
    logoUrl: String(input.logoUrl || fallback?.logoUrl || "").trim(),
    promo: String(input.promo ?? fallback?.promo ?? "").trim(),
    promoDesc: String(input.promoDesc ?? fallback?.promoDesc ?? "").trim(),
    enabled: input.enabled !== false,
    sort: Number.isFinite(Number(input.sort))
      ? Number(input.sort)
      : fallback?.sort || index + 1,
  };
}

export function normalizeBuildConfig(raw) {
  const input = raw && typeof raw === "object" ? raw : {};
  const scenesSource = Array.isArray(input.scenes)
    ? input.scenes
    : DEFAULT_BUILD_SCENES;
  const toolsSource = Array.isArray(input.tools)
    ? input.tools
    : DEFAULT_BUILD_TOOLS;
  const deploysSource = Array.isArray(input.deploys)
    ? input.deploys
    : DEFAULT_BUILD_DEPLOYS;
  const scenes = scenesSource
    .map((s, i) => normalizeScene(s, i))
    .filter((s) => s.name)
    .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, "zh"));
  const tools = toolsSource
    .map((t, i) => normalizeTool(t, i))
    .filter((t) => t.name)
    .sort((a, b) => {
      const aFirst = a.id === "madao" ? 0 : 1;
      const bFirst = b.id === "madao" ? 0 : 1;
      if (aFirst !== bFirst) return aFirst - bFirst;
      return a.sort - b.sort || a.name.localeCompare(b.name, "zh");
    });
  const deploys = deploysSource
    .map((d, i) => normalizeDeploy(d, i))
    .filter((d) => d.name)
    .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, "zh"));
  return { scenes, tools, deploys };
}

export const DEFAULT_BUILD_CONFIG = normalizeBuildConfig({
  scenes: DEFAULT_BUILD_SCENES,
  tools: DEFAULT_BUILD_TOOLS,
  deploys: DEFAULT_BUILD_DEPLOYS,
});

/** 前台可用：仅返回启用中的场景 / 话题 / 工具 / 云部署 */
export function publicBuildConfig(config) {
  const normalized = normalizeBuildConfig(config);
  return {
    scenes: normalized.scenes
      .filter((s) => s.enabled)
      .map((s) => ({
        ...s,
        topics: s.topics
          .filter((t) => t.enabled)
          .sort((a, b) => a.sort - b.sort)
          .map((t) => t.name),
      })),
    tools: normalized.tools.filter((t) => t.enabled),
    deploys: normalized.deploys.filter((d) => d.enabled),
  };
}

export function inferSceneNameFromConfig(product, topicName = "", scenes = []) {
  const hay = [
    topicName,
    product?.topicName,
    product?.name,
    product?.tagline,
    product?.description,
  ]
    .filter(Boolean)
    .join("\n");
  const list = Array.isArray(scenes) && scenes.length ? scenes : DEFAULT_BUILD_SCENES;
  for (const scene of list) {
    const topics = (scene.topics || []).map((t) =>
      typeof t === "string" ? t : t.name,
    );
    for (const topic of topics) {
      if (topic && hay.includes(topic)) return scene.name;
    }
  }
  for (const scene of list) {
    if (scene.name && hay.includes(scene.name)) return scene.name;
  }
  return "其他";
}
