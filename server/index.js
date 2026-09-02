import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { PRODUCT_CATEGORIES, DEFAULT_CATEGORY } from "./categories.js";
import { TOPIC_SEED } from "./topic-seed.js";
import { TOPIC_POST_SEED } from "./topic-post-seed.js";
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
const TOPIC_POSTS_DIR = path.join(__dirname, "storage", "topic-posts");
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
await fs.mkdir(TOPIC_POSTS_DIR, { recursive: true });
await initAuth();
await initBanners();
await initNavs();
await initTopics();
await initTopicPosts();

if (IS_PRODUCTION) {
  app.use(
    express.static(CLIENT_DIST, {
      etag: true,
      lastModified: true,
      setHeaders(res, filePath) {
        if (filePath.endsWith("index.html")) {
          res.setHeader("Cache-Control", "no-cache");
          return;
        }
        // Vite 产物带 hash，可长期缓存
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      },
    }),
  );
}

app.use(cors());
app.use(express.json());
// 上传文件名含时间戳+随机串，内容不变，二次加载走浏览器缓存
app.use(
  "/uploads",
  express.static(UPLOADS_DIR, {
    etag: true,
    lastModified: true,
    maxAge: "30d",
    immutable: true,
    setHeaders(res) {
      res.setHeader(
        "Cache-Control",
        "public, max-age=2592000, immutable",
      );
    },
  }),
);

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
  if (existing.length > 0) {
    console.log(`[storage] topics.json loaded (${existing.length} items)`);
    return;
  }

  const now = new Date().toISOString();
  const seed = TOPIC_SEED.map((t) => ({ ...t, createdAt: t.createdAt || now }));
  await writeTopics(seed);
  console.log(`[storage] topics.json seeded (${seed.length} items)`);
}

async function initTopicPosts() {
  const existing = await listTopicPosts();
  if (existing.length > 0) {
    console.log(`[storage] topic-posts loaded (${existing.length} items)`);
    return;
  }

  const now = new Date().toISOString();
  for (const post of TOPIC_POST_SEED) {
    await writeTopicPostFile({
      ...post,
      submittedAt: post.submittedAt || now,
      reviewedAt: post.reviewedAt || now,
    });
  }
  console.log(`[storage] topic-posts seeded (${TOPIC_POST_SEED.length} items)`);
}

function toPublicTopic(topic, postCount, currentUser) {
  const followerIds = Array.isArray(topic.followerIds) ? topic.followerIds : [];
  const count = postCount || 0;
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
    postCount: count,
    productCount: count,
    hotScore: followerIds.length * 10 + count * 50,
  };
}

async function getTopicById(id) {
  const topics = await readTopics();
  return topics.find((topic) => topic.id === id) || null;
}

/* ---------------- 话题内容存储 ---------------- */

async function readTopicPostFile(filePath) {
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw);
}

async function writeTopicPostFile(post) {
  const filePath = path.join(TOPIC_POSTS_DIR, `${post.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(post, null, 2), "utf-8");
}

async function listTopicPosts() {
  const entries = await fs.readdir(TOPIC_POSTS_DIR, { withFileTypes: true });
  const posts = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    try {
      const post = await readTopicPostFile(path.join(TOPIC_POSTS_DIR, entry.name));
      if (post?.id) posts.push(post);
    } catch {
      // skip invalid
    }
  }
  return posts;
}

async function getTopicPost(id) {
  const filePath = path.join(TOPIC_POSTS_DIR, `${id}.json`);
  try {
    await fs.access(filePath);
    return readTopicPostFile(filePath);
  } catch {
    const all = await listTopicPosts();
    const post = all.find((item) => item.id === id);
    if (!post) throw new Error("NOT_FOUND");
    return post;
  }
}

function buildPostCountMap(posts, approvedOnly = true) {
  const map = {};
  for (const post of posts) {
    if (approvedOnly && (post.status || "approved") !== "approved") continue;
    if (!post.topicId) continue;
    map[post.topicId] = (map[post.topicId] || 0) + 1;
  }
  return map;
}

function toPublicTopicPost(post, currentUser, nicknameMap = null, { includeComments = false } = {}) {
  const likeIds = Array.isArray(post.likeIds) ? post.likeIds : [];
  const comments = Array.isArray(post.comments) ? post.comments : [];
  const base = {
    id: post.id,
    topicId: post.topicId,
    title: post.title || "",
    content: post.content || "",
    imageUrl: post.imageUrl || "",
    linkUrl: post.linkUrl || "",
    submittedBy: resolveSubmitterDisplayName(
      { submittedBy: post.submittedBy, submittedNickname: post.submittedNickname },
      nicknameMap,
    ),
    submittedAt: post.submittedAt || "",
    status: post.status || "approved",
    viewCount: post.viewCount || 0,
    likeCount: likeIds.length,
    likedByMe: currentUser ? likeIds.includes(currentUser.id) : false,
    commentCount: comments.length,
  };
  if (includeComments) {
    base.comments = comments
      .slice()
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
      .map((c) => toPublicComment(c, nicknameMap));
  }
  return base;
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

function toPublicComment(comment, nicknameMap = null) {
  const author =
    comment.author ||
    (nicknameMap && comment.userId ? nicknameMap[comment.username] : "") ||
    comment.username ||
    "用户";
  return {
    id: comment.id,
    author,
    content: comment.content || "",
    createdAt: comment.createdAt || "",
  };
}

function toPublicProduct(product, currentUser, topicMap = null, nicknameMap = null, { includeComments = false } = {}) {
  const voteCount = Array.isArray(product.voters) ? product.voters.length : 0;
  const [avgRating, ratingCount] = computeRating(product);
  const topicName = topicMap && product.topicId ? (topicMap[product.topicId] || "") : "";
  const comments = Array.isArray(product.comments) ? product.comments : [];
  const myRating =
    currentUser && product.ratings
      ? Number(product.ratings[currentUser.id]) || 0
      : 0;
  const base = {
    id: product.id,
    name: product.name,
    tagline: product.tagline,
    description: product.description,
    url: product.url,
    category: product.category,
    topicId: product.topicId || "",
    topicName,
    imageUrl: product.imageUrl || "",
    color: product.color || "",
    voteCount,
    avgRating,
    ratingCount,
    viewCount: product.viewCount || 0,
    commentCount: comments.length,
    votedByMe: currentUser
      ? Array.isArray(product.voters) && product.voters.includes(currentUser.id)
      : false,
    myRating: myRating > 0 ? myRating : 0,
    submittedBy: resolveSubmitterDisplayName(product, nicknameMap),
    submittedAt: product.submittedAt,
    status: product.status,
    rejectReason: product.rejectReason || "",
    reviewedAt: product.reviewedAt || "",
    isSpecial: product.isSpecial === true,
  };
  if (includeComments) {
    base.comments = comments
      .slice()
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
      .map((c) => toPublicComment(c, nicknameMap));
  }
  return base;
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
    const keyword = (req.query.q || "").trim().toLowerCase();
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
      if (keyword) {
        const haystack = [
          product.name,
          product.tagline,
          product.description,
          product.category,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(keyword)) return false;
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

app.get("/api/stats", async (_req, res) => {
  try {
    const [products, topics, topicPosts] = await Promise.all([
      listProducts(),
      readTopics(),
      listTopicPosts(),
    ]);
    const approved = products.filter((p) => (p.status || "approved") === "approved");
    const approvedPosts = topicPosts.filter(
      (p) => (p.status || "approved") === "approved",
    );
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    let totalVotes = 0;
    let totalViews = 0;
    let totalComments = 0;
    let ratingSum = 0;
    let ratingCount = 0;
    let recentResources7d = 0;
    const categoryCounts = {};

    for (const product of approved) {
      totalVotes += Array.isArray(product.voters) ? product.voters.length : 0;
      totalViews += product.viewCount || 0;
      totalComments += Array.isArray(product.comments) ? product.comments.length : 0;
      const [avgRating, count] = computeRating(product);
      if (count > 0) {
        ratingSum += avgRating * count;
        ratingCount += count;
      }
      if ((product.submittedAt || "") >= weekAgo) recentResources7d += 1;
      const cat = product.category || DEFAULT_CATEGORY;
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }

    let totalTopicLikes = 0;
    let totalTopicViews = 0;
    let totalTopicComments = 0;
    let recentTopicPosts7d = 0;

    for (const post of approvedPosts) {
      totalTopicLikes += Array.isArray(post.likeIds) ? post.likeIds.length : 0;
      totalTopicViews += post.viewCount || 0;
      totalTopicComments += Array.isArray(post.comments) ? post.comments.length : 0;
      if ((post.submittedAt || "") >= weekAgo) recentTopicPosts7d += 1;
    }

    const postCountByTopic = buildPostCountMap(approvedPosts);
    let totalFollowers = 0;
    for (const topic of topics) {
      totalFollowers += Array.isArray(topic.followerIds) ? topic.followerIds.length : 0;
    }

    const totalResources = approved.length;
    const categoryList = Object.entries(categoryCounts)
      .map(([category, count]) => ({
        category,
        count,
        percent: totalResources ? Math.round((count / totalResources) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const topTopics = topics
      .map((topic) => {
        const postCount = postCountByTopic[topic.id] || 0;
        const followerCount = Array.isArray(topic.followerIds)
          ? topic.followerIds.length
          : 0;
        return {
          id: topic.id,
          name: topic.name || "",
          postCount,
          followerCount,
          hotScore: followerCount * 10 + postCount * 50,
        };
      })
      .sort((a, b) => b.hotScore - a.hotScore)
      .slice(0, 5);

    res.json({
      totalResources,
      totalTopics: topics.length,
      totalTopicPosts: approvedPosts.length,
      totalVotes,
      totalViews: totalViews + totalTopicViews,
      totalComments: totalComments + totalTopicComments,
      totalTopicLikes,
      totalFollowers,
      avgRating: ratingCount ? Math.round((ratingSum / ratingCount) * 10) / 10 : 0,
      ratingCount,
      recentResources7d,
      recentTopicPosts7d,
      categoryCounts: categoryList,
      topTopics,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/products/:id", attachUserIfPresent, async (req, res) => {
  try {
    const product = await getProduct(req.params.id);
    const isApproved = (product.status || "approved") === "approved";
    const isOwner = req.user && product.submittedBy === req.user.username;
    const isAdmin = req.user && req.user.role === "admin";
    if (!isApproved && !isOwner && !isAdmin) {
      return res.status(404).json({ error: "资源不存在" });
    }

    product.viewCount = (product.viewCount || 0) + 1;
    await writeProductFile(product);

    const topics = await readTopics();
    const topicMap = Object.fromEntries(topics.map((t) => [t.id, t.name || ""]));
    const nicknameMap = await getUsersNicknameMap();
    res.json(
      toPublicProduct(product, req.user, topicMap, nicknameMap, { includeComments: true }),
    );
  } catch {
    res.status(404).json({ error: "资源不存在" });
  }
});

app.post("/api/products/:id/comments", requireAuth, async (req, res) => {
  try {
    const product = await getProduct(req.params.id);
    if ((product.status || "approved") !== "approved") {
      return res.status(403).json({ error: "该资源尚未上架" });
    }

    const content = (req.body?.content || "").trim();
    if (!content) {
      return res.status(400).json({ error: "请填写评论内容" });
    }
    if (content.length > 500) {
      return res.status(400).json({ error: "评论不能超过 500 字" });
    }

    const nicknameMap = await getUsersNicknameMap();
    const comment = {
      id: `cmt-${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`,
      userId: req.user.id,
      username: req.user.username,
      author: nicknameMap[req.user.username] || req.user.username,
      content,
      createdAt: new Date().toISOString(),
    };

    product.comments = Array.isArray(product.comments) ? product.comments : [];
    product.comments.push(comment);
    await writeProductFile(product);

    res.json({
      message: "评论成功",
      comment: toPublicComment(comment, nicknameMap),
      commentCount: product.comments.length,
    });
  } catch {
    res.status(404).json({ error: "资源不存在" });
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
    const sort = req.query.sort === "new" ? "new" : "hot";
    const city = (req.query.city || "").trim();
    const keyword = (req.query.q || "").trim().toLowerCase();
    const all = req.query.all === "1";
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.max(1, parseInt(req.query.pageSize, 10) || 20);

    const [topics, posts] = await Promise.all([readTopics(), listTopicPosts()]);
    const countByTopic = buildPostCountMap(posts);

    let pool = topics;
    // 本地榜：按城市过滤（city 缺省或"全国"时取全部）
    if (tab === "local") {
      pool =
        city && city !== "全国"
          ? topics.filter((t) => (t.region || "全国") === city)
          : topics;
    }
    if (keyword) {
      pool = pool.filter((t) => (t.name || "").toLowerCase().includes(keyword));
    }

    const sorted = pool
      .sort((a, b) => {
        if (sort === "new") {
          return (b.createdAt || "").localeCompare(a.createdAt || "");
        }
        const aCount = countByTopic[a.id] || 0;
        const bCount = countByTopic[b.id] || 0;
        // 综合热度：关注数为主、内容数为辅
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

app.get("/api/topics/:id/posts", attachUserIfPresent, async (req, res) => {
  try {
    const topic = await getTopicById(req.params.id);
    if (!topic) {
      return res.status(404).json({ error: "话题不存在" });
    }
    const nicknameMap = await getUsersNicknameMap();
    const all = await listTopicPosts();
    const items = all
      .filter(
        (post) =>
          post.topicId === topic.id && (post.status || "approved") === "approved",
      )
      .sort((a, b) => (b.submittedAt || "").localeCompare(a.submittedAt || ""))
      .map((post) => toPublicTopicPost(post, req.user, nicknameMap));
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/topics/:id/posts", requireAuth, async (req, res) => {
  try {
    const topic = await getTopicById(req.params.id);
    if (!topic) {
      return res.status(404).json({ error: "话题不存在" });
    }

    const { title, content, imageUrl, linkUrl } = req.body || {};
    const trimmedTitle = (title || "").trim();
    const trimmedContent = (content || "").trim();
    const trimmedImageUrl = (imageUrl || "").trim();
    const trimmedLinkUrl = (linkUrl || "").trim();

    if (!trimmedTitle) {
      return res.status(400).json({ error: "请填写标题" });
    }
    if (trimmedTitle.length > 80) {
      return res.status(400).json({ error: "标题不能超过 80 字" });
    }
    if (!trimmedContent) {
      return res.status(400).json({ error: "请填写正文" });
    }
    if (trimmedContent.length > 2000) {
      return res.status(400).json({ error: "正文不能超过 2000 字" });
    }
    if (trimmedImageUrl && !IMAGE_URL_PATTERN.test(trimmedImageUrl)) {
      return res.status(400).json({ error: "图片链接格式不正确" });
    }
    if (trimmedLinkUrl && !URL_PATTERN.test(trimmedLinkUrl)) {
      return res.status(400).json({ error: "链接需以 http:// 或 https:// 开头" });
    }

    const isAdmin = req.user.role === "admin";
    const now = new Date().toISOString();
    const post = {
      id: `tpost-${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`,
      topicId: topic.id,
      title: trimmedTitle,
      content: trimmedContent,
      imageUrl: trimmedImageUrl,
      linkUrl: trimmedLinkUrl,
      submittedBy: req.user.username,
      submittedAt: now,
      status: isAdmin ? "approved" : "pending",
      rejectReason: "",
      reviewedAt: isAdmin ? now : "",
      reviewedBy: isAdmin ? req.user.username : "",
      viewCount: 0,
      likeIds: [],
      comments: [],
    };

    await writeTopicPostFile(post);
    const nicknameMap = await getUsersNicknameMap();
    res.json({
      message: isAdmin ? "发布成功" : "提交成功，等待审核",
      post: toPublicTopicPost(post, req.user, nicknameMap),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/topics/:id", attachUserIfPresent, async (req, res) => {
  try {
    const topic = await getTopicById(req.params.id);
    if (!topic) {
      return res.status(404).json({ error: "话题不存在" });
    }
    const posts = await listTopicPosts();
    const postCount = buildPostCountMap(posts)[topic.id] || 0;
    res.json(toPublicTopic(topic, postCount, req.user));
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

app.get("/api/topic-posts/:id", attachUserIfPresent, async (req, res) => {
  try {
    const post = await getTopicPost(req.params.id);
    const isApproved = (post.status || "approved") === "approved";
    const isOwner = req.user && post.submittedBy === req.user.username;
    const isAdmin = req.user && req.user.role === "admin";
    if (!isApproved && !isOwner && !isAdmin) {
      return res.status(404).json({ error: "内容不存在" });
    }

    post.viewCount = (post.viewCount || 0) + 1;
    await writeTopicPostFile(post);

    const nicknameMap = await getUsersNicknameMap();
    const topic = await getTopicById(post.topicId);
    res.json({
      ...toPublicTopicPost(post, req.user, nicknameMap, { includeComments: true }),
      topicName: topic?.name || "",
    });
  } catch {
    res.status(404).json({ error: "内容不存在" });
  }
});

app.post("/api/topic-posts/:id/like", requireAuth, async (req, res) => {
  try {
    const post = await getTopicPost(req.params.id);
    if ((post.status || "approved") !== "approved") {
      return res.status(403).json({ error: "该内容尚未发布" });
    }

    const likeIds = Array.isArray(post.likeIds) ? post.likeIds : [];
    const idx = likeIds.indexOf(req.user.id);
    let liked;
    if (idx >= 0) {
      likeIds.splice(idx, 1);
      liked = false;
    } else {
      likeIds.push(req.user.id);
      liked = true;
    }
    post.likeIds = likeIds;
    await writeTopicPostFile(post);
    res.json({ liked, likeCount: likeIds.length });
  } catch {
    res.status(404).json({ error: "内容不存在" });
  }
});

app.post("/api/topic-posts/:id/comments", requireAuth, async (req, res) => {
  try {
    const post = await getTopicPost(req.params.id);
    if ((post.status || "approved") !== "approved") {
      return res.status(403).json({ error: "该内容尚未发布" });
    }

    const content = (req.body?.content || "").trim();
    if (!content) {
      return res.status(400).json({ error: "请填写评论内容" });
    }
    if (content.length > 500) {
      return res.status(400).json({ error: "评论不能超过 500 字" });
    }

    const nicknameMap = await getUsersNicknameMap();
    const comment = {
      id: `cmt-${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`,
      userId: req.user.id,
      username: req.user.username,
      author: nicknameMap[req.user.username] || req.user.username,
      content,
      createdAt: new Date().toISOString(),
    };

    post.comments = Array.isArray(post.comments) ? post.comments : [];
    post.comments.push(comment);
    await writeTopicPostFile(post);

    res.json({
      message: "评论成功",
      comment: toPublicComment(comment, nicknameMap),
      commentCount: post.comments.length,
    });
  } catch {
    res.status(404).json({ error: "内容不存在" });
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
