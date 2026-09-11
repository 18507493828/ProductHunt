/** 分享平台：与 Demo 霸榜渠道对齐 */
export const SHARE_PLATFORMS = [
  {
    id: "xiaohongshu",
    name: "小红书",
    tip: "种草笔记 · 回流 ×1.2",
    defaultTemplate:
      "✨ 发现一个宝藏作品｜{name}\n\n1. 亮点：{tagline}\n2. 适合：独立开发者 / 产品爱好者 / 想找灵感的朋友\n3. 种草理由：开箱即用，社区能直接体验和交流\n\n{tags}\n传送门：{url}",
  },
  {
    id: "douyin",
    name: "抖音",
    tip: "短视频挂载 · 回流 ×1.5",
    defaultTemplate:
      "刚刚刷到一个超好用的作品：{name}\n{tagline}，真的好用到想码住！\n{tags}\n{url}",
  },
  {
    id: "wechat",
    name: "微信朋友圈",
    tip: "海报分享 · 回流 ×1.0",
    defaultTemplate:
      "给你安利一个作品：{name}\n{tagline}\n点击查看：{url}\n感兴趣的话可以点开看看～",
  },
  {
    id: "csdn",
    name: "CSDN 我的博客",
    tip: "构建复盘 · 权重 ×2",
    defaultTemplate:
      "【应用推荐】{name}\n\n一句话：{tagline}\n\n我在码上创 vibe building 应用广场体验了这个作品，适合开发者关注与二次创作。\n体验链接：{url}\n{tags}",
  },
  {
    id: "link",
    name: "原链接",
    tip: "仅复制作品原链接",
    defaultTemplate: "{url}",
  },
];

export const SHARE_PLATFORM_IDS = SHARE_PLATFORMS.map((p) => p.id);

export function getSharePlatformMeta(id) {
  return SHARE_PLATFORMS.find((p) => p.id === id) || null;
}

export function platformLabel(id) {
  return getSharePlatformMeta(id)?.name || id || "未知";
}
