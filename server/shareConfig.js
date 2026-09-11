/** 分享平台与默认模板（服务端） */
export const SHARE_PLATFORMS = [
  {
    id: "douyin",
    name: "抖音",
    tip: "短平快钩子 + 话题标签，适合图文/口播",
    defaultNote: "已授权 · 回流系数 ×1.5",
    defaultRefluxWeight: 1.5,
    defaultTemplate:
      "刚刚刷到一个超好用的作品：{name}\n{tagline}，真的好用到想码住！\n{tags}\n{url}",
  },
  {
    id: "wechat",
    name: "微信朋友圈",
    tip: "口语安利风，适合聊天转发和朋友圈",
    defaultNote: "已授权 · 回流系数 ×1.0",
    defaultRefluxWeight: 1.0,
    defaultTemplate:
      "给你安利一个作品：{name}\n{tagline}\n点击查看：{url}\n感兴趣的话可以点开看看～",
  },
  {
    id: "xiaohongshu",
    name: "小红书",
    tip: "种草笔记结构 + 话题，适合图文发布",
    defaultNote: "已授权 · 回流系数 ×1.2",
    defaultRefluxWeight: 1.2,
    defaultTemplate:
      "✨ 发现一个宝藏作品｜{name}\n\n1. 亮点：{tagline}\n2. 适合：独立开发者 / 产品爱好者 / 想找灵感的朋友\n3. 种草理由：开箱即用，社区能直接体验和交流\n\n{tags}\n传送门：{url}",
  },
  {
    id: "csdn",
    name: "CSDN博客",
    tip: "技术博客安利风，适合沉淀长文与教程引流",
    defaultNote: "站内渠道 · 权重加成 ×2",
    defaultRefluxWeight: 2.0,
    defaultTemplate:
      "【应用推荐】{name}\n\n一句话：{tagline}\n\n我在码上创 CodeCraft 应用广场体验了这个作品，适合开发者关注与二次创作。\n体验链接：{url}\n{tags}",
  },
  {
    id: "weibo",
    name: "微博",
    tip: "商务授权洽谈中",
    defaultNote: "商务授权洽谈中",
    defaultRefluxWeight: 1.0,
    defaultEnabled: false,
    defaultTemplate:
      "推荐一个开发者应用：{name} — {tagline}\n{url}\n{tags}",
  },
  {
    id: "bilibili",
    name: "B站",
    tip: "未开放",
    defaultNote: "未开放",
    defaultRefluxWeight: 1.0,
    defaultEnabled: false,
    defaultTemplate:
      "UP主安利：{name}\n{tagline}\n传送门：{url}\n{tags}",
  },
  {
    id: "link",
    name: "原链接",
    tip: "仅复制作品原链接",
    defaultNote: "始终可用",
    defaultRefluxWeight: 1.0,
    defaultTemplate: "{url}",
  },
];

export const SHARE_PLATFORM_IDS = SHARE_PLATFORMS.map((p) => p.id);

export function platformLabel(id) {
  return SHARE_PLATFORMS.find((p) => p.id === id)?.name || id || "未知";
}

export const DEFAULT_SHARE_CONFIG = {
  titlePrefix: "",
  footer: "",
  platforms: Object.fromEntries(
    SHARE_PLATFORMS.map((p) => [
      p.id,
      {
        enabled: p.defaultEnabled !== false,
        template: p.defaultTemplate,
        note: p.defaultNote || "",
        refluxWeight: p.defaultRefluxWeight ?? 1,
      },
    ]),
  ),
};

export function normalizeShareConfig(raw) {
  const input = raw && typeof raw === "object" ? raw : {};
  const platforms = {};
  for (const meta of SHARE_PLATFORMS) {
    const fromInput =
      input.platforms && typeof input.platforms === "object"
        ? input.platforms[meta.id]
        : null;
    const weight = Number(fromInput?.refluxWeight);
    platforms[meta.id] = {
      enabled: fromInput
        ? fromInput.enabled !== false
        : meta.defaultEnabled !== false,
      template: String(
        fromInput?.template != null && String(fromInput.template).trim()
          ? fromInput.template
          : meta.defaultTemplate,
      ),
      note: String(
        fromInput?.note != null && String(fromInput.note).trim()
          ? fromInput.note
          : meta.defaultNote || "",
      ),
      refluxWeight:
        Number.isFinite(weight) && weight > 0
          ? weight
          : meta.defaultRefluxWeight ?? 1,
    };
  }
  return {
    titlePrefix: String(input.titlePrefix || "").trim(),
    footer: String(input.footer || "").trim(),
    includeTagline: input.includeTagline !== false,
    includeUrl: input.includeUrl !== false,
    platforms,
  };
}
