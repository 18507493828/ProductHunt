export const PRODUCT_CATEGORIES = [
  "校园",
  "社交",
  "公益",
  "健身",
  "户外",
  "其他",
];

/** 分类种子：与构建场景对齐（客户端广场筛选同源） */
export const DEFAULT_CATEGORIES = [
  { id: "scene-campus", name: "校园", sort: 1, enabled: true },
  { id: "scene-social", name: "社交", sort: 2, enabled: true },
  { id: "scene-charity", name: "公益", sort: 3, enabled: true },
  { id: "scene-fitness", name: "健身", sort: 4, enabled: true },
  { id: "scene-outdoor", name: "户外", sort: 5, enabled: true },
  { id: "cat-other", name: "其他", sort: 99, enabled: true },
];

export const DEFAULT_CATEGORY = "其他";

/** 活动种子（可在后台配置启停与文案） */
export const DEFAULT_CAMPAIGNS = [
  {
    id: "madao",
    title: "码道创作活动",
    rankLabel: "码道活动",
    description:
      "面向码道创作者的作品征集活动。提交你的工具、开源项目或创意应用，接受社区投票，让好作品被更多人看见。",
    coverImage: "",
    timeText: "长期开放 · 按月评选",
    rules:
      "1. 作品需为本人原创或已获授权\n2. 发布时选择「码道创作活动」\n3. 遵守社区规范，禁止搬运与刷票\n4. 优质作品将进入活动专区与热门榜单推荐",
    rewards:
      "社区曝光推荐、活动专区置顶展示、月度优质创作者荣誉与周边礼品（以当期公告为准）",
    enabled: true,
    sort: 1,
  },
  {
    id: "1024",
    title: "1024程序员活动",
    rankLabel: "1024活动",
    description:
      "1024 程序员节主题活动。欢迎提交开源项目、开发工具与创意应用，和社区一起庆祝创造与分享。",
    coverImage: "",
    timeText: "每年 10 月主题征集 · 详见当期公告",
    rules:
      "1. 作品需与开发者创作相关\n2. 发布时选择「1024程序员活动」\n3. 内容需可公开访问并提供简介\n4. 活动作品将按活动聚合展示，便于社区发现与投票",
    rewards:
      "活动专区集中曝光、热门榜单加权展示、优秀作品证书与社区周边（以当期公告为准）",
    enabled: true,
    sort: 2,
  },
];

/** 首页活动专区容器配置 */
export const DEFAULT_CAMPAIGN_ZONE = {
  title: "活动专区",
  enabled: true,
};
