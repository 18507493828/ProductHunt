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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRODUCTS_DIR = path.join(__dirname, "storage", "products");

const SCENE_CATEGORY = {
  campus: "学习成长",
  social: "趣味生活",
  charity: "趣味生活",
  fitness: "趣味生活",
  outdoor: "趣味生活",
};

const SCENE_COLOR = {
  campus: "#5C6BC0",
  social: "#EC407A",
  charity: "#66BB6A",
  fitness: "#FF7043",
  outdoor: "#26A69A",
};

/** 每个场景 3 个样例应用（取该场景前 3 个话题） */
const SEED_APPS = [
  {
    sceneId: "campus",
    apps: [
      {
        name: "书市雷达",
        tagline: "校园二手书就近撮合，下课就能当面交易",
        topic: "校园二手书买卖",
        tool: "华为码道",
        views: 1280,
        shares: 36,
        votes: 42,
      },
      {
        name: "篮搭一下",
        tagline: "约球、凑人、订场地，一键找到同校球友",
        topic: "校园篮球搭子",
        tool: "WorkBuddy",
        views: 960,
        shares: 22,
        votes: 31,
      },
      {
        name: "招领雷达",
        tagline: "校园失物招领信息聚合，附近捡到的先看到",
        topic: "失物招领雷达",
        tool: "千问 Work",
        views: 740,
        shares: 18,
        votes: 25,
      },
    ],
  },
  {
    sceneId: "social",
    apps: [
      {
        name: "饭搭子计划",
        tagline: "周末同城拼饭，按口味与距离智能匹配",
        topic: "周末饭搭子组局",
        tool: "WorkBuddy",
        views: 1520,
        shares: 48,
        votes: 55,
      },
      {
        name: "本杀开黑台",
        tagline: "剧本杀 / 狼人杀一键组局，缺人就来补",
        topic: "剧本杀狼人杀组局",
        tool: "Trae Work",
        views: 880,
        shares: 27,
        votes: 29,
      },
      {
        name: "遛宠圈",
        tagline: "同城遛宠搭子与路线分享，遛狗也能社交",
        topic: "宠物遛弯社交圈",
        tool: "华为码道",
        views: 690,
        shares: 15,
        votes: 21,
      },
    ],
  },
  {
    sceneId: "charity",
    apps: [
      {
        name: "旧物捐赠地图",
        tagline: "附近捐赠点与上门回收一站查询",
        topic: "旧物捐赠地图",
        tool: "千问 Work",
        views: 1100,
        shares: 40,
        votes: 38,
      },
      {
        name: "志愿时长本",
        tagline: "志愿活动签到与时长自动记账",
        topic: "志愿时长记账本",
        tool: "WorkBuddy",
        views: 620,
        shares: 12,
        votes: 19,
      },
      {
        name: "流浪助养台",
        tagline: "流浪动物救助信息与临时寄养对接",
        topic: "流浪动物救助台",
        tool: "华为码道",
        views: 830,
        shares: 33,
        votes: 28,
      },
    ],
  },
  {
    sceneId: "fitness",
    apps: [
      {
        name: "私教拼搭",
        tagline: "健身房私教课拼人更划算",
        topic: "健身房私教搭子",
        tool: "Trae Work",
        views: 990,
        shares: 24,
        votes: 34,
      },
      {
        name: "热量一眼过",
        tagline: "食堂菜品拍照估热量，轻食选择更简单",
        topic: "食堂热量识别",
        tool: "华为码道",
        views: 1340,
        shares: 41,
        votes: 47,
      },
      {
        name: "跑线推荐",
        tagline: "按配速与路况推荐城市跑步路线",
        topic: "跑步路线推荐",
        tool: "WorkBuddy",
        views: 870,
        shares: 20,
        votes: 30,
      },
    ],
  },
  {
    sceneId: "outdoor",
    apps: [
      {
        name: "徒步组队社",
        tagline: "周末徒步路线与队友一键成团",
        topic: "周末徒步组队",
        tool: "WorkBuddy",
        views: 1210,
        shares: 39,
        votes: 44,
      },
      {
        name: "露营装备单",
        tagline: "按人数与天气生成露营装备清单",
        topic: "露营装备清单",
        tool: "千问 Work",
        views: 780,
        shares: 17,
        votes: 23,
      },
      {
        name: "骑行城市线",
        tagline: "城市骑行路线与补给点推荐",
        topic: "城市骑行路线",
        tool: "华为码道",
        views: 1050,
        shares: 29,
        votes: 36,
      },
    ],
  },
];

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
        url: `https://example.com/apps/${scene.id}/${i + 1}`,
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
