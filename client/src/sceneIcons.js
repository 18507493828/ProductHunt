import {
  Baby,
  BookOpen,
  Briefcase,
  Building2,
  Car,
  Clapperboard,
  Code2,
  Coffee,
  Dumbbell,
  Gamepad2,
  GraduationCap,
  HeartHandshake,
  Home,
  Landmark,
  MessagesSquare,
  Mountain,
  Music,
  Palette,
  PawPrint,
  Pin,
  Plane,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";

/** 默认场景 id → 图标 */
export const SCENE_ICONS = {
  campus: GraduationCap,
  social: MessagesSquare,
  charity: HeartHandshake,
  fitness: Dumbbell,
  outdoor: Mountain,
};

/** 精确场景名 → 图标 */
const SCENE_ICONS_BY_NAME = {
  校园: GraduationCap,
  社交: MessagesSquare,
  公益: HeartHandshake,
  健身: Dumbbell,
  户外: Mountain,
};

/**
 * 关键词匹配：名称/id 包含任一关键词即命中。
 * 顺序靠前优先，避免「教育游戏」这类组合误配。
 */
const SCENE_ICON_KEYWORDS = [
  { icon: Gamepad2, keywords: ["游戏", "电竞", "game", "gaming", "esport"] },
  {
    icon: GraduationCap,
    keywords: ["k12", "校园", "学校", "教育", "培训", "学习", "课程", "campus", "edu", "school"],
  },
  { icon: Baby, keywords: ["母婴", "育儿", "儿童", "幼儿", "亲子"] },
  { icon: BookOpen, keywords: ["阅读", "图书", "知识", "文档", "笔记"] },
  { icon: Briefcase, keywords: ["职场", "办公", "工作", "招聘", "hr", "office", "work"] },
  { icon: Building2, keywords: ["企业", "商业", "b2b", "saas"] },
  { icon: Car, keywords: ["汽车", "出行", "交通", "停车", "车"] },
  { icon: Clapperboard, keywords: ["影视", "视频", "短剧", "直播", "media", "video"] },
  { icon: Code2, keywords: ["开发", "编程", "技术", "代码", "dev", "code", "ai"] },
  { icon: Coffee, keywords: ["咖啡", "茶饮", "休闲"] },
  { icon: Dumbbell, keywords: ["健身", "运动", "体育", "跑步", "瑜伽", "fitness", "sport"] },
  { icon: HeartHandshake, keywords: ["公益", "志愿", "慈善", "捐赠", "charity"] },
  { icon: Home, keywords: ["家居", "生活", "家庭", "居住", "life"] },
  { icon: Landmark, keywords: ["政务", "政府", "银行", "金融", "finance"] },
  { icon: MessagesSquare, keywords: ["社交", "社区", "交友", "聊天", "social"] },
  { icon: Mountain, keywords: ["户外", "徒步", "露营", "旅行", "旅游", "outdoor", "travel"] },
  { icon: Music, keywords: ["音乐", "歌曲", "播客", "music"] },
  { icon: Palette, keywords: ["设计", "创意", "艺术", "绘画", "design"] },
  { icon: PawPrint, keywords: ["宠物", "萌宠", "猫", "狗", "pet"] },
  { icon: Plane, keywords: ["航空", "机票", "出差"] },
  { icon: ShoppingBag, keywords: ["电商", "购物", "零售", "商城", "shop", "电商"] },
  { icon: Stethoscope, keywords: ["医疗", "健康", "医院", "养生", "health", "医"] },
  { icon: UtensilsCrossed, keywords: ["餐饮", "美食", "做饭", "菜谱", "food"] },
  { icon: Wallet, keywords: ["支付", "理财", "钱包", "消费"] },
  { icon: Sparkles, keywords: ["创意", "灵感", "趣味"] },
];

/** 未知场景按名称稳定散列，避免全部落成同一个 Pin */
const FALLBACK_ICONS = [
  Sparkles,
  BookOpen,
  Coffee,
  Palette,
  Music,
  Code2,
  ShoppingBag,
  Home,
  Briefcase,
  Landmark,
];

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

function hashKey(value) {
  let hash = 0;
  const text = String(value || "");
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function matchKeywordIcon(text) {
  const key = normalizeKey(text);
  if (!key) return null;
  for (const entry of SCENE_ICON_KEYWORDS) {
    if (entry.keywords.some((word) => key.includes(normalizeKey(word)))) {
      return entry.icon;
    }
  }
  return null;
}

function resolveSceneIcon(...candidates) {
  for (const raw of candidates) {
    const key = String(raw || "").trim();
    if (!key) continue;
    if (SCENE_ICONS[key]) return SCENE_ICONS[key];
    if (SCENE_ICONS_BY_NAME[key]) return SCENE_ICONS_BY_NAME[key];
  }

  for (const raw of candidates) {
    const matched = matchKeywordIcon(raw);
    if (matched) return matched;
  }

  const seed = candidates.find((item) => String(item || "").trim()) || "scene";
  return FALLBACK_ICONS[hashKey(normalizeKey(seed)) % FALLBACK_ICONS.length] || Pin;
}

/**
 * 按场景 id / 名称自动匹配图标。
 * 支持传入字符串，或 { id, name } 对象（推荐，避免 user-scene-xxx 这类 id 丢名称）。
 */
export function getSceneIcon(sceneIdOrNameOrScene) {
  if (sceneIdOrNameOrScene && typeof sceneIdOrNameOrScene === "object") {
    return resolveSceneIcon(sceneIdOrNameOrScene.id, sceneIdOrNameOrScene.name);
  }
  return resolveSceneIcon(sceneIdOrNameOrScene);
}
