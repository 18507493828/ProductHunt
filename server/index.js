import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import {
  PRODUCT_CATEGORIES,
  DEFAULT_CATEGORIES,
  DEFAULT_CATEGORY,
  DEFAULT_CAMPAIGNS,
  DEFAULT_CAMPAIGN_ZONE,
} from "./categories.js";
import {
  RATING_DIMENSION_KEYS,
  normalizeUserRatings,
  overallFromRatings,
  parseVotePayload,
} from "./ratingDimensions.js";
import {
  SHARE_PLATFORM_IDS,
  platformLabel,
} from "./shareConfig.js";
import { TOPIC_SEED } from "./topic-seed.js";
import { TOPIC_POST_SEED } from "./topic-post-seed.js";
import {
  initAuth,
  registerUser,
  loginUser,
  resetPassword,
  getUsersNicknameMap,
  getUsersIdMap,
  getUserById,
  requireAuth,
  requireAdmin,
  attachUserIfPresent,
} from "./auth.js";
import { initDb, query as dbQuery } from "./db.js";
import { migrateJsonToMysql } from "./migrate-json-to-mysql.js";
import {
  writeProduct,
  listProducts,
  getProduct,
  deleteProduct,
  readBanners,
  writeBanners,
  readNavs,
  writeNavs,
  readCampaigns,
  writeCampaigns as storeWriteCampaigns,
  readCategories,
  writeCategories as storeWriteCategories,
  readCampaignZone,
  writeCampaignZone,
  readShareConfig,
  writeShareConfig,
  readShares,
  writeShares,
  readTopics,
  writeTopics,
  upsertTopic,
  writeTopicPost,
  listTopicPosts,
  getTopicPost,
  saveUpload,
  getUpload,
  deleteUpload,
} from "./store.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || "0.0.0.0";
const CLIENT_DIST = path.join(__dirname, "..", "client", "dist");
const UPLOADS_DIR = path.join(__dirname, "storage", "uploads");
const IS_PRODUCTION = process.env.NODE_ENV === "production";

let campaignCache = {
  list: [],
  ids: [],
  labels: {},
  rankLabels: {},
};

let categoryCache = {
  list: [],
  names: [],
  enabledNames: [],
  defaultName: DEFAULT_CATEGORY,
};

const RANGES = ["today", "week", "month", "all"];
const URL_PATTERN = /^https?:\/\/.+/i;
// 兼容旧路径 /uploads/x 与反代仅转发 /api 时的 /api/uploads/x
const IMAGE_URL_PATTERN =
  /^(https?:\/\/.+|\/(?:api\/)?uploads\/[\w.-]+)$/i;
const LOCAL_UPLOAD_URL_PATTERN = /^\/(?:api\/)?uploads\/([\w.-]+)$/i;

function localUploadFilename(url) {
  const match = String(url || "").match(LOCAL_UPLOAD_URL_PATTERN);
  return match ? match[1] : "";
}

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
    title: "AI 应用专区",
    subtitle: "发现能真正提升生产力的 AI 产品",
    imageUrl: "/banners/banner-ai.png",
    linkUrl: "/",
    sort: 1,
    enabled: true,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "banner-dev",
    title: "开发者利器",
    subtitle: "从编辑器插件到部署平台，汇聚开发者精心打磨的工具",
    imageUrl: "/banners/banner-dev.png",
    linkUrl: "/",
    sort: 2,
    enabled: true,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "banner-open",
    title: "开源项目巡礼",
    subtitle: "每周精选值得关注的开源项目，让优秀作品被更多人看见",
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

await initDb();
// 把历史 server/storage JSON / 磁盘图片导入 MySQL（库中已有的默认保留；缺的补齐）
try {
  await migrateJsonToMysql({
    force: process.env.MIGRATE_JSON_FORCE === "1",
  });
} catch (err) {
  console.warn("[migrate] skipped:", err.message || err);
}
await initAuth();
await initBanners();
await initNavs();
await initCampaigns();
await initCategories();
await initTopics();
await initTopicPosts();
// 兼容历史磁盘图片；新上传一律进 MySQL uploads 表
await fs.mkdir(UPLOADS_DIR, { recursive: true }).catch(() => {});

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

async function serveUpload(req, res) {
  const filename = path.basename(req.params.filename || "");
  if (!filename || filename !== req.params.filename) {
    return res.status(400).json({ error: "无效的图片地址" });
  }

  try {
    const file = await getUpload(filename);
    if (file?.data) {
      res.setHeader("Content-Type", file.mimeType || "application/octet-stream");
      res.setHeader("Cache-Control", "public, max-age=2592000, immutable");
      res.setHeader("Content-Length", Buffer.byteLength(file.data));
      return res.end(file.data);
    }

    // 兼容旧版落盘文件
    const diskPath = path.join(UPLOADS_DIR, filename);
    try {
      await fs.access(diskPath);
      res.setHeader("Cache-Control", "public, max-age=2592000, immutable");
      return res.sendFile(diskPath);
    } catch {
      return res.status(404).json({ error: "图片不存在" });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message || "读取图片失败" });
  }
}

app.get("/api/uploads/:filename", serveUpload);
app.get("/uploads/:filename", serveUpload);

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (IMAGE_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("仅支持 JPG / PNG / GIF / WebP 图片"));
    }
  },
});

function makeUploadFilename(originalname = "") {
  const ext = path.extname(originalname || "").toLowerCase() || ".png";
  return `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
}
function pickAvatarColor(name = "") {
  const hash = [...name].reduce((acc, ch) => acc + ch.codePointAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

/* ---------------- 轮播图存储 ---------------- */

function bannersNeedReseed(list) {
  if (!Array.isArray(list) || list.length === 0) return true;
  // 开发/联调残留的占位数据（如 title=T, imageUrl=/x.png）
  return list.every((banner) => {
    const title = String(banner.title || "").trim();
    const imageUrl = String(banner.imageUrl || "").trim();
    return (
      banner.id === "banner-smoke" ||
      title.length <= 2 ||
      !imageUrl ||
      imageUrl === "/x.png"
    );
  });
}

async function initBanners() {
  const existing = await readBanners();
  if (!bannersNeedReseed(existing)) return;

  const now = new Date().toISOString();
  const seed = DEFAULT_BANNERS.map((banner) => ({
    ...banner,
    createdAt: banner.createdAt || now,
    updatedAt: now,
  }));
  await writeBanners(seed);
  console.log(`[storage] banners reseeded (${seed.length} items)`);
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

/* ---------------- 活动配置存储 ---------------- */

async function writeCampaigns(campaigns) {
  await storeWriteCampaigns(campaigns);
  await refreshCampaignCache(campaigns);
}

async function refreshCampaignCache(list) {
  const campaigns = Array.isArray(list) ? list : await readCampaigns();
  campaignCache = {
    list: campaigns,
    ids: campaigns.map((item) => item.id),
    labels: Object.fromEntries(
      campaigns.map((item) => [item.id, item.title || item.label || ""]),
    ),
    rankLabels: Object.fromEntries(
      campaigns.map((item) => [
        item.id,
        item.rankLabel || item.title || item.label || "",
      ]),
    ),
  };
}

async function initCampaigns() {
  const existing = await readCampaigns();
  if (existing.length > 0) {
    // 为旧数据补齐活动详情字段，不覆盖已有文案
    let changed = false;
    const seedMap = Object.fromEntries(
      DEFAULT_CAMPAIGNS.map((item) => [item.id, item]),
    );
    const merged = existing.map((item) => {
      const seed = seedMap[item.id] || {};
      const next = { ...item };
      for (const key of [
        "description",
        "coverImage",
        "timeText",
        "rules",
        "rewards",
      ]) {
        if (next[key] == null || next[key] === "") {
          if (seed[key]) {
            next[key] = seed[key];
            changed = true;
          } else if (next[key] == null) {
            next[key] = "";
            changed = true;
          }
        }
      }
      return next;
    });
    if (changed) {
      await writeCampaigns(merged);
    } else {
      await refreshCampaignCache(existing);
    }
    return;
  }

  const now = new Date().toISOString();
  const seed = DEFAULT_CAMPAIGNS.map((item, index) => ({
    id: item.id,
    title: item.title,
    rankLabel: item.rankLabel || item.title,
    description: item.description || "",
    coverImage: item.coverImage || "",
    timeText: item.timeText || "",
    rules: item.rules || "",
    rewards: item.rewards || "",
    enabled: item.enabled !== false,
    sort: Number(item.sort) || index + 1,
    createdAt: now,
    updatedAt: now,
  }));
  await writeCampaigns(seed);
}

function normalizeCampaignImage(url) {
  const value = String(url || "").trim();
  if (!value) return "";
  if (IMAGE_URL_PATTERN.test(value)) return value;
  return "";
}

function pickCampaignFields(body = {}, existing = {}) {
  const title = (body.title ?? existing.title ?? "").toString().trim();
  const rankLabel = (body.rankLabel ?? existing.rankLabel ?? "").toString().trim();
  const description = (
    body.description !== undefined ? body.description : existing.description || ""
  )
    .toString()
    .trim();
  const timeText = (
    body.timeText !== undefined ? body.timeText : existing.timeText || ""
  )
    .toString()
    .trim();
  const rules = (body.rules !== undefined ? body.rules : existing.rules || "")
    .toString()
    .trim();
  const rewards = (
    body.rewards !== undefined ? body.rewards : existing.rewards || ""
  )
    .toString()
    .trim();
  const coverRaw =
    body.coverImage !== undefined ? body.coverImage : existing.coverImage || "";
  return {
    title,
    rankLabel: rankLabel || title,
    description,
    coverImage: normalizeCampaignImage(coverRaw),
    timeText,
    rules,
    rewards,
  };
}

function toPublicCampaign(campaign) {
  return {
    id: campaign.id,
    title: campaign.title || "",
    rankLabel: campaign.rankLabel || campaign.title || "",
    description: campaign.description || "",
    coverImage: campaign.coverImage || "",
    timeText: campaign.timeText || "",
    rules: campaign.rules || "",
    rewards: campaign.rewards || "",
    sort: Number(campaign.sort) || 0,
    enabled: campaign.enabled !== false,
    createdAt: campaign.createdAt || "",
    updatedAt: campaign.updatedAt || "",
  };
}

async function getCampaignStatsMap() {
  const products = await listProducts();
  const map = {};
  for (const product of products) {
    const campaignId = product.campaign;
    if (!campaignId) continue;
    if (!map[campaignId]) {
      map[campaignId] = {
        productCount: 0,
        approvedCount: 0,
        pendingCount: 0,
        voteCount: 0,
        submitters: new Set(),
      };
    }
    const bucket = map[campaignId];
    bucket.productCount += 1;
    const status = product.status || "approved";
    if (status === "approved") bucket.approvedCount += 1;
    if (status === "pending") bucket.pendingCount += 1;
    bucket.voteCount += Array.isArray(product.voters) ? product.voters.length : 0;
    if (product.submittedBy) bucket.submitters.add(product.submittedBy);
  }

  const result = {};
  for (const [id, bucket] of Object.entries(map)) {
    result[id] = {
      productCount: bucket.productCount,
      approvedCount: bucket.approvedCount,
      pendingCount: bucket.pendingCount,
      voteCount: bucket.voteCount,
      participantCount: bucket.submitters.size,
    };
  }
  return result;
}

function withCampaignStats(campaign, statsMap = {}, { includePending = false } = {}) {
  const stats = statsMap[campaign.id] || {
    productCount: 0,
    approvedCount: 0,
    pendingCount: 0,
    voteCount: 0,
    participantCount: 0,
  };
  const base = toPublicCampaign(campaign);
  return {
    ...base,
    productCount: includePending ? stats.productCount : stats.approvedCount,
    approvedCount: stats.approvedCount,
    pendingCount: includePending ? stats.pendingCount : undefined,
    voteCount: stats.voteCount,
    participantCount: stats.participantCount,
  };
}

async function getCampaignById(id) {
  const campaigns = await readCampaigns();
  return campaigns.find((item) => item.id === id) || null;
}

function isKnownCampaign(id) {
  return Boolean(id && campaignCache.ids.includes(id));
}

/* ---------------- 活动专区容器配置 ---------------- */

async function initCampaignZone() {
  const existing = await readCampaignZone();
  if (existing?.title) return;
  await writeCampaignZone({ ...DEFAULT_CAMPAIGN_ZONE });
}

function toPublicCampaignZone(zone) {
  return {
    title: zone?.title || DEFAULT_CAMPAIGN_ZONE.title,
    enabled: zone?.enabled !== false,
  };
}

/* ---------------- 分类配置存储 ---------------- */

async function writeCategories(categories) {
  await storeWriteCategories(categories);
  await refreshCategoryCache(categories);
}

async function refreshCategoryCache(list) {
  const categories = Array.isArray(list) ? list : await readCategories();
  const sorted = categories
    .slice()
    .sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0));
  const enabled = sorted.filter((item) => item.enabled !== false);
  const enabledNames = enabled.map((item) => item.name).filter(Boolean);
  const allNames = sorted.map((item) => item.name).filter(Boolean);
  categoryCache = {
    list: sorted,
    names: allNames.length > 0 ? allNames : [...PRODUCT_CATEGORIES],
    enabledNames:
      enabledNames.length > 0 ? enabledNames : [...PRODUCT_CATEGORIES],
    defaultName: enabledNames.includes(DEFAULT_CATEGORY)
      ? DEFAULT_CATEGORY
      : enabledNames[0] || DEFAULT_CATEGORY,
  };
}

async function initCategories() {
  const existing = await readCategories();
  if (existing.length > 0) {
    await refreshCategoryCache(existing);
    return;
  }

  const now = new Date().toISOString();
  const seed = DEFAULT_CATEGORIES.map((item, index) => ({
    id: item.id || `cat-${index + 1}`,
    name: item.name,
    sort: Number(item.sort) || index + 1,
    enabled: item.enabled !== false,
    createdAt: now,
    updatedAt: now,
  }));
  await writeCategories(seed);
}

function toPublicCategory(category) {
  return {
    id: category.id,
    name: category.name || "",
    sort: Number(category.sort) || 0,
    enabled: category.enabled !== false,
    createdAt: category.createdAt || "",
    updatedAt: category.updatedAt || "",
  };
}

function isEnabledCategory(name) {
  return Boolean(name && categoryCache.enabledNames.includes(name));
}

function getDefaultCategoryName() {
  return categoryCache.defaultName || DEFAULT_CATEGORY;
}

/* ---------------- 话题存储 ---------------- */

async function initTopics() {
  const existing = await readTopics();
  if (existing.length > 0) {
    console.log(`[storage] topics loaded (${existing.length} items)`);
    return;
  }

  const now = new Date().toISOString();
  const seed = TOPIC_SEED.map((t) => ({ ...t, createdAt: t.createdAt || now }));
  await writeTopics(seed);
  console.log(`[storage] topics seeded (${seed.length} items)`);
}

async function initTopicPosts() {
  const existing = await listTopicPosts();
  if (existing.length > 0) {
    console.log(`[storage] topic-posts loaded (${existing.length} items)`);
    return;
  }

  const now = new Date().toISOString();
  for (const post of TOPIC_POST_SEED) {
    await writeTopicPost({
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

function buildPostCountMap(posts, approvedOnly = true) {
  const map = {};
  for (const post of posts) {
    if (approvedOnly && (post.status || "approved") !== "approved") continue;
    if (!post.topicId) continue;
    map[post.topicId] = (map[post.topicId] || 0) + 1;
  }
  return map;
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

function getProductCategories(product) {
  const cats = [];
  if (Array.isArray(product.categories)) {
    for (const raw of product.categories) {
      if (raw && !cats.includes(raw)) cats.push(raw);
    }
  }
  const legacy = product.category;
  if (legacy && !cats.includes(legacy)) {
    cats.unshift(legacy);
  }
  return cats.length > 0 ? cats : [getDefaultCategoryName()];
}

function getProductTopicIds(product) {
  const ids = [];
  if (Array.isArray(product.topicIds)) {
    for (const raw of product.topicIds) {
      const id = (raw || "").trim();
      if (id && !ids.includes(id)) ids.push(id);
    }
  }
  const legacy = (product.topicId || "").trim();
  if (legacy && !ids.includes(legacy)) ids.unshift(legacy);
  return ids.slice(0, 3);
}

async function resolveOrCreateTopic({ topicId, topicName }, user) {
  const trimmedId = (topicId || "").trim();
  let trimmedName = (topicName || "").trim().replace(/^#+|#+$/g, "");
  if (!trimmedId && !trimmedName) return { topicId: "", topics: null };

  const topics = await readTopics();
  if (trimmedId) {
    const found = topics.find((t) => t.id === trimmedId);
    if (!found) {
      const err = new Error("所选话题不存在或已下线");
      err.status = 400;
      throw err;
    }
    return { topicId: found.id, topics };
  }

  if (trimmedName.length > 30) {
    const err = new Error("话题名称不能超过 30 字");
    err.status = 400;
    throw err;
  }

  const existing = topics.find(
    (t) => (t.name || "").toLowerCase() === trimmedName.toLowerCase(),
  );
  if (existing) return { topicId: existing.id, topics };

  const now = new Date().toISOString();
  const topic = {
    id: `topic-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`,
    name: trimmedName,
    description: "",
    coverImage: "",
    color: pickAvatarColor(trimmedName),
    createdBy: user.username,
    createdAt: now,
    followerIds: [user.id],
  };
  topics.push(topic);
  await upsertTopic(topic);
  return { topicId: topic.id, topics };
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
  const { avgRating, ratingCount, avgRatings } = computeRating(product);
  const categories = getProductCategories(product);
  const topicIds = getProductTopicIds(product);
  const topicId = topicIds[0] || "";
  const topicName = topicMap && topicId ? topicMap[topicId] || "" : "";
  const comments = Array.isArray(product.comments) ? product.comments : [];
  const myRatings =
    currentUser && product.ratings
      ? normalizeUserRatings(product.ratings[currentUser.id])
      : null;
  const myRating = myRatings ? overallFromRatings(myRatings) : 0;
  const base = {
    id: product.id,
    name: product.name,
    tagline: product.tagline,
    description: product.description,
    url: product.url,
    category: categories[0] || getDefaultCategoryName(),
    categories,
    topicId,
    topicName,
    imageUrl: product.imageUrl || "",
    color: product.color || "",
    voteCount,
    avgRating,
    avgRatings,
    ratingCount,
    shareCount: Number(product.shareCount) || 0,
    rankPinned: product.rankPinned === true,
    rankWeight: Number(product.rankWeight) || 0,
    rankHidden: product.rankHidden === true,
    viewCount: product.viewCount || 0,
    commentCount: comments.length,
    votedByMe: currentUser
      ? Array.isArray(product.voters) && product.voters.includes(currentUser.id)
      : false,
    myRating: myRating > 0 ? myRating : 0,
    myRatings: myRatings || null,
    submittedBy: resolveSubmitterDisplayName(product, nicknameMap),
    submittedAt: product.submittedAt,
    status: product.status,
    rejectReason: product.rejectReason || "",
    reviewedAt: product.reviewedAt || "",
    campaign: isKnownCampaign(product.campaign) ? product.campaign : "",
    campaignLabel: campaignCache.labels[product.campaign] || "",
    isSpecial: isKnownCampaign(product.campaign) || product.isSpecial === true,
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
  const entries = Object.values(ratings)
    .map((raw) => normalizeUserRatings(raw))
    .filter(Boolean);

  const emptyDims = Object.fromEntries(RATING_DIMENSION_KEYS.map((key) => [key, 0]));
  if (!entries.length) {
    return { avgRating: 0, ratingCount: 0, avgRatings: emptyDims };
  }

  const dimSums = Object.fromEntries(RATING_DIMENSION_KEYS.map((key) => [key, 0]));
  let overallSum = 0;
  for (const entry of entries) {
    let userSum = 0;
    for (const key of RATING_DIMENSION_KEYS) {
      dimSums[key] += entry[key];
      userSum += entry[key];
    }
    overallSum += userSum / RATING_DIMENSION_KEYS.length;
  }

  const ratingCount = entries.length;
  const avgRatings = Object.fromEntries(
    RATING_DIMENSION_KEYS.map((key) => [
      key,
      Math.round((dimSums[key] / ratingCount) * 10) / 10,
    ]),
  );
  const avgRating = Math.round((overallSum / ratingCount) * 10) / 10;
  return { avgRating, ratingCount, avgRatings };
}

function sortProducts(products) {
  return products.sort((a, b) => {
    const aHidden = a.rankHidden === true;
    const bHidden = b.rankHidden === true;
    if (aHidden !== bHidden) return aHidden ? 1 : -1;

    const aPinned = a.rankPinned === true;
    const bPinned = b.rankPinned === true;
    if (aPinned !== bPinned) return aPinned ? -1 : 1;

    const weightDiff = (Number(b.rankWeight) || 0) - (Number(a.rankWeight) || 0);
    if (weightDiff !== 0) return weightDiff;

    const aStats = computeRating(a);
    const bStats = computeRating(b);
    const ratingDiff = bStats.avgRating - aStats.avgRating;
    if (ratingDiff !== 0) return ratingDiff;
    const countDiff = bStats.ratingCount - aStats.ratingCount;
    if (countDiff !== 0) return countDiff;
    const voteDiff =
      (Array.isArray(b.voters) ? b.voters.length : 0) -
      (Array.isArray(a.voters) ? a.voters.length : 0);
    if (voteDiff !== 0) return voteDiff;
    return (b.submittedAt || "").localeCompare(a.submittedAt || "");
  });
}

app.get("/api/health", async (_req, res) => {
  try {
    await dbQuery("SELECT 1 AS ok");
    res.json({
      ok: true,
      db: "mysql",
      database: process.env.MYSQL_DATABASE || "vibebuilding",
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
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

app.get("/api/category-options", async (_req, res) => {
  try {
    res.json({ categories: categoryCache.enabledNames });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/categories", requireAdmin, async (_req, res) => {
  try {
    const categories = (await readCategories())
      .sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0))
      .map(toPublicCategory);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/categories", requireAdmin, async (req, res) => {
  try {
    const name = (req.body?.name || "").trim();
    const sort = Number(req.body?.sort);
    const enabled = req.body?.enabled !== false;
    if (!name) {
      return res.status(400).json({ error: "请填写分类名称" });
    }
    if (name.length > 20) {
      return res.status(400).json({ error: "分类名称不能超过 20 字" });
    }

    const categories = await readCategories();
    if (categories.some((item) => item.name === name)) {
      return res.status(400).json({ error: "该分类已存在" });
    }

    const idBase = (req.body?.id || name)
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff_-]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32);
    let id = idBase || `cat-${crypto.randomUUID().slice(0, 8)}`;
    if (categories.some((item) => item.id === id)) {
      id = `${id}-${crypto.randomUUID().slice(0, 4)}`;
    }

    const now = new Date().toISOString();
    const category = {
      id,
      name,
      sort: Number.isFinite(sort) ? sort : categories.length + 1,
      enabled,
      createdAt: now,
      updatedAt: now,
    };
    categories.push(category);
    await writeCategories(categories);
    res.json({ message: "分类已添加", category: toPublicCategory(category) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/admin/categories/:id", requireAdmin, async (req, res) => {
  try {
    const categories = await readCategories();
    const index = categories.findIndex((item) => item.id === req.params.id);
    if (index < 0) {
      return res.status(404).json({ error: "分类不存在" });
    }

    const name = (req.body?.name || "").trim();
    if (!name) {
      return res.status(400).json({ error: "请填写分类名称" });
    }
    if (name.length > 20) {
      return res.status(400).json({ error: "分类名称不能超过 20 字" });
    }
    if (
      categories.some(
        (item, i) => i !== index && item.name === name,
      )
    ) {
      return res.status(400).json({ error: "该分类已存在" });
    }

    const sort = Number(req.body?.sort);
    categories[index] = {
      ...categories[index],
      name,
      sort: Number.isFinite(sort) ? sort : categories[index].sort,
      enabled: req.body?.enabled !== false,
      updatedAt: new Date().toISOString(),
    };
    await writeCategories(categories);
    res.json({
      message: "分类已更新",
      category: toPublicCategory(categories[index]),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/admin/categories/:id", requireAdmin, async (req, res) => {
  try {
    const categories = await readCategories();
    const index = categories.findIndex((item) => item.id === req.params.id);
    if (index < 0) {
      return res.status(404).json({ error: "分类不存在" });
    }
    if (categories.length <= 1) {
      return res.status(400).json({ error: "至少保留一个分类" });
    }

    const [removed] = categories.splice(index, 1);
    await writeCategories(categories);
    res.json({ message: "分类已删除", category: toPublicCategory(removed) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- 活动配置 API ---------------- */

// 公开：获取启用的活动（按 sort 升序）—— 当前先全部展示
app.get("/api/campaigns", async (_req, res) => {
  try {
    const statsMap = await getCampaignStatsMap();
    const campaigns = (await readCampaigns())
      .filter((item) => item.enabled !== false)
      .sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0))
      .map((item) => withCampaignStats(item, statsMap));
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/campaigns/:id", async (req, res) => {
  try {
    const campaign = await getCampaignById(req.params.id);
    if (!campaign || campaign.enabled === false) {
      return res.status(404).json({ error: "活动不存在或已下线" });
    }
    const statsMap = await getCampaignStatsMap();
    res.json(withCampaignStats(campaign, statsMap));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/campaigns", requireAdmin, async (_req, res) => {
  try {
    const statsMap = await getCampaignStatsMap();
    const campaigns = (await readCampaigns())
      .sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0))
      .map((item) =>
        withCampaignStats(item, statsMap, { includePending: true }),
      );
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/campaigns", requireAdmin, async (req, res) => {
  try {
    const fields = pickCampaignFields(req.body || {});
    const sort = Number(req.body?.sort);
    const enabled = req.body?.enabled !== false;
    if (!fields.title) {
      return res.status(400).json({ error: "请填写活动名称" });
    }

    const campaigns = await readCampaigns();
    const idBase = (req.body?.id || fields.title)
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff_-]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32);
    let id = idBase || `campaign-${crypto.randomUUID().slice(0, 8)}`;
    if (campaigns.some((item) => item.id === id)) {
      id = `${id}-${crypto.randomUUID().slice(0, 4)}`;
    }

    const now = new Date().toISOString();
    const campaign = {
      id,
      ...fields,
      sort: Number.isFinite(sort) ? sort : campaigns.length + 1,
      enabled,
      createdAt: now,
      updatedAt: now,
    };
    campaigns.push(campaign);
    await writeCampaigns(campaigns);
    res.json({ message: "活动已添加", campaign: toPublicCampaign(campaign) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/admin/campaigns/:id", requireAdmin, async (req, res) => {
  try {
    const campaigns = await readCampaigns();
    const index = campaigns.findIndex((item) => item.id === req.params.id);
    if (index < 0) {
      return res.status(404).json({ error: "活动不存在" });
    }

    const fields = pickCampaignFields(req.body || {}, campaigns[index]);
    if (!fields.title) {
      return res.status(400).json({ error: "请填写活动名称" });
    }

    const sort = Number(req.body?.sort);
    campaigns[index] = {
      ...campaigns[index],
      ...fields,
      sort: Number.isFinite(sort) ? sort : campaigns[index].sort,
      enabled:
        req.body?.enabled !== undefined
          ? req.body.enabled !== false
          : campaigns[index].enabled !== false,
      updatedAt: new Date().toISOString(),
    };
    await writeCampaigns(campaigns);
    res.json({
      message: "活动已更新",
      campaign: toPublicCampaign(campaigns[index]),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/admin/campaigns/:id", requireAdmin, async (req, res) => {
  try {
    const campaigns = await readCampaigns();
    const index = campaigns.findIndex((item) => item.id === req.params.id);
    if (index < 0) {
      return res.status(404).json({ error: "活动不存在" });
    }
    const [removed] = campaigns.splice(index, 1);
    await writeCampaigns(campaigns);
    res.json({ message: "活动已删除", campaign: toPublicCampaign(removed) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
  imageUpload.single("image")(req, res, async (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "图片不能超过 2MB"
          : err.message || "图片上传失败";
      return res.status(400).json({ error: message });
    }
    if (!req.file?.buffer) {
      return res.status(400).json({ error: "请选择要上传的图片" });
    }
    try {
      const filename = makeUploadFilename(req.file.originalname);
      await saveUpload({
        id: filename,
        mimeType: req.file.mimetype,
        data: req.file.buffer,
      });
      // 走 /api/uploads，确保仅反代 /api 的远程 Nginx 也能实时预览
      res.json({ url: `/api/uploads/${filename}` });
    } catch (saveErr) {
      res.status(500).json({ error: saveErr.message || "图片保存失败" });
    }
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
    const campaign = (req.query.campaign || "").trim();
    const specialOnly = req.query.special === "true";
    const rangeStart = getRangeStart(range);

    const all = await listProducts();
    const topics = await readTopics();
    const topicMap = Object.fromEntries(topics.map((t) => [t.id, t.name || ""]));
    const nicknameMap = await getUsersNicknameMap();
    const approved = all.filter((product) => (product.status || "approved") === "approved");
    const filtered = approved.filter((product) => {
      if (product.rankHidden === true) return false;
      if (category && !getProductCategories(product).includes(category)) return false;
      if (topicId && !getProductTopicIds(product).includes(topicId)) return false;
      if (campaign) {
        if (product.campaign !== campaign) return false;
      } else if (specialOnly) {
        const inCampaign = isKnownCampaign(product.campaign);
        if (!inCampaign && product.isSpecial !== true) return false;
      }
      if (rangeStart > 0) {
        const submittedTime = new Date(product.submittedAt || 0).getTime();
        if (submittedTime < rangeStart) return false;
      }
      if (keyword) {
        const haystack = [
          product.name,
          product.tagline,
          product.description,
          ...getProductCategories(product),
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
      const { avgRating, ratingCount: count } = computeRating(product);
      if (count > 0) {
        ratingSum += avgRating * count;
        ratingCount += count;
      }
      if ((product.submittedAt || "") >= weekAgo) recentResources7d += 1;
      for (const cat of getProductCategories(product)) {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      }
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
    await writeProduct(product);

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
    await writeProduct(product);

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
    const topics = await readTopics();
    const topicMap = Object.fromEntries(topics.map((t) => [t.id, t.name || ""]));
    const mine = all
      .filter((product) => product.submittedBy === req.user.username)
      .sort((a, b) => (b.submittedAt || "").localeCompare(a.submittedAt || ""))
      .map((product) => toPublicProduct(product, req.user, topicMap));
    res.json(mine);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/products", requireAuth, async (req, res) => {
  try {
    const {
      name,
      tagline,
      description,
      url,
      category,
      categories,
      imageUrl,
      topicId,
      topicName,
      campaign,
    } = req.body || {};

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

    const requestedCategories = [];
    const rawCategories = Array.isArray(categories)
      ? categories
      : category
        ? [category]
        : [];
    for (const raw of rawCategories) {
      const name = (raw || "").trim();
      if (isEnabledCategory(name) && !requestedCategories.includes(name)) {
        requestedCategories.push(name);
      }
    }
    if (requestedCategories.length === 0) {
      return res.status(400).json({ error: "请至少选择一个分类" });
    }

    const requestedCampaign = (campaign || "").trim();
    if (requestedCampaign && !isKnownCampaign(requestedCampaign)) {
      return res.status(400).json({ error: "所选活动不存在或已下线" });
    }

    let resolvedTopicId = "";
    let topicsForMap = null;
    try {
      const resolved = await resolveOrCreateTopic(
        { topicId, topicName },
        req.user,
      );
      resolvedTopicId = resolved.topicId;
      topicsForMap = resolved.topics;
    } catch (topicErr) {
      return res
        .status(topicErr.status || 400)
        .json({ error: topicErr.message || "话题处理失败" });
    }

    const isAdmin = req.user.role === "admin";
    const now = new Date().toISOString();

    const product = {
      id: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
      name: trimmedName,
      tagline: trimmedTagline,
      description: trimmedDescription,
      url: trimmedUrl,
      category: requestedCategories[0],
      categories: requestedCategories,
      campaign: requestedCampaign,
      topicId: resolvedTopicId,
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

    await writeProduct(product);

    if (!topicsForMap) topicsForMap = await readTopics();
    const topicMap = Object.fromEntries(
      topicsForMap.map((t) => [t.id, t.name || ""]),
    );
    res.json({
      message: isAdmin
        ? "发布成功，资源已上架"
        : "提交成功，等待管理员审核",
      product: toPublicProduct(product, req.user, topicMap),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/products/:id", requireAuth, async (req, res) => {
  try {
    const product = await getProduct(req.params.id);
    const isOwner = product.submittedBy === req.user.username;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "只能编辑自己上传的资源" });
    }

    const {
      name,
      tagline,
      description,
      url,
      category,
      categories,
      imageUrl,
      topicId,
      topicName,
      campaign,
    } = req.body || {};

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

    const previousCategories = getProductCategories(product);
    const requestedCategories = [];
    const rawCategories = Array.isArray(categories)
      ? categories
      : category
        ? [category]
        : [];
    for (const raw of rawCategories) {
      const catName = (raw || "").trim();
      const allowed =
        isEnabledCategory(catName) || previousCategories.includes(catName);
      if (catName && allowed && !requestedCategories.includes(catName)) {
        requestedCategories.push(catName);
      }
    }
    if (requestedCategories.length === 0) {
      return res.status(400).json({ error: "请至少选择一个分类" });
    }

    const requestedCampaign = (campaign || "").trim();
    if (requestedCampaign && !isKnownCampaign(requestedCampaign)) {
      return res.status(400).json({ error: "所选活动不存在或已下线" });
    }

    let resolvedTopicId = "";
    let topicsForMap = null;
    try {
      const resolved = await resolveOrCreateTopic(
        { topicId, topicName },
        req.user,
      );
      resolvedTopicId = resolved.topicId;
      topicsForMap = resolved.topics;
    } catch (topicErr) {
      return res
        .status(topicErr.status || 400)
        .json({ error: topicErr.message || "话题处理失败" });
    }

    const now = new Date().toISOString();
    const prevStatus = product.status || "approved";
    let nextStatus = prevStatus;
    let rejectReason = product.rejectReason || "";
    let reviewedAt = product.reviewedAt || "";
    let reviewedBy = product.reviewedBy || "";

    if (!isAdmin && prevStatus === "rejected") {
      nextStatus = "pending";
      rejectReason = "";
      reviewedAt = "";
      reviewedBy = "";
    }

    product.name = trimmedName;
    product.tagline = trimmedTagline;
    product.description = trimmedDescription;
    product.url = trimmedUrl;
    product.category = requestedCategories[0];
    product.categories = requestedCategories;
    product.campaign = requestedCampaign;
    product.topicId = resolvedTopicId;
    product.imageUrl = trimmedImageUrl;
    product.color = product.color || pickAvatarColor(trimmedName);
    product.status = nextStatus;
    product.rejectReason = rejectReason;
    product.reviewedAt = reviewedAt;
    product.reviewedBy = reviewedBy;
    product.updatedAt = now;

    await writeProduct(product);

    if (!topicsForMap) topicsForMap = await readTopics();
    const topicMap = Object.fromEntries(
      topicsForMap.map((t) => [t.id, t.name || ""]),
    );
    res.json({
      message:
        !isAdmin && nextStatus === "pending" && prevStatus === "rejected"
          ? "已保存并重新提交审核"
          : "保存成功",
      product: toPublicProduct(product, req.user, topicMap),
    });
  } catch (err) {
    if (err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "资源不存在" });
    }
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/products/:id/vote", requireAuth, async (req, res) => {
  try {
    const product = await getProduct(req.params.id);

    if ((product.status || "approved") !== "approved") {
      return res.status(403).json({ error: "该资源尚未上架" });
    }

    const scores = parseVotePayload(req.body || {});
    if (!scores) {
      return res.status(400).json({
        error: "请为创意性、完成度、实用性、体验感各打 1-5 分",
      });
    }

    const voters = Array.isArray(product.voters) ? product.voters : [];

    if (voters.includes(req.user.id)) {
      return res.status(400).json({ error: "您已经评价过了" });
    }

    product.voters = [...voters, req.user.id];
    product.ratings = { ...(product.ratings || {}), [req.user.id]: scores };

    await writeProduct(product);

    const { avgRating, ratingCount, avgRatings } = computeRating(product);
    const myRating = overallFromRatings(scores);

    res.json({
      message: "评价成功",
      voted: true,
      voteCount: product.voters.length,
      avgRating,
      avgRatings,
      ratingCount,
      myRating,
      myRatings: scores,
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

    await writeTopicPost(post);
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
    // 话题名统一存裸名：输入若带首尾 # 则剥离，展示层包装成 #话题
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

    await upsertTopic(topic);

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
    await upsertTopic(topic);

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
    await writeTopicPost(post);

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
    await writeTopicPost(post);
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
    await writeTopicPost(post);

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
    const q = String(req.query.q || "").trim().toLowerCase();
    const campaign = String(req.query.campaign || "").trim();
    const category = String(req.query.category || "").trim();
    const all = await listProducts();
    let filtered =
      status === "all" ? all : all.filter((p) => (p.status || "approved") === status);
    if (campaign) {
      filtered = filtered.filter((p) => String(p.campaign || "") === campaign);
    }
    if (category) {
      filtered = filtered.filter((p) => getProductCategories(p).includes(category));
    }
    if (q) {
      filtered = filtered.filter((p) => {
        const hay = [
          p.name,
          p.tagline,
          p.description,
          p.submittedBy,
          ...(getProductCategories(p) || []),
        ]
          .filter(Boolean)
          .join("\n")
          .toLowerCase();
        return hay.includes(q);
      });
    }
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
    await writeProduct(product);
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
    await writeProduct(product);
    res.json({ message: "已拒绝", product: toPublicProduct(product, req.user) });
  } catch {
    res.status(404).json({ error: "资源不存在" });
  }
});

// 设置/取消专题活动标记
app.post("/api/admin/products/:id/special", requireAdmin, async (req, res) => {
  try {
    const product = await getProduct(req.params.id);
    const campaign = (req.body?.campaign || "").trim();
    if (campaign && !isKnownCampaign(campaign)) {
      return res.status(400).json({ error: "活动类型无效" });
    }
    if (campaign) {
      product.campaign = campaign;
      product.isSpecial = true;
    } else if (req.body?.isSpecial === true) {
      product.campaign =
        product.campaign && isKnownCampaign(product.campaign)
          ? product.campaign
          : campaignCache.ids[0] || "madao";
      product.isSpecial = true;
    } else {
      product.campaign = "";
      product.isSpecial = false;
    }
    await writeProduct(product);
    const label = campaignCache.labels[product.campaign] || "";
    res.json({
      message: product.campaign ? `已加入${label}` : "已取消活动",
      product: toPublicProduct(product, req.user),
    });
  } catch {
    res.status(404).json({ error: "资源不存在" });
  }
});

app.post("/api/admin/products/:id/rank", requireAdmin, async (req, res) => {
  try {
    const product = await getProduct(req.params.id);
    if (Object.prototype.hasOwnProperty.call(req.body || {}, "rankPinned")) {
      product.rankPinned = req.body.rankPinned === true;
    }
    if (Object.prototype.hasOwnProperty.call(req.body || {}, "rankHidden")) {
      product.rankHidden = req.body.rankHidden === true;
    }
    if (Object.prototype.hasOwnProperty.call(req.body || {}, "rankWeight")) {
      const weight = Number(req.body.rankWeight);
      if (!Number.isFinite(weight)) {
        return res.status(400).json({ error: "权重需为数字" });
      }
      product.rankWeight = Math.max(-9999, Math.min(9999, Math.round(weight)));
    }
    await writeProduct(product);
    res.json({
      message: "榜单设置已更新",
      product: toPublicProduct(product, req.user),
    });
  } catch {
    res.status(404).json({ error: "资源不存在" });
  }
});

app.get("/api/admin/rankings", requireAdmin, async (req, res) => {
  try {
    const campaign = String(req.query.campaign || "").trim();
    const all = await listProducts();
    let list = all.filter((p) => (p.status || "approved") === "approved");
    if (campaign) {
      list = list.filter((p) => String(p.campaign || "") === campaign);
    }
    const sorted = sortProducts(list.slice());
    res.json(
      sorted.map((product, index) => ({
        ...toPublicProduct(product, req.user),
        rank: index + 1,
      })),
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/votes", requireAdmin, async (req, res) => {
  try {
    const q = String(req.query.q || "").trim().toLowerCase();
    const productId = String(req.query.productId || "").trim();
    const [products, usersById] = await Promise.all([
      listProducts(),
      getUsersIdMap(),
    ]);
    const rows = [];
    for (const product of products) {
      if (productId && product.id !== productId) continue;
      const voters = Array.isArray(product.voters) ? product.voters : [];
      const ratings = product.ratings || {};
      for (const userId of voters) {
        const scores = normalizeUserRatings(ratings[userId]);
        if (!scores) continue;
        const user = usersById[userId];
        const row = {
          id: `${product.id}:${userId}`,
          productId: product.id,
          productName: product.name || "",
          userId,
          username: user?.username || "",
          nickname: user?.nickname || user?.username || "",
          ratings: scores,
          overall: overallFromRatings(scores),
          votedAt: product.reviewedAt || product.submittedAt || "",
        };
        if (q) {
          const hay = [row.productName, row.username, row.nickname, row.userId]
            .join("\n")
            .toLowerCase();
          if (!hay.includes(q)) continue;
        }
        rows.push(row);
      }
    }
    rows.sort((a, b) => (b.overall || 0) - (a.overall || 0));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete(
  "/api/admin/votes/:productId/:userId",
  requireAdmin,
  async (req, res) => {
    try {
      const product = await getProduct(req.params.productId);
      const userId = req.params.userId;
      const voters = Array.isArray(product.voters) ? product.voters : [];
      if (!voters.includes(userId)) {
        return res.status(404).json({ error: "未找到该投票记录" });
      }
      product.voters = voters.filter((id) => id !== userId);
      if (product.ratings && typeof product.ratings === "object") {
        const next = { ...product.ratings };
        delete next[userId];
        product.ratings = next;
      }
      await writeProduct(product);
      const { avgRating, ratingCount, avgRatings } = computeRating(product);
      res.json({
        message: "已删除投票",
        voteCount: product.voters.length,
        avgRating,
        avgRatings,
        ratingCount,
      });
    } catch {
      res.status(404).json({ error: "资源不存在" });
    }
  },
);

app.get("/api/share-config", async (_req, res) => {
  try {
    res.json(await readShareConfig());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/share-config", requireAdmin, async (_req, res) => {
  try {
    res.json(await readShareConfig());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/admin/share-config", requireAdmin, async (req, res) => {
  try {
    const next = await writeShareConfig(req.body || {});
    res.json({ message: "分享配置已保存", config: next });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/shares", requireAdmin, async (req, res) => {
  try {
    const q = String(req.query.q || "").trim().toLowerCase();
    const platform = String(req.query.platform || "").trim();
    const shares = await readShares();
    const stats = Object.fromEntries(
      ["all", ...SHARE_PLATFORM_IDS].map((key) => [key, 0]),
    );
    stats.all = shares.length;
    for (const item of shares) {
      const key = SHARE_PLATFORM_IDS.includes(item.platform)
        ? item.platform
        : "";
      if (key) stats[key] += 1;
    }

    let filtered = shares;
    if (platform && SHARE_PLATFORM_IDS.includes(platform)) {
      filtered = filtered.filter((item) => item.platform === platform);
    }
    if (q) {
      filtered = filtered.filter((item) => {
        const hay = [
          item.productName,
          item.username,
          item.nickname,
          item.productId,
          platformLabel(item.platform),
          item.platform,
        ]
          .filter(Boolean)
          .join("\n")
          .toLowerCase();
        return hay.includes(q);
      });
    }
    filtered.sort((a, b) =>
      String(b.createdAt || "").localeCompare(String(a.createdAt || "")),
    );
    res.json({ items: filtered, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/admin/shares/:id", requireAdmin, async (req, res) => {
  try {
    const shares = await readShares();
    const next = shares.filter((item) => item.id !== req.params.id);
    if (next.length === shares.length) {
      return res.status(404).json({ error: "分享记录不存在" });
    }
    const removed = shares.find((item) => item.id === req.params.id);
    await writeShares(next);
    if (removed?.productId) {
      try {
        const product = await getProduct(removed.productId);
        product.shareCount = Math.max(0, (Number(product.shareCount) || 0) - 1);
        await writeProduct(product);
      } catch {
        /* product may be gone */
      }
    }
    res.json({ message: "已删除分享记录" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/products/:id/share", attachUserIfPresent, async (req, res) => {
  try {
    const product = await getProduct(req.params.id);
    if ((product.status || "approved") !== "approved") {
      return res.status(403).json({ error: "该资源尚未上架" });
    }
    const usersById = req.user ? await getUsersIdMap() : {};
    const user = req.user ? usersById[req.user.id] : null;
    const platformRaw = String(req.body?.platform || "").trim().slice(0, 32);
    const platform = SHARE_PLATFORM_IDS.includes(platformRaw) ? platformRaw : "";
    const record = {
      id: crypto.randomUUID(),
      productId: product.id,
      productName: product.name || "",
      userId: req.user?.id || "",
      username: user?.username || req.user?.username || "访客",
      nickname: user?.nickname || req.user?.username || "访客",
      platform,
      createdAt: new Date().toISOString(),
    };
    const shares = await readShares();
    shares.push(record);
    await writeShares(shares);
    product.shareCount = (Number(product.shareCount) || 0) + 1;
    await writeProduct(product);
    res.json({
      message: "分享已记录",
      shareCount: product.shareCount,
      share: record,
    });
  } catch {
    res.status(404).json({ error: "资源不存在" });
  }
});

app.delete("/api/products/:id", requireAdmin, async (req, res) => {
  try {
    const product = await getProduct(req.params.id);
    const uploadName = localUploadFilename(product.imageUrl);
    if (uploadName) {
      await deleteUpload(uploadName);
      await fs.rm(path.join(UPLOADS_DIR, uploadName), { force: true });
    }
    await deleteProduct(req.params.id);
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
