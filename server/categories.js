export const PRODUCT_CATEGORIES = [
  "AI 工具",
  "开发工具",
  "开源项目",
  "效率办公",
  "设计创意",
  "学习教育",
  "生活娱乐",
  "企业服务",
  "硬件设备",
  "其他",
];

/** 分类种子（可在后台增删改、排序、启停） */
export const DEFAULT_CATEGORIES = PRODUCT_CATEGORIES.map((name, index) => ({
  id: `cat-${index + 1}`,
  name,
  sort: index + 1,
  enabled: true,
}));

export const DEFAULT_CATEGORY = "其他";

/** 活动种子（可在后台配置启停与文案） */
export const DEFAULT_CAMPAIGNS = [
  {
    id: "madao",
    title: "码道创作活动",
    rankLabel: "码道活动",
    enabled: true,
    sort: 1,
  },
  {
    id: "1024",
    title: "1024程序员活动",
    rankLabel: "1024活动",
    enabled: true,
    sort: 2,
  },
];
