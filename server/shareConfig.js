/** 分享平台与默认模板（服务端） */
export const SHARE_PLATFORMS = [
  {
    id: "douyin",
    name: "抖音",
    tip: "短平快钩子 + 话题标签，适合图文/口播",
    defaultTemplate:
      "刚刚刷到一个超好用的作品：{name}\n{tagline}，真的好用到想码住！\n{tags}\n{url}",
  },
  {
    id: "wechat",
    name: "微信",
    tip: "口语安利风，适合聊天转发和朋友圈",
    defaultTemplate:
      "给你安利一个作品：{name}\n{tagline}\n点击查看：{url}\n感兴趣的话可以点开看看～",
  },
  {
    id: "xiaohongshu",
    name: "小红书",
    tip: "种草笔记结构 + 话题，适合图文发布",
    defaultTemplate:
      "✨ 发现一个宝藏作品｜{name}\n\n1. 亮点：{tagline}\n2. 适合：独立开发者 / 产品爱好者 / 想找灵感的朋友\n3. 种草理由：开箱即用，社区能直接体验和交流\n\n{tags}\n传送门：{url}",
  },
  {
    id: "link",
    name: "原链接",
    tip: "仅复制作品原链接",
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
        enabled: true,
        template: p.defaultTemplate,
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
    platforms[meta.id] = {
      enabled: fromInput ? fromInput.enabled !== false : true,
      template: String(
        fromInput?.template != null && String(fromInput.template).trim()
          ? fromInput.template
          : meta.defaultTemplate,
      ),
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
