/**
 * 清空全部应用，并按 校园/社交/公益/健身/户外 写入样例数据。
 * 用法：node seed-scene-products.js
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";
import { initDb, pool, query } from "./db.js";
import {
  deleteProduct,
  listProducts,
  listUsers,
  readTopics,
  upsertTopic,
  writeProduct,
} from "./store.js";
import { BUILD_SCENES } from "./buildScenes.js";
import {
  SEED_APPS,
  SCENE_CATEGORY,
  SCENE_COLOR,
  appDeployUrl,
} from "./sceneSeedData.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRODUCTS_DIR = path.join(__dirname, "storage", "products");

function makeId(seed) {
  return createHash("md5").update(seed).digest("hex").slice(0, 12);
}

function topicIdFor(name) {
  return `topic-seed-${createHash("md5").update(name).digest("hex").slice(0, 10)}`;
}

async function ensureTopic(name, sceneName) {
  const topics = await readTopics();
  const existing = topics.find(
    (t) => (t.name || "").trim().toLowerCase() === name.trim().toLowerCase(),
  );
  if (existing) return existing;

  const topic = {
    id: topicIdFor(name),
    name,
    description: `${sceneName}场景话题 · ${name}`,
    coverImage: "",
    color: "#625cfc",
    region: "全国",
    createdBy: "admin",
    createdAt: new Date().toISOString(),
    followerIds: [],
  };
  await upsertTopic(topic);
  return topic;
}

async function clearLegacyJson() {
  try {
    const files = await fs.readdir(PRODUCTS_DIR);
    await Promise.all(
      files
        .filter((f) => f.endsWith(".json"))
        .map((f) => fs.unlink(path.join(PRODUCTS_DIR, f))),
    );
    console.log(`[seed] cleared legacy JSON in ${PRODUCTS_DIR}`);
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
    await fs.mkdir(PRODUCTS_DIR, { recursive: true });
  }
}

async function clearProducts() {
  const list = await listProducts();
  for (const p of list) {
    await deleteProduct(p.id);
  }
  // 顺带清掉指向旧应用的分享记录
  await query("DELETE FROM shares");
  console.log(`[seed] deleted ${list.length} products (+ shares)`);
}

async function pickAuthors() {
  const users = await listUsers();
  const normal = users.filter((u) => u.role !== "admin");
  const poolUsers = normal.length > 0 ? normal : users;
  if (poolUsers.length === 0) {
    throw new Error("数据库中没有可用用户，无法写入发布者");
  }
  return poolUsers.map((u) => ({
    username: u.username,
    nickname: (u.nickname || u.username || "").trim() || u.username,
    id: u.id,
  }));
}

function buildVoters(authors, authorIndex, voteCount, sceneId, appIndex) {
  const others = authors.filter((_, idx) => idx !== authorIndex);
  const source = others.length > 0 ? others : authors;
  const voters = [];
  for (let n = 0; n < voteCount; n += 1) {
    if (n < source.length) {
      voters.push(source[n % source.length].id);
    } else {
      voters.push(`seed-voter-${sceneId}-${appIndex}-${n}`);
    }
  }
  return voters;
}

async function seedProducts() {
  const authors = await pickAuthors();
  console.log(`[seed] using ${authors.length} db user(s) as submitters`);
  const now = new Date();
  let created = 0;

  for (const block of SEED_APPS) {
    const scene = BUILD_SCENES.find((s) => s.id === block.sceneId);
    if (!scene) continue;
    const category = SCENE_CATEGORY[scene.id] || "趣味生活";
    const color = SCENE_COLOR[scene.id] || "#625cfc";

    for (let i = 0; i < block.apps.length; i += 1) {
      const app = block.apps[i];
      const author = authors[created % authors.length];
      const topic = await ensureTopic(app.topic, scene.name);
      const submittedAt = new Date(
        now.getTime() - (created + 1) * 36e5,
      ).toISOString();
      const id = makeId(`seed-${scene.id}-${app.name}`);

      const description = [
        `【场景】${scene.name}`,
        `【场景话题】${app.topic}`,
        `【构建工具】${app.tool}`,
        "",
        `${app.tagline}`,
        "",
        `这是面向「${scene.name}」场景的应用，围绕「${app.topic}」打磨，适合社区体验与二次创作。`,
      ].join("\n");

      await writeProduct({
        id,
        name: app.name,
        tagline: app.tagline,
        description,
        url: appDeployUrl(app.slug),
        categories: [category],
        category,
        topicId: topic.id,
        topicIds: [topic.id],
        color,
        imageUrl: "",
        submittedBy: author.username,
        submittedNickname: author.nickname,
        submittedAt,
        status: "approved",
        rejectReason: "",
        reviewedAt: submittedAt,
        reviewedBy: "admin",
        isSpecial: false,
        campaign: "",
        viewCount: app.views,
        shareCount: app.shares,
        voters: buildVoters(authors, created % authors.length, app.votes, scene.id, i),
        ratings: {},
        comments: [],
        rankPinned: false,
        rankHidden: false,
        rankWeight: 0,
        appPlatform: app.platform || "h5",
        updatedAt: submittedAt,
      });
      created += 1;
      console.log(`[seed] + ${scene.name} · ${app.name} (${app.topic})`);
    }
  }

  return created;
}

async function main() {
  await initDb();
  console.log("[seed] connected");
  await clearLegacyJson();
  await clearProducts();
  const n = await seedProducts();
  console.log(`[seed] done · inserted ${n} apps across ${SEED_APPS.length} scenes`);
  if (pool) await pool.end();
}

main().catch(async (err) => {
  console.error("[seed] failed:", err);
  try {
    if (pool) await pool.end();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
