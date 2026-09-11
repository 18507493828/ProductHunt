/**
 * 启动时把场景样例应用的「名称 / 落地页 / 形态」对齐到当前 MySQL。
 * - 已存在（同 seed id 或同名）：更新 name、tagline、url、appPlatform（保留投票等）
 * - 不存在：插入完整样例
 * - SEED_SCENES_REPLACE=1：先清空全部产品再写入（与本地全量一致）
 */
import { createHash } from "crypto";
import { BUILD_SCENES } from "./buildScenes.js";
import {
  SEED_APPS,
  SCENE_CATEGORY,
  SCENE_COLOR,
  appDeployUrl,
} from "./sceneSeedData.js";
import {
  deleteProduct,
  listProducts,
  listUsers,
  readTopics,
  upsertTopic,
  writeProduct,
} from "./store.js";
import { query } from "./db.js";

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

async function pickAuthor() {
  const users = await listUsers();
  const normal = users.filter((u) => u.role !== "admin");
  const poolUsers = normal.length > 0 ? normal : users;
  if (poolUsers.length === 0) {
    return { username: "admin", nickname: "admin", id: "admin" };
  }
  const u = poolUsers[0];
  return {
    username: u.username,
    nickname: (u.nickname || u.username || "").trim() || u.username,
    id: u.id,
  };
}

function buildVoters(voteCount, sceneId, appIndex) {
  const voters = [];
  for (let n = 0; n < voteCount; n += 1) {
    voters.push(`seed-voter-${sceneId}-${appIndex}-${n}`);
  }
  return voters;
}

export async function ensureSceneProducts() {
  const replace =
    process.env.SEED_SCENES_REPLACE === "1" ||
    process.env.SEED_SCENES_REPLACE === "true";

  if (replace) {
    const all = await listProducts();
    for (const p of all) await deleteProduct(p.id);
    await query("DELETE FROM shares");
    console.log(`[ensure-scenes] cleared ${all.length} products (SEED_SCENES_REPLACE=1)`);
  }

  const existing = await listProducts();
  const byId = new Map(existing.map((p) => [p.id, p]));
  const byName = new Map(existing.map((p) => [String(p.name || "").trim(), p]));
  const author = await pickAuthor();
  const now = new Date();

  let created = 0;
  let updated = 0;
  let index = 0;

  for (const block of SEED_APPS) {
    const scene = BUILD_SCENES.find((s) => s.id === block.sceneId);
    if (!scene) continue;
    const category = SCENE_CATEGORY[scene.id] || "趣味生活";
    const color = SCENE_COLOR[scene.id] || "#625cfc";

    for (let i = 0; i < block.apps.length; i += 1) {
      const app = block.apps[i];
      const id = makeId(`seed-${scene.id}-${app.name}`);
      const url = appDeployUrl(app.slug);
      const platform = app.platform || "h5";
      const topic = await ensureTopic(app.topic, scene.name);
      const submittedAt = new Date(
        now.getTime() - (index + 1) * 36e5,
      ).toISOString();

      const description = [
        `【场景】${scene.name}`,
        `【场景话题】${app.topic}`,
        `【构建工具】${app.tool}`,
        "",
        `${app.tagline}`,
        "",
        `这是面向「${scene.name}」场景的应用，围绕「${app.topic}」打磨，适合社区体验与二次创作。`,
      ].join("\n");

      const prev = byId.get(id) || byName.get(app.name);
      if (prev) {
        const next = {
          ...prev,
          id: prev.id || id,
          name: app.name,
          tagline: app.tagline,
          description: prev.description?.includes("【场景】")
            ? description
            : prev.description || description,
          url,
          appPlatform: platform,
          categories: prev.categories?.length ? prev.categories : [category],
          category: prev.category || category,
          topicId: prev.topicId || topic.id,
          topicIds: prev.topicIds?.length ? prev.topicIds : [topic.id],
          color: prev.color || color,
          updatedAt: new Date().toISOString(),
        };
        await writeProduct(next);
        byId.set(next.id, next);
        byName.set(app.name, next);
        updated += 1;
        console.log(`[ensure-scenes] update ${app.name} → ${url} (${platform})`);
      } else {
        const product = {
          id,
          name: app.name,
          tagline: app.tagline,
          description,
          url,
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
          viewCount: app.views || 0,
          shareCount: app.shares || 0,
          voters: buildVoters(app.votes || 0, scene.id, i),
          ratings: {},
          comments: [],
          rankPinned: false,
          rankHidden: false,
          rankWeight: 0,
          appPlatform: platform,
          updatedAt: submittedAt,
        };
        await writeProduct(product);
        byId.set(id, product);
        byName.set(app.name, product);
        created += 1;
        console.log(`[ensure-scenes] create ${app.name} → ${url} (${platform})`);
      }
      index += 1;
    }
  }

  console.log(
    `[ensure-scenes] done · created ${created}, updated ${updated}`,
  );
  return { created, updated };
}
