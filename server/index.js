import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { PRODUCT_CATEGORIES, DEFAULT_CATEGORY } from "./categories.js";
import { TOPIC_SEED } from "./topic-seed.js";
import {
  initAuth,
  registerUser,
  loginUser,
  resetPassword,
  getUsersNicknameMap,
  getUserById,
  requireAuth,
  requireAdmin,
  attachUserIfPresent,
} from "./auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || "0.0.0.0";
const CLIENT_DIST = path.join(__dirname, "..", "client", "dist");
const STORAGE_DIR = path.join(__dirname, "storage", "products");
const UPLOADS_DIR = path.join(__dirname, "storage", "uploads");
const BANNERS_FILE = path.join(__dirname, "storage", "banners.json");
const NAVS_FILE = path.join(__dirname, "storage", "navs.json");
const TOPICS_FILE = path.join(__dirname, "storage", "topics.json");
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const RANGES = ["today", "week", "month", "all"];
const URL_PATTERN = /^https?:\/\/.+/i;
const IMAGE_URL_PATTERN = /^(https?:\/\/.+|\/uploads\/[\w.-]+)$/i;
const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const AVATAR_COLORS = [
  "#FF5722",
  "#FF7043",
  "#F4511E",
  "#E65100",
  "#FF8A65",
  "#D84315",
  "#FF6D00",
  "#BF360C",
];

const DAY_MS = 24 * 60 * 60 * 1000;

const DEFAULT_BANNERS = [
  {
    id: "banner-ai",
    title: "Agent 专家精选",
    subtitle: "发现各领域 Agent 角色与专家配置，快速接入智能助手",
    imageUrl: "/banners/banner-ai.png",
    linkUrl: "/",
    sort: 1,
    enabled: true,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "banner-dev",
    title: "技能与链接器",
    subtitle: "技能模块、MCP 工具与外部集成，扩展 Agent 能力边界",
    imageUrl: "/banners/banner-dev.png",
    linkUrl: "/",
    sort: 2,
    enabled: true,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "banner-open",
    title: "自动化模版",
    subtitle: "工作流与任务模版，一键复用成熟 Agent 编排方案",
    imageUrl: "/banners/banner-open.png",
    linkUrl: "/",
    sort: 3,
    enabled: true,
    createdAt: "",
    updatedAt: "",
  },
];

const DEFAULT_NAVS = [
  {
    id: "nav-codearts",
    title: "码道官方网站",
    url: "https://codearts.huaweicloud.com/",
    sort: 1,
    enabled: true,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "nav-csdn",
    title: "CSDN 官方社区",
    url: "https://csdn.net",
    sort: 2,
    enabled: true,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "nav-codearts-csdn",
    title: "CSDN 码道开发者社区",
    url: "https://codearts.csdn.net/",
    sort: 3,
    enabled: true,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "nav-codearts-hackathon",
    title: "码道黑客松",
    url: "https://builderx.csdn.net/activity-site/madao/hackathon/index#join",
    sort: 4,
    enabled: true,
    createdAt: "",
    updatedAt: "",
  },
];

await fs.mkdir(STORAGE_DIR, { recursive: true });
await fs.mkdir(UPLOADS_DIR, { recursive: true });
await initAuth();
await initBanners();
await initNavs();
await initTopics();

if (IS_PRODUCTION) {
  app.use(express.static(CLIENT_DIST));
}

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(UPLOADS_DIR));

const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase() || ".png";
      cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`);
    },
  }),
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (IMAGE_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("仅支持 JPG / PNG / GIF / WebP 图片"));
    }
  },
});

function pickAvatarColor(name = "") {
  const hash = [...name].reduce((acc, ch) => acc + ch.codePointAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

async function readProductFile(filePath) {
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw);
}

async function writeProductFile(product) {
  const filePath = path.join(STORAGE_DIR, `${product.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(product, null, 2), "utf-8");
}

/* ---------------- 轮播图存储 ---------------- */

async function readBanners() {
  try {
    const raw = await fs.readFile(BANNERS_FILE, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeBanners(banners) {
  await fs.writeFile(BANNERS_FILE, JSON.stringify(banners, null, 2), "utf-8");
}

async function initBanners() {
  const existing = await readBanners();
  if (existing.length > 0) return;

  const now = new Date().toISOString();
  const seed = DEFAULT_BANNERS.map((banner) => ({
    ...banner,
    createdAt: now,
    updatedAt: now,
  }));
  await writeBanners(seed);
}

function toPublicBanner(banner) {
  return {
    id: banner.id,
    title: banner.title || "",
    subtitle: banner.subtitle || "",
    imageUrl: banner.imageUrl || "",
    linkUrl: banner.linkUrl || "",
    sort: Number(banner.sort) || 0,
    enabled: banner.enabled !== false,
    createdAt: banner.createdAt || "",
    updatedAt: banner.updatedAt || "",
  };
}

async function getBannerById(id) {
  const banners = await readBanners();
  return banners.find((banner) => banner.id === id) || null;
}

/* ---------------- 导航存储 ---------------- */

async function readNavs() {
  try {
    const raw = await fs.readFile(NAVS_FILE, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeNavs(navs) {
  await fs.writeFile(NAVS_FILE, JSON.stringify(navs, null, 2), "utf-8");
}

async function initNavs() {
  const existing = await readNavs();
  if (existing.length > 0) return;

  const now = new Date().toISOString();
  const seed = DEFAULT_NAVS.map((nav) => ({
    ...nav,
    createdAt: now,
    updatedAt: now,
  }));
  await writeNavs(seed);
}

function toPublicNav(nav) {
  return {
    id: nav.id,
    title: nav.title || "",
    url: nav.url || "",
    sort: Number(nav.sort) || 0,
    enabled: nav.enabled !== false,
    createdAt: nav.createdAt || "",
    updatedAt: nav.updatedAt || "",
  };
}

async function getNavById(id) {
  const navs = await readNavs();
  return navs.find((nav) => nav.id === id) || null;
}

async function sortNavs(navs) {
  return navs.sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0));
}

/* ---------------- 话题存储 ---------------- */

async function readTopics() {
  try {
    const raw = await fs.readFile(TOPICS_FILE, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeTopics(topics) {
  await fs.writeFile(TOPICS_FILE, JSON.stringify(topics, null, 2), "utf-8");
}

async function initTopics() {
  const existing = await readTopics();
  if (existing.length > 0) return;

  const now = new Date().toISOString();
  const seed = TOPIC_SEED.map((t) => ({ ...t, createdAt: t.createdAt || now }));
  await writeTopics(seed);
}

function toPublicTopic(topic, productCount, currentUser) {
  const followerIds = Array.isArray(topic.followerIds) ? topic.followerIds : [];
  return {
    id: topic.id,
    name: topic.name || "",
    description: topic.description || "",
    coverImage: topic.coverImage || "",
    color: topic.color || pickAvatarColor(topic.name || "话题"),
    region: topic.region || "全国",
    createdBy: topic.createdBy || "",
    createdAt: topic.createdAt || "",
    followerCount: followerIds.length,
    following: currentUser ? followerIds.includes(currentUser.id) : false,
    productCount: productCount || 0,
    hotScore: followerIds.length * 10 + (productCount || 0) * 50,
  };
}

async function getTopicById(id) {
  const topics = await readTopics();
  return topics.find((topic) => topic.id === id) || null;
}

async function listProducts() {
  const entries = await fs.readdir(STORAGE_DIR, { withFileTypes: true });
  const products = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;

    try {
      const product = await readProductFile(path.join(STORAGE_DIR, entry.name));
      if (!product || !product.id) continue;
      products.push(product);
    } catch {
      // skip invalid files
    }
  }

  return products;
}

async function getProduct(id) {
  const filePath = path.join(STORAGE_DIR, `${id}.json`);
  try {
    await fs.access(filePath);
    return readProductFile(filePath);
  } catch {
    const all = await listProducts();
    const product = all.find((item) => item.id === id);
    if (!product) {
      throw new Error("NOT_FOUND");
    }
    return product;
  }
}

function getRangeStart(range) {
  const now = Date.now();

  if (range === "today") {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  if (range === "week") return now - 7 * DAY_MS;
  if (range === "month") return now - 30 * DAY_MS;
  return 0;
}

function resolveSubmitterDisplayName(product, nicknameMap) {
  if (product.submittedNickname) {
    return product.submittedNickname;
  }
  if (nicknameMap && product.submittedBy) {
    return nicknameMap[product.submittedBy] || product.submittedBy;
  }
  return product.submittedBy || "";
}

function toPublicProduct(product, currentUser, topicMap = null, nicknameMap = null) {
  const voteCount = Array.isArray(product.voters) ? product.voters.length : 0;
  const [avgRating, ratingCount] = computeRating(product);
  const topicName = topicMap && product.topicId ? (topicMap[product.topicId] || "") : "";
  return {
    id: product.id,
    name: product.name,
    tagline: product.tagline,
    description: product.description,
    url: product.url,
    category: product.category,
    topicId: product.topicId || "",
    topicName,
    imageUrl: product.imageUrl || "",
    voteCount,
    avgRating,
    ratingCount,
    votedByMe: currentUser
      ? Array.isArray(product.voters) && product.voters.includes(currentUser.id)
      : false,
    submittedBy: resolveSubmitterDisplayName(product, nicknameMap),
    submittedAt: product.submittedAt,
    status: product.status,
    rejectReason: product.rejectReason || "",
    reviewedAt: product.reviewedAt || "",
    isSpecial: product.isSpecial === true,
  };
}

function computeRating(product) {
  const ratings = product.ratings || {};
  const values = Object.values(ratings)
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v) && v >= 1 && v <= 5);
  if (!values.length) return [0, 0];
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return [Math.round(avg * 10) / 10, values.length];
}

function sortProducts(products) {
  return products.sort((a, b) => {
    const voteDiff = b.voters.length - a.voters.length;
    if (voteDiff !== 0) return voteDiff;
    return (b.submittedAt || "").localeCompare(a.submittedAt || "");
  });
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, nickname, password } = req.body || {};
    const result = await registerUser(username, nickname, password);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { username, nickname, password } = req.body || {};
    const result = await resetPassword(username, nickname, password);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const result = await loginUser(username, password);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(401).json({ error: "用户不存在" });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/category-options", (_req, res) => {
  res.json({ categories: PRODUCT_CATEGORIES });
});

/* ---------------- 轮播图 API ---------------- */

// 公开：获取启用的轮播图（按 sort 升序）
app.get("/api/banners", async (_req, res) => {
  try {
    const banners = (await readBanners())
      .filter((banner) => banner.enabled !== false)
      .sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0))
      .map(toPublicBanner);
    res.json(banners);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 管理员：获取全部轮播图
app.get("/api/admin/banners", requireAdmin, async (_req, res) => {
  try {
    const banners = (await readBanners())
      .sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0))
      .map(toPublicBanner);
    res.json(banners);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 管理员：新增轮播图
app.post("/api/admin/banners", requireAdmin, async (req, res) => {
  try {
    const { title, subtitle, imageUrl, linkUrl, sort, enabled } = req.body || {};
    const trimmedTitle = (title || "").trim();
    const trimmedImageUrl = (imageUrl || "").trim();
    const trimmedLinkUrl = (linkUrl || "").trim();

    if (!trimmedTitle) {
      return res.status(400).json({ error: "请填写轮播图标题" });
    }
    if (!trimmedImageUrl) {
      return res.status(400).json({ error: "请填写图片地址" });
    }
    if (trimmedImageUrl.length > 500) {
      return res.status(400).json({ error: "图片地址过长" });
    }
    if (trimmedLinkUrl && !URL_PATTERN.test(trimmedLinkUrl)) {
      return res.status(400).json({ error: "跳转链接需以 http:// 或 https:// 开头" });
    }

    const now = new Date().toISOString();
    const banner = {
      id: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
      title: trimmedTitle,
      subtitle: (subtitle || "").trim(),
      imageUrl: trimmedImageUrl,
      linkUrl: trimmedLinkUrl,
      sort: Number(sort) || 0,
      enabled: enabled !== false,
      createdAt: now,
      updatedAt: now,
    };

    const banners = await readBanners();
    banners.push(banner);
    await writeBanners(banners);

    res.json({ message: "轮播图已添加", banner: toPublicBanner(banner) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 管理员：更新轮播图
app.put("/api/admin/banners/:id", requireAdmin, async (req, res) => {
  try {
    const { title, subtitle, imageUrl, linkUrl, sort, enabled } = req.body || {};
    const banner = await getBannerById(req.params.id);
    if (!banner) {
      return res.status(404).json({ error: "轮播图不存在" });
    }

    const trimmedTitle = (title ?? banner.title).toString().trim();
    const trimmedImageUrl = (imageUrl ?? banner.imageUrl).toString().trim();
    const trimmedLinkUrl = (linkUrl ?? banner.linkUrl).toString().trim();

    if (!trimmedTitle) {
      return res.status(400).json({ error: "请填写轮播图标题" });
    }
    if (!trimmedImageUrl) {
      return res.status(400).json({ error: "请填写图片地址" });
    }
    if (trimmedLinkUrl && !URL_PATTERN.test(trimmedLinkUrl)) {
      return res.status(400).json({ error: "跳转链接需以 http:// 或 https:// 开头" });
    }

    banner.title = trimmedTitle;
    banner.subtitle = (subtitle ?? banner.subtitle).toString().trim();
    banner.imageUrl = trimmedImageUrl;
    banner.linkUrl = trimmedLinkUrl;
    banner.sort = Number(sort ?? banner.sort) || 0;
    banner.enabled = enabled === undefined ? banner.enabled : enabled !== false;
    banner.updatedAt = new Date().toISOString();

    const banners = await readBanners();
    const index = banners.findIndex((item) => item.id === banner.id);
    if (index !== -1) banners[index] = banner;
    await writeBanners(banners);

    res.json({ message: "轮播图已更新", banner: toPublicBanner(banner) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 管理员：删除轮播图
app.delete("/api/admin/banners/:id", requireAdmin, async (req, res) => {
  try {
    const banners = await readBanners();
    const index = banners.findIndex((item) => item.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "轮播图不存在" });
    }
    const [removed] = banners.splice(index, 1);
    await writeBanners(banners);
    res.json({ message: "轮播图已删除", banner: toPublicBanner(removed) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- 导航 API ---------------- */

// 公开：获取启用的导航（按 sort 升序）
app.get("/api/navs", async (_req, res) => {
  try {
    const navs = (await readNavs())
      .filter((nav) => nav.enabled !== false)
      .sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0))
      .map(toPublicNav);
    res.json(navs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 管理员：获取全部导航
app.get("/api/admin/navs", requireAdmin, async (_req, res) => {
  try {
    const navs = (await sortNavs(await readNavs())).map(toPublicNav);
    res.json(navs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 管理员：新增导航
app.post("/api/admin/navs", requireAdmin, async (req, res) => {
  try {
    const { title, url, sort, enabled } = req.body || {};
    const trimmedTitle = (title || "").trim();
    const trimmedUrl = (url || "").trim();

    if (!trimmedTitle) {
      return res.status(400).json({ error: "请填写导航名称" });
    }
    if (!URL_PATTERN.test(trimmedUrl)) {
      return res.status(400).json({ error: "链接需以 http:// 或 https:// 开头" });
    }

    const now = new Date().toISOString();
    const nav = {
      id: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
      title: trimmedTitle,
      url: trimmedUrl,
      sort: Number(sort) || 0,
      enabled: enabled !== false,
      createdAt: now,
      updatedAt: now,
    };

    const navs = await readNavs();
    navs.push(nav);
    await writeNavs(navs);

    res.json({ message: "导航已添加", nav: toPublicNav(nav) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 管理员：更新导航
app.put("/api/admin/navs/:id", requireAdmin, async (req, res) => {
  try {
    const { title, url, sort, enabled } = req.body || {};
    const nav = await getNavById(req.params.id);
    if (!nav) {
      return res.status(404).json({ error: "导航不存在" });
    }

    const trimmedTitle = (title ?? nav.title).toString().trim();
    const trimmedUrl = (url ?? nav.url).toString().trim();

    if (!trimmedTitle) {
      return res.status(400).json({ error: "请填写导航名称" });
    }
    if (!URL_PATTERN.test(trimmedUrl)) {
      return res.status(400).json({ error: "链接需以 http:// 或 https:// 开头" });
    }

    nav.title = trimmedTitle;
    nav.url = trimmedUrl;
    nav.sort = Number(sort ?? nav.sort) || 0;
    nav.enabled = enabled === undefined ? nav.enabled : enabled !== false;
    nav.updatedAt = new Date().toISOString();

    const navs = await readNavs();
    const index = navs.findIndex((item) => item.id === nav.id);
    if (index !== -1) navs[index] = nav;
    await writeNavs(navs);

    res.json({ message: "导航已更新", nav: toPublicNav(nav) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 管理员：删除导航
app.delete("/api/admin/navs/:id", requireAdmin, async (req, res) => {
  try {
    const navs = await readNavs();
    const index = navs.findIndex((item) => item.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "导航不存在" });
    }
    const [removed] = navs.splice(index, 1);
    await writeNavs(navs);
    res.json({ message: "导航已删除", nav: toPublicNav(removed) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 管理员：排序导航（body: { ids: [id1, id2, ...] }，按传入顺序从 1 重排 sort）
app.put("/api/admin/navs/reorder", requireAdmin, async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    if (ids.length === 0) {
      return res.status(400).json({ error: "排序数据无效" });
    }

    const navs = await readNavs();
    const idSet = new Set(navs.map((nav) => nav.id));
    if (ids.some((id) => !idSet.has(id))) {
      return res.status(400).json({ error: "排序数据包含不存在的导航" });
    }

    const byId = new Map(navs.map((nav) => [nav.id, nav]));
    const ordered = ids.map((id, index) => {
      const nav = byId.get(id);
      nav.sort = index + 1;
      nav.updatedAt = new Date().toISOString();
      return nav;
    });

    await writeNavs(ordered);
    res.json({ message: "排序已保存", navs: ordered.map(toPublicNav) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/upload", requireAuth, (req, res) => {
  imageUpload.single("image")(req, res, (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "图片不能超过 2MB"
          : err.message || "图片上传失败";
      return res.status(400).json({ error: message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "请选择要上传的图片" });
    }
    res.json({ url: `/uploads/${req.file.filename}` });
  });
});

app.get("/api/products", attachUserIfPresent, async (req, res) => {
  try {
    const range = RANGES.includes(req.query.range) ? req.query.range : "all";
    const category = req.query.category && req.query.category !== "全部"
      ? req.query.category
      : "";
    const topicId = (req.query.topicId || "").trim();
    const specialOnly = req.query.special === "true";
    const rangeStart = getRangeStart(range);

    const all = await listProducts();
    const topics = await readTopics();
    const topicMap = Object.fromEntries(topics.map((t) => [t.id, t.name || ""]));
    const nicknameMap = await getUsersNicknameMap();
    const approved = all.filter((product) => (product.status || "approved") === "approved");
    const filtered = approved.filter((product) => {
      if (category && product.category !== category) return false;
      if (topicId && product.topicId !== topicId) return false;
      if (specialOnly && product.isSpecial !== true) return false;
      if (rangeStart > 0) {
        const submittedTime = new Date(product.submittedAt || 0).getTime();
        if (submittedTime < rangeStart) return false;
      }
      return true;
    });

    const sorted = sortProducts(filtered).map((product) =>
      toPublicProduct(product, req.user, topicMap, nicknameMap)
    );
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/me/products", requireAuth, async (req, res) => {
  try {
    const all = await listProducts();
    const mine = all
      .filter((product) => product.submittedBy === req.user.username)
      .sort((a, b) => (b.submittedAt || "").localeCompare(a.submittedAt || ""))
      .map((product) => toPublicProduct(product, req.user));
    res.json(mine);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/products", requireAuth, async (req, res) => {
  try {
    const { name, tagline, description, url, category, imageUrl, topicId } = req.body || {};

    const trimmedName = (name || "").trim();
    const trimmedTagline = (tagline || "").trim();
    const trimmedUrl = (url || "").trim();
    const trimmedDescription = (description || "").trim();
    const trimmedImageUrl = (imageUrl || "").trim();

    if (!trimmedName) {
      return res.status(400).json({ error: "请填写资源名称" });
    }
    if (trimmedName.length > 50) {
      return res.status(400).json({ error: "资源名称不能超过 50 字" });
    }
    if (!trimmedTagline) {
      return res.status(400).json({ error: "请填写一句话介绍" });
    }
    if (trimmedTagline.length > 100) {
      return res.status(400).json({ error: "一句话介绍不能超过 100 字" });
    }
    if (!trimmedUrl) {
      return res.status(400).json({ error: "请填写演示链接" });
    }
    if (!URL_PATTERN.test(trimmedUrl)) {
      return res.status(400).json({ error: "演示链接需以 http:// 或 https:// 开头" });
    }
    if (trimmedImageUrl && trimmedImageUrl.length > 500) {
      return res.status(400).json({ error: "图片链接过长" });
    }
    if (trimmedImageUrl && !IMAGE_URL_PATTERN.test(trimmedImageUrl)) {
      return res.status(400).json({ error: "图片链接格式不正确" });
    }

    const finalCategory = PRODUCT_CATEGORIES.includes(category)
      ? category
      : DEFAULT_CATEGORY;

    const isAdmin = req.user.role === "admin";
    const now = new Date().toISOString();

    const product = {
      id: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
      name: trimmedName,
      tagline: trimmedTagline,
      description: trimmedDescription,
      url: trimmedUrl,
      category: finalCategory,
      topicId: (topicId || "").trim(),
      color: pickAvatarColor(trimmedName),
      imageUrl: trimmedImageUrl,
      voters: [],
      submittedBy: req.user.username,
      submittedAt: now,
      status: isAdmin ? "approved" : "pending",
      rejectReason: "",
      reviewedAt: isAdmin ? now : "",
      reviewedBy: isAdmin ? req.user.username : "",
    };

    await writeProductFile(product);

    res.json({
      message: isAdmin
        ? "发布成功，资源已上架"
        : "提交成功，等待管理员审核",
      product: toPublicProduct(product, req.user),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/products/:id/vote", requireAuth, async (req, res) => {
  try {
    const product = await getProduct(req.params.id);

    if ((product.status || "approved") !== "approved") {
      return res.status(403).json({ error: "该资源尚未上架" });
    }

    const { rating } = req.body || {};
    const score = Number(rating);
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return res.status(400).json({ error: "评分需为 1-5 分" });
    }

    const voters = Array.isArray(product.voters) ? product.voters : [];

    if (voters.includes(req.user.id)) {
      return res.status(400).json({ error: "您已经评价过了" });
    }

    product.voters = [...voters, req.user.id];
    product.ratings = { ...(product.ratings || {}), [req.user.id]: score };

    await writeProductFile(product);

    const [avgRating, ratingCount] = computeRating(product);

    res.json({
      message: "评价成功",
      voted: true,
      voteCount: product.voters.length,
      avgRating,
      ratingCount,
    });
  } catch {
    res.status(404).json({ error: "资源不存在" });
  }
});

/* ---------------- 话题 API ---------------- */

app.get("/api/topics", attachUserIfPresent, async (req, res) => {
  try {
    const tab = req.query.tab === "local" ? "local" : "hot";
    const city = (req.query.city || "").trim();
    const all = req.query.all === "1";
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.max(1, parseInt(req.query.pageSize, 10) || 20);

    const [topics, products] = await Promise.all([readTopics(), listProducts()]);
    const approved = products.filter(
      (p) => (p.status || "approved") === "approved"
    );
    const countByTopic = {};
    for (const p of approved) {
      if (p.topicId) countByTopic[p.topicId] = (countByTopic[p.topicId] || 0) + 1;
    }

    let pool = topics;
    // 本地榜：按城市过滤（city 缺省或"全国"时取全部）
    if (tab === "local") {
      pool =
        city && city !== "全国"
          ? topics.filter((t) => (t.region || "全国") === city)
          : topics;
    }

    const sorted = pool
      .sort((a, b) => {
        const aCount = countByTopic[a.id] || 0;
        const bCount = countByTopic[b.id] || 0;
        // 综合热度：关注数为主、作品数为辅
        const ah = (a.followerIds?.length || 0) * 10 + aCount * 50;
        const bh = (b.followerIds?.length || 0) * 10 + bCount * 50;
        if (ah !== bh) return bh - ah;
        const ac = countByTopic[a.id] || 0;
        const bc = countByTopic[b.id] || 0;
        if (ac !== bc) return bc - ac;
        return (b.createdAt || "").localeCompare(a.createdAt || "");
      })
      .map((topic) => toPublicTopic(topic, countByTopic[topic.id] || 0, req.user));

    const total = sorted.length;
    // 联想等场景需要全量时用 all=1；否则按页切片
    const items = all ? sorted : sorted.slice((page - 1) * pageSize, page * pageSize);
    res.json({ items, total, page, pageSize });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/topics", requireAuth, async (req, res) => {
  try {
    const { name, description, coverImage } = req.body || {};
    // 话题名统一存裸名：输入若带首尾 ## 则剥离，展示层负责包装成 #话题#
    const trimmedName = (name || "").trim().replace(/^#+|#+$/g, "");
    const trimmedDescription = (description || "").trim();
    const trimmedCover = (coverImage || "").trim();

    if (!trimmedName) {
      return res.status(400).json({ error: "请填写话题名称" });
    }
    if (trimmedName.length > 30) {
      return res.status(400).json({ error: "话题名称不能超过 30 字" });
    }
    if (trimmedDescription.length > 200) {
      return res.status(400).json({ error: "话题简介不能超过 200 字" });
    }
    if (trimmedCover && !IMAGE_URL_PATTERN.test(trimmedCover)) {
      return res.status(400).json({ error: "封面图链接格式不正确" });
    }

    const topics = await readTopics();
    if (topics.some((t) => t.name === trimmedName)) {
      return res.status(400).json({ error: "该话题已存在" });
    }

    const now = new Date().toISOString();
    const topic = {
      id: `topic-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`,
      name: trimmedName,
      description: trimmedDescription,
      coverImage: trimmedCover,
      color: pickAvatarColor(trimmedName),
      createdBy: req.user.username,
      createdAt: now,
      followerIds: [req.user.id],
    };

    topics.push(topic);
    await writeTopics(topics);

    res.json({
      message: "话题发布成功",
      topic: toPublicTopic(topic, 0, req.user),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/topics/:id/follow", requireAuth, async (req, res) => {
  try {
    const topics = await readTopics();
    const topic = topics.find((t) => t.id === req.params.id);
    if (!topic) {
      return res.status(404).json({ error: "话题不存在" });
    }

    const followers = Array.isArray(topic.followerIds) ? topic.followerIds : [];
    const idx = followers.indexOf(req.user.id);
    let following;
    if (idx >= 0) {
      followers.splice(idx, 1);
      following = false;
    } else {
      followers.push(req.user.id);
      following = true;
    }
    topic.followerIds = followers;
    await writeTopics(topics);

    res.json({ following, followerCount: followers.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/products", requireAdmin, async (req, res) => {
  try {
    const status = req.query.status || "pending";
    const all = await listProducts();
    const filtered =
      status === "all" ? all : all.filter((p) => (p.status || "approved") === status);
    const sorted = filtered.sort((a, b) =>
      (b.submittedAt || "").localeCompare(a.submittedAt || "")
    );
    res.json(sorted.map((product) => toPublicProduct(product, req.user)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/products/:id/approve", requireAdmin, async (req, res) => {
  try {
    const product = await getProduct(req.params.id);
    product.status = "approved";
    product.reviewedAt = new Date().toISOString();
    product.reviewedBy = req.user.username;
    product.rejectReason = "";
    await writeProductFile(product);
    res.json({ message: "已通过审核", product: toPublicProduct(product, req.user) });
  } catch {
    res.status(404).json({ error: "资源不存在" });
  }
});

app.post("/api/admin/products/:id/reject", requireAdmin, async (req, res) => {
  try {
    const product = await getProduct(req.params.id);
    product.status = "rejected";
    product.reviewedAt = new Date().toISOString();
    product.reviewedBy = req.user.username;
    product.rejectReason = (req.body?.reason || "").trim();
    await writeProductFile(product);
    res.json({ message: "已拒绝", product: toPublicProduct(product, req.user) });
  } catch {
    res.status(404).json({ error: "资源不存在" });
  }
});

// 设置/取消专题活动标记
app.post("/api/admin/products/:id/special", requireAdmin, async (req, res) => {
  try {
    const product = await getProduct(req.params.id);
    const isSpecial = req.body?.isSpecial === true;
    product.isSpecial = isSpecial;
    await writeProductFile(product);
    res.json({
      message: isSpecial ? "已加入专题活动" : "已取消专题活动",
      product: toPublicProduct(product, req.user),
    });
  } catch {
    res.status(404).json({ error: "资源不存在" });
  }
});

app.delete("/api/products/:id", requireAdmin, async (req, res) => {
  try {
    const product = await getProduct(req.params.id);
    if (product.imageUrl && product.imageUrl.startsWith("/uploads/")) {
      await fs.rm(path.join(UPLOADS_DIR, path.basename(product.imageUrl)), {
        force: true,
      });
    }
    await fs.rm(path.join(STORAGE_DIR, `${req.params.id}.json`), { force: true });
    res.json({ message: "删除成功" });
  } catch {
    res.status(404).json({ error: "资源不存在" });
  }
});

if (IS_PRODUCTION) {
  app.get("*", (_req, res) => {
    res.sendFile(path.join(CLIENT_DIST, "index.html"));
  });
} else {
  // 开发模式下后端不托管前端页面，访问根路径时给出指引
  app.get("/", (_req, res) => {
    res
      .status(200)
      .type("html")
      .send(
        `<html><body style="font-family:system-ui,sans-serif;background:#0d1017;color:#e8eaf0;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
          <div style="text-align:center">
            <h2>这是后端 API 服务（端口 ${PORT}）</h2>
            <p>请访问前端开发服务器：<a href="http://localhost:5173" style="color:#4da3ff">http://localhost:5173</a></p>
            <p style="color:#8a93a5;font-size:14px">接口健康检查：<a href="/api/health" style="color:#4da3ff">/api/health</a></p>
          </div>
        </body></html>`
      );
  });
}

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
