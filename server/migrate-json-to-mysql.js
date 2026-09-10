/**
 * 将 server/storage 下的历史 JSON / 磁盘图片导入 MySQL。
 *
 * 用法：
 *   node migrate-json-to-mysql.js
 *   node migrate-json-to-mysql.js --force   # 覆盖已有同名数据
 *
 * 环境变量与服务端相同：MYSQL_HOST / MYSQL_PORT / MYSQL_USER / MYSQL_PASSWORD / MYSQL_DATABASE
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { initDb, query } from "./db.js";
import {
  saveUser,
  updateUser,
  findUserByUsername,
  writeBanners,
  writeNavs,
  writeCampaigns,
  writeCategories,
  writeTopics,
  writeTopicPost,
  writeProduct,
  writeShares,
  writeShareConfig,
  writeCampaignZone,
  saveUpload,
  getUpload,
  listUsers,
  listProducts,
  listTopicPosts,
  readBanners,
  readNavs,
  readCampaigns,
  readCategories,
  readTopics,
  readShares,
} from "./store.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORAGE_DIR = path.join(__dirname, "storage");

function normalizeImageUrl(url) {
  const value = String(url || "").trim();
  if (!value) return "";
  if (value.startsWith("/uploads/")) {
    return `/api${value}`;
  }
  return value;
}

async function readJson(filePath, fallback = null) {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function countTable(table) {
  const rows = await query(`SELECT COUNT(*) AS c FROM \`${table}\``);
  return Number(rows[0]?.c) || 0;
}

async function listJsonFiles(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.endsWith(".json"))
      .map((e) => path.join(dir, e.name));
  } catch {
    return [];
  }
}

async function migrateUsers({ force }) {
  const data = await readJson(path.join(STORAGE_DIR, "users.json"), { users: [] });
  const users = Array.isArray(data?.users)
    ? data.users
    : Array.isArray(data)
      ? data
      : [];
  if (!users.length) {
    console.log("[migrate] users: skip (no JSON)");
    return 0;
  }

  let n = 0;
  for (const user of users) {
    if (!user?.id || !user?.username || !user?.passwordHash) continue;
    const payload = {
      id: user.id,
      username: user.username,
      nickname: user.nickname || user.username,
      passwordHash: user.passwordHash,
      role: user.role || "user",
      createdAt: user.createdAt || new Date().toISOString(),
    };

    const byName = await findUserByUsername(user.username);
    if (byName) {
      if (!force && byName.id !== user.id) {
        // 库里已有同名用户（例如启动种子 admin），默认保留
        continue;
      }
      await updateUser({ ...payload, id: byName.id });
      n += 1;
      continue;
    }

    await saveUser(payload);
    n += 1;
  }
  console.log(`[migrate] users: imported/updated ${n}`);
  return n;
}

async function migrateSimpleList({
  name,
  file,
  reader,
  writer,
  force,
  mapItem,
  shouldReplace,
}) {
  const data = await readJson(path.join(STORAGE_DIR, file), null);
  const list = Array.isArray(data) ? data : null;
  if (!list || list.length === 0) {
    console.log(`[migrate] ${name}: skip (no JSON)`);
    return 0;
  }
  const existing = await reader();
  const replace =
    force ||
    existing.length === 0 ||
    (typeof shouldReplace === "function" && shouldReplace(existing));
  if (!replace) {
    console.log(`[migrate] ${name}: keep DB (${existing.length}), skip JSON (${list.length})`);
    return 0;
  }
  const mapped = mapItem ? list.map(mapItem) : list;
  await writer(mapped);
  console.log(`[migrate] ${name}: imported ${mapped.length}`);
  return mapped.length;
}

async function migrateTopics({ force }) {
  const list = await readJson(path.join(STORAGE_DIR, "topics.json"), null);
  if (!Array.isArray(list) || list.length === 0) {
    console.log("[migrate] topics: skip (no JSON)");
    return 0;
  }
  const existing = await readTopics();
  if (!force && existing.length > 0) {
    console.log(`[migrate] topics: keep DB (${existing.length}), skip JSON (${list.length})`);
    return 0;
  }
  await writeTopics(list);
  console.log(`[migrate] topics: imported ${list.length}`);
  return list.length;
}

async function migrateProducts({ force }) {
  const files = await listJsonFiles(path.join(STORAGE_DIR, "products"));
  if (!files.length) {
    console.log("[migrate] products: skip (no JSON)");
    return 0;
  }
  const existing = await listProducts();
  const existingIds = new Set(existing.map((p) => p.id));
  if (!force && existing.length > 0) {
    let added = 0;
    for (const file of files) {
      const product = await readJson(file, null);
      if (!product?.id || existingIds.has(product.id)) continue;
      product.imageUrl = normalizeImageUrl(product.imageUrl);
      await writeProduct(product);
      added += 1;
    }
    console.log(`[migrate] products: added missing ${added} (DB had ${existing.length})`);
    return added;
  }

  let n = 0;
  for (const file of files) {
    const product = await readJson(file, null);
    if (!product?.id) continue;
    product.imageUrl = normalizeImageUrl(product.imageUrl);
    await writeProduct(product);
    n += 1;
  }
  console.log(`[migrate] products: imported ${n}`);
  return n;
}

async function migrateTopicPosts({ force }) {
  const files = await listJsonFiles(path.join(STORAGE_DIR, "topic-posts"));
  if (!files.length) {
    console.log("[migrate] topic-posts: skip (no JSON)");
    return 0;
  }
  const existing = await listTopicPosts();
  const existingIds = new Set(existing.map((p) => p.id));
  if (!force && existing.length > 0) {
    let added = 0;
    for (const file of files) {
      const post = await readJson(file, null);
      if (!post?.id || existingIds.has(post.id)) continue;
      post.imageUrl = normalizeImageUrl(post.imageUrl);
      await writeTopicPost(post);
      added += 1;
    }
    console.log(`[migrate] topic-posts: added missing ${added}`);
    return added;
  }

  let n = 0;
  for (const file of files) {
    const post = await readJson(file, null);
    if (!post?.id) continue;
    post.imageUrl = normalizeImageUrl(post.imageUrl);
    await writeTopicPost(post);
    n += 1;
  }
  console.log(`[migrate] topic-posts: imported ${n}`);
  return n;
}

async function migrateShares({ force }) {
  const list = await readJson(path.join(STORAGE_DIR, "shares.json"), null);
  if (!Array.isArray(list) || list.length === 0) {
    console.log("[migrate] shares: skip (no JSON)");
    return 0;
  }
  const existing = await readShares();
  if (!force && existing.length > 0) {
    console.log(`[migrate] shares: keep DB (${existing.length})`);
    return 0;
  }
  await writeShares(list);
  console.log(`[migrate] shares: imported ${list.length}`);
  return list.length;
}

async function migrateShareConfig({ force }) {
  const data = await readJson(path.join(STORAGE_DIR, "share-config.json"), null);
  if (!data || typeof data !== "object") {
    console.log("[migrate] share-config: skip (no JSON)");
    return 0;
  }
  const count = await countTable("share_config");
  if (!force && count > 0) {
    console.log("[migrate] share-config: keep DB");
    return 0;
  }
  await writeShareConfig(data);
  console.log("[migrate] share-config: imported");
  return 1;
}

async function migrateCampaignZone({ force }) {
  const data = await readJson(path.join(STORAGE_DIR, "campaign-zone.json"), null);
  if (!data || typeof data !== "object") {
    console.log("[migrate] campaign-zone: skip (no JSON)");
    return 0;
  }
  const count = await countTable("campaign_zone");
  if (!force && count > 0) {
    console.log("[migrate] campaign-zone: keep DB");
    return 0;
  }
  await writeCampaignZone({
    title: data.title || "活动专区",
    enabled: data.enabled !== false,
  });
  console.log("[migrate] campaign-zone: imported");
  return 1;
}

function guessMime(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".gif") return "image/gif";
  if (ext === ".webp") return "image/webp";
  return "application/octet-stream";
}

async function migrateUploads({ force }) {
  const dir = path.join(STORAGE_DIR, "uploads");
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    console.log("[migrate] uploads: skip (no dir)");
    return 0;
  }

  let n = 0;
  for (const entry of entries) {
    if (!entry.isFile() || entry.name.startsWith(".")) continue;
    const id = entry.name;
    if (!force) {
      const existing = await getUpload(id);
      if (existing) continue;
    }
    const data = await fs.readFile(path.join(dir, id));
    await saveUpload({ id, mimeType: guessMime(id), data });
    n += 1;
  }
  console.log(`[migrate] uploads: imported ${n} files into MySQL`);
  return n;
}

export async function migrateJsonToMysql({ force = false } = {}) {
  console.log(
    `[migrate] start from ${STORAGE_DIR} (force=${force ? "yes" : "no"})`,
  );

  await migrateUsers({ force });
  await migrateSimpleList({
    name: "banners",
    file: "banners.json",
    reader: readBanners,
    writer: writeBanners,
    force,
    shouldReplace: (existing) =>
      existing.every((banner) => {
        const title = String(banner.title || "").trim();
        const imageUrl = String(banner.imageUrl || "").trim();
        return (
          banner.id === "banner-smoke" ||
          title.length <= 2 ||
          !imageUrl ||
          imageUrl === "/x.png"
        );
      }),
    mapItem: (item) => ({
      ...item,
      imageUrl: normalizeImageUrl(item.imageUrl),
    }),
  });
  await migrateSimpleList({
    name: "navs",
    file: "navs.json",
    reader: readNavs,
    writer: writeNavs,
    force,
  });
  await migrateSimpleList({
    name: "campaigns",
    file: "campaigns.json",
    reader: readCampaigns,
    writer: writeCampaigns,
    force,
    mapItem: (item) => ({
      ...item,
      coverImage: normalizeImageUrl(item.coverImage),
    }),
  });
  await migrateSimpleList({
    name: "categories",
    file: "categories.json",
    reader: readCategories,
    writer: writeCategories,
    force,
  });
  await migrateTopics({ force });
  await migrateProducts({ force });
  await migrateTopicPosts({ force });
  await migrateShares({ force });
  await migrateShareConfig({ force });
  await migrateCampaignZone({ force });
  await migrateUploads({ force });

  console.log("[migrate] done");
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isCli) {
  const force = process.argv.includes("--force");
  try {
    await initDb();
    await migrateJsonToMysql({ force });
    process.exit(0);
  } catch (err) {
    console.error("[migrate] failed:", err);
    process.exit(1);
  }
}
