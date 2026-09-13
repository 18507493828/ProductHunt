import {
  query,
  withTransaction,
  toIso,
  toDbDate,
  toBool,
  fromBool,
} from "./db.js";
import {
  DEFAULT_SHARE_CONFIG,
  normalizeShareConfig,
} from "./shareConfig.js";
import {
  DEFAULT_INCENTIVE_CONFIG,
  normalizeIncentiveConfig,
} from "./incentiveConfig.js";
import {
  DEFAULT_BUILD_CONFIG,
  normalizeBuildConfig,
} from "./buildOpsConfig.js";

const BATCH_SIZE = 500;

async function connQuery(conn, sql, params = []) {
  const [rows] = await conn.execute(sql, params);
  return rows;
}

async function batchInsert(conn, sqlPrefix, rows, mapRow) {
  if (!rows.length) return;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    const placeholders = chunk.map(() => mapRow.placeholder).join(", ");
    const values = chunk.flatMap(mapRow.values);
    await connQuery(conn, `${sqlPrefix} ${placeholders}`, values);
  }
}

/* ---------------- Users ---------------- */

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    nickname: row.nickname || row.username,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: toIso(row.created_at),
  };
}

export async function listUsers() {
  const rows = await query("SELECT * FROM users ORDER BY created_at ASC");
  return rows.map(mapUser);
}

export async function findUserById(id) {
  const rows = await query("SELECT * FROM users WHERE id = ? LIMIT 1", [id]);
  return mapUser(rows[0]);
}

export async function findUserByUsername(username) {
  const rows = await query(
    "SELECT * FROM users WHERE username = ? LIMIT 1",
    [username],
  );
  return mapUser(rows[0]);
}

export async function countAdmins() {
  const rows = await query(
    "SELECT COUNT(*) AS c FROM users WHERE role = 'admin'",
  );
  return Number(rows[0]?.c) || 0;
}

export async function saveUser(user) {
  await query(
    `INSERT INTO users (id, username, nickname, password_hash, role, created_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       username = VALUES(username),
       nickname = VALUES(nickname),
       password_hash = VALUES(password_hash),
       role = VALUES(role),
       created_at = VALUES(created_at)`,
    [
      user.id,
      user.username,
      user.nickname || user.username,
      user.passwordHash,
      user.role || "user",
      toDbDate(user.createdAt),
    ],
  );
  return user;
}

export async function updateUser(user) {
  await query(
    `UPDATE users
     SET username = ?, nickname = ?, password_hash = ?, role = ?, created_at = ?
     WHERE id = ?`,
    [
      user.username,
      user.nickname || user.username,
      user.passwordHash,
      user.role || "user",
      toDbDate(user.createdAt),
      user.id,
    ],
  );
  return user;
}

/* ---------------- Generic full-replace lists ---------------- */

function mapBanner(row) {
  return {
    id: row.id,
    title: row.title || "",
    subtitle: row.subtitle || "",
    imageUrl: row.image_url || "",
    linkUrl: row.link_url || "",
    sort: Number(row.sort) || 0,
    enabled: toBool(row.enabled, true),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export async function readBanners() {
  const rows = await query("SELECT * FROM banners ORDER BY sort ASC, id ASC");
  return rows.map(mapBanner);
}

export async function writeBanners(banners) {
  const list = Array.isArray(banners) ? banners : [];
  await withTransaction(async (conn) => {
    await connQuery(conn, "DELETE FROM banners");
    for (const banner of list) {
      await connQuery(
        conn,
        `INSERT INTO banners
          (id, title, subtitle, image_url, link_url, sort, enabled, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          banner.id,
          banner.title || "",
          banner.subtitle || "",
          banner.imageUrl || "",
          banner.linkUrl || "",
          Number(banner.sort) || 0,
          fromBool(banner.enabled !== false),
          toDbDate(banner.createdAt),
          toDbDate(banner.updatedAt),
        ],
      );
    }
  });
}

function mapNav(row) {
  return {
    id: row.id,
    title: row.title || "",
    url: row.url || "",
    sort: Number(row.sort) || 0,
    enabled: toBool(row.enabled, true),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export async function readNavs() {
  const rows = await query("SELECT * FROM navs ORDER BY sort ASC, id ASC");
  return rows.map(mapNav);
}

export async function writeNavs(navs) {
  const list = Array.isArray(navs) ? navs : [];
  await withTransaction(async (conn) => {
    await connQuery(conn, "DELETE FROM navs");
    for (const nav of list) {
      await connQuery(
        conn,
        `INSERT INTO navs (id, title, url, sort, enabled, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          nav.id,
          nav.title || "",
          nav.url || "",
          Number(nav.sort) || 0,
          fromBool(nav.enabled !== false),
          toDbDate(nav.createdAt),
          toDbDate(nav.updatedAt),
        ],
      );
    }
  });
}

function mapCampaign(row) {
  return {
    id: row.id,
    title: row.title || "",
    rankLabel: row.rank_label || row.title || "",
    description: row.description || "",
    coverImage: row.cover_image || "",
    timeText: row.time_text || "",
    rules: row.rules || "",
    rewards: row.rewards || "",
    enabled: toBool(row.enabled, true),
    sort: Number(row.sort) || 0,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export async function readCampaigns() {
  const rows = await query("SELECT * FROM campaigns ORDER BY sort ASC, id ASC");
  return rows.map(mapCampaign);
}

export async function writeCampaigns(campaigns) {
  const list = Array.isArray(campaigns) ? campaigns : [];
  await withTransaction(async (conn) => {
    await connQuery(conn, "DELETE FROM campaigns");
    for (const item of list) {
      await connQuery(
        conn,
        `INSERT INTO campaigns
          (id, title, rank_label, description, cover_image, time_text, rules, rewards,
           enabled, sort, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.title || "",
          item.rankLabel || item.title || "",
          item.description || "",
          item.coverImage || "",
          item.timeText || "",
          item.rules || "",
          item.rewards || "",
          fromBool(item.enabled !== false),
          Number(item.sort) || 0,
          toDbDate(item.createdAt),
          toDbDate(item.updatedAt),
        ],
      );
    }
  });
}

function mapCategory(row) {
  return {
    id: row.id,
    name: row.name || "",
    sort: Number(row.sort) || 0,
    enabled: toBool(row.enabled, true),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export async function readCategories() {
  const rows = await query(
    "SELECT * FROM categories ORDER BY sort ASC, id ASC",
  );
  return rows.map(mapCategory);
}

export async function writeCategories(categories) {
  const list = Array.isArray(categories) ? categories : [];
  await withTransaction(async (conn) => {
    await connQuery(conn, "DELETE FROM categories");
    for (const item of list) {
      await connQuery(
        conn,
        `INSERT INTO categories (id, name, sort, enabled, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.name || "",
          Number(item.sort) || 0,
          fromBool(item.enabled !== false),
          toDbDate(item.createdAt),
          toDbDate(item.updatedAt),
        ],
      );
    }
  });
}

export async function readCampaignZone() {
  const rows = await query(
    "SELECT * FROM campaign_zone WHERE id = 1 LIMIT 1",
  );
  if (!rows[0]) {
    return { title: "活动专区", enabled: true };
  }
  return {
    title: rows[0].title || "活动专区",
    enabled: toBool(rows[0].enabled, true),
  };
}

export async function writeCampaignZone(zone) {
  const title = String(zone?.title || "活动专区").trim() || "活动专区";
  const enabled = zone?.enabled !== false;
  await query(
    `INSERT INTO campaign_zone (id, title, enabled)
     VALUES (1, ?, ?)
     ON DUPLICATE KEY UPDATE title = VALUES(title), enabled = VALUES(enabled)`,
    [title, fromBool(enabled)],
  );
  return { title, enabled };
}

export async function readShareConfig() {
  const rows = await query("SELECT * FROM share_config WHERE id = 1 LIMIT 1");
  if (!rows[0]) {
    return normalizeShareConfig(DEFAULT_SHARE_CONFIG);
  }
  let platforms = rows[0].platforms;
  if (typeof platforms === "string") {
    try {
      platforms = JSON.parse(platforms);
    } catch {
      platforms = {};
    }
  }
  return normalizeShareConfig({
    titlePrefix: rows[0].title_prefix || "",
    footer: rows[0].footer || "",
    includeTagline: toBool(rows[0].include_tagline, true),
    includeUrl: toBool(rows[0].include_url, true),
    platforms: platforms || {},
  });
}

export async function writeShareConfig(config) {
  const normalized = normalizeShareConfig(config);
  await query(
    `INSERT INTO share_config
       (id, title_prefix, footer, include_tagline, include_url, platforms)
     VALUES (1, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       title_prefix = VALUES(title_prefix),
       footer = VALUES(footer),
       include_tagline = VALUES(include_tagline),
       include_url = VALUES(include_url),
       platforms = VALUES(platforms)`,
    [
      normalized.titlePrefix,
      normalized.footer,
      fromBool(normalized.includeTagline !== false),
      fromBool(normalized.includeUrl !== false),
      JSON.stringify(normalized.platforms || {}),
    ],
  );
  return normalized;
}

export async function readIncentiveConfig() {
  try {
    const rows = await query(
      "SELECT payload FROM incentive_config WHERE id = 1 LIMIT 1",
    );
    if (!rows[0]) {
      return normalizeIncentiveConfig(DEFAULT_INCENTIVE_CONFIG);
    }
    let payload = rows[0].payload;
    if (typeof payload === "string") {
      try {
        payload = JSON.parse(payload);
      } catch {
        payload = {};
      }
    }
    return normalizeIncentiveConfig(payload || {});
  } catch (err) {
    // 表尚未创建时回退默认，避免阻断启动后的读请求
    if (err && (err.code === "ER_NO_SUCH_TABLE" || err.errno === 1146)) {
      return normalizeIncentiveConfig(DEFAULT_INCENTIVE_CONFIG);
    }
    throw err;
  }
}

export async function writeIncentiveConfig(config) {
  const normalized = normalizeIncentiveConfig(config);
  await query(
    `INSERT INTO incentive_config (id, payload)
     VALUES (1, ?)
     ON DUPLICATE KEY UPDATE payload = VALUES(payload)`,
    [JSON.stringify(normalized)],
  );
  return normalized;
}

export async function readBuildConfig() {
  try {
    const rows = await query(
      "SELECT payload FROM build_config WHERE id = 1 LIMIT 1",
    );
    if (!rows[0]) {
      return normalizeBuildConfig(DEFAULT_BUILD_CONFIG);
    }
    let payload = rows[0].payload;
    if (typeof payload === "string") {
      try {
        payload = JSON.parse(payload);
      } catch {
        payload = {};
      }
    }
    return normalizeBuildConfig(payload || {});
  } catch (err) {
    if (err && (err.code === "ER_NO_SUCH_TABLE" || err.errno === 1146)) {
      return normalizeBuildConfig(DEFAULT_BUILD_CONFIG);
    }
    throw err;
  }
}

export async function writeBuildConfig(config) {
  const normalized = normalizeBuildConfig(config);
  await query(
    `INSERT INTO build_config (id, payload)
     VALUES (1, ?)
     ON DUPLICATE KEY UPDATE payload = VALUES(payload)`,
    [JSON.stringify(normalized)],
  );
  return normalized;
}

function mapShare(row) {
  return {
    id: row.id,
    productId: row.product_id || "",
    productName: row.product_name || "",
    userId: row.user_id || "",
    username: row.username || "",
    nickname: row.nickname || "",
    platform: row.platform || "",
    createdAt: toIso(row.created_at),
  };
}

export async function readShares() {
  const rows = await query(
    "SELECT * FROM shares ORDER BY created_at DESC, id DESC",
  );
  return rows.map(mapShare);
}

export async function writeShares(list) {
  const shares = Array.isArray(list) ? list : [];
  await withTransaction(async (conn) => {
    await connQuery(conn, "DELETE FROM shares");
    for (const item of shares) {
      await connQuery(
        conn,
        `INSERT INTO shares
          (id, product_id, product_name, user_id, username, nickname, platform, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.productId || "",
          item.productName || "",
          item.userId || "",
          item.username || "",
          item.nickname || "",
          item.platform || "",
          toDbDate(item.createdAt),
        ],
      );
    }
  });
}

/* ---------------- Topics ---------------- */

export async function readTopics() {
  const [topics, followers] = await Promise.all([
    query("SELECT * FROM topics ORDER BY created_at ASC, id ASC"),
    query("SELECT topic_id, user_id FROM topic_followers"),
  ]);
  const followerMap = new Map();
  for (const row of followers) {
    if (!followerMap.has(row.topic_id)) followerMap.set(row.topic_id, []);
    followerMap.get(row.topic_id).push(row.user_id);
  }
  return topics.map((row) => ({
    id: row.id,
    name: row.name || "",
    description: row.description || "",
    coverImage: row.cover_image || "",
    color: row.color || "",
    region: row.region || "全国",
    createdBy: row.created_by || "",
    createdAt: toIso(row.created_at),
    followerIds: followerMap.get(row.id) || [],
  }));
}

/** 单条话题 upsert（关注/新建时用，避免全表重写） */
export async function upsertTopic(topic) {
  if (!topic?.id) throw new Error("topic.id required");
  const followerIds = Array.isArray(topic.followerIds) ? topic.followerIds : [];

  await withTransaction(async (conn) => {
    await connQuery(
      conn,
      `INSERT INTO topics
        (id, name, description, cover_image, color, region, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         description = VALUES(description),
         cover_image = VALUES(cover_image),
         color = VALUES(color),
         region = VALUES(region),
         created_by = VALUES(created_by),
         created_at = VALUES(created_at)`,
      [
        topic.id,
        topic.name || "",
        topic.description || "",
        topic.coverImage || "",
        topic.color || "",
        topic.region || "全国",
        topic.createdBy || "",
        toDbDate(topic.createdAt),
      ],
    );

    await connQuery(conn, "DELETE FROM topic_followers WHERE topic_id = ?", [
      topic.id,
    ]);

    const followerRows = followerIds
      .filter(Boolean)
      .map((userId) => ({ topicId: topic.id, userId: String(userId) }));

    await batchInsert(
      conn,
      "INSERT INTO topic_followers (topic_id, user_id) VALUES",
      followerRows,
      {
        placeholder: "(?, ?)",
        values: (row) => [row.topicId, row.userId],
      },
    );
  });

  return topic;
}

export async function writeTopics(topics) {
  const list = Array.isArray(topics) ? topics : [];
  await withTransaction(async (conn) => {
    await connQuery(conn, "DELETE FROM topic_followers");
    await connQuery(conn, "DELETE FROM topics");

    await batchInsert(
      conn,
      `INSERT INTO topics
        (id, name, description, cover_image, color, region, created_by, created_at)
       VALUES`,
      list,
      {
        placeholder: "(?, ?, ?, ?, ?, ?, ?, ?)",
        values: (t) => [
          t.id,
          t.name || "",
          t.description || "",
          t.coverImage || "",
          t.color || "",
          t.region || "全国",
          t.createdBy || "",
          toDbDate(t.createdAt),
        ],
      },
    );

    const followerRows = [];
    for (const t of list) {
      const ids = Array.isArray(t.followerIds) ? t.followerIds : [];
      for (const userId of ids) {
        if (!userId) continue;
        followerRows.push({ topicId: t.id, userId: String(userId) });
      }
    }

    await batchInsert(
      conn,
      "INSERT INTO topic_followers (topic_id, user_id) VALUES",
      followerRows,
      {
        placeholder: "(?, ?)",
        values: (r) => [r.topicId, r.userId],
      },
    );
  });
}

/* ---------------- Topic posts ---------------- */

function mapComment(row) {
  return {
    id: row.id,
    userId: row.user_id || "",
    username: row.username || "",
    author: row.author || row.username || "",
    content: row.content || "",
    createdAt: toIso(row.created_at),
  };
}

async function assembleTopicPosts(postRows) {
  if (!postRows.length) return [];
  const ids = postRows.map((p) => p.id);
  const placeholders = ids.map(() => "?").join(",");

  const [likes, comments] = await Promise.all([
    query(
      `SELECT post_id, user_id FROM topic_post_likes WHERE post_id IN (${placeholders})`,
      ids,
    ),
    query(
      `SELECT * FROM topic_post_comments WHERE post_id IN (${placeholders}) ORDER BY created_at ASC`,
      ids,
    ),
  ]);

  const likeMap = new Map();
  for (const row of likes) {
    if (!likeMap.has(row.post_id)) likeMap.set(row.post_id, []);
    likeMap.get(row.post_id).push(row.user_id);
  }
  const commentMap = new Map();
  for (const row of comments) {
    if (!commentMap.has(row.post_id)) commentMap.set(row.post_id, []);
    commentMap.get(row.post_id).push(mapComment(row));
  }

  return postRows.map((row) => {
    const post = {
      id: row.id,
      topicId: row.topic_id || "",
      title: row.title || "",
      content: row.content || "",
      imageUrl: row.image_url || "",
      linkUrl: row.link_url || "",
      submittedBy: row.submitted_by || "",
      submittedAt: toIso(row.submitted_at),
      status: row.status || "approved",
      rejectReason: row.reject_reason || "",
      reviewedAt: toIso(row.reviewed_at),
      reviewedBy: row.reviewed_by || "",
      viewCount: Number(row.view_count) || 0,
      likeIds: likeMap.get(row.id) || [],
      comments: commentMap.get(row.id) || [],
    };
    if (row.submitted_nickname) {
      post.submittedNickname = row.submitted_nickname;
    }
    return post;
  });
}

export async function listTopicPosts() {
  const rows = await query(
    "SELECT * FROM topic_posts ORDER BY submitted_at DESC, id DESC",
  );
  return assembleTopicPosts(rows);
}

export async function getTopicPost(id) {
  const rows = await query(
    "SELECT * FROM topic_posts WHERE id = ? LIMIT 1",
    [id],
  );
  if (!rows[0]) throw new Error("NOT_FOUND");
  const [post] = await assembleTopicPosts(rows);
  return post;
}

export async function writeTopicPost(post) {
  await withTransaction(async (conn) => {
    await connQuery(
      conn,
      `INSERT INTO topic_posts
        (id, topic_id, title, content, image_url, link_url, submitted_by,
         submitted_nickname, submitted_at, status, reject_reason, reviewed_at,
         reviewed_by, view_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         topic_id = VALUES(topic_id),
         title = VALUES(title),
         content = VALUES(content),
         image_url = VALUES(image_url),
         link_url = VALUES(link_url),
         submitted_by = VALUES(submitted_by),
         submitted_nickname = VALUES(submitted_nickname),
         submitted_at = VALUES(submitted_at),
         status = VALUES(status),
         reject_reason = VALUES(reject_reason),
         reviewed_at = VALUES(reviewed_at),
         reviewed_by = VALUES(reviewed_by),
         view_count = VALUES(view_count)`,
      [
        post.id,
        post.topicId || "",
        post.title || "",
        post.content || "",
        post.imageUrl || "",
        post.linkUrl || "",
        post.submittedBy || "",
        post.submittedNickname || "",
        toDbDate(post.submittedAt),
        post.status || "approved",
        post.rejectReason || "",
        toDbDate(post.reviewedAt),
        post.reviewedBy || "",
        Number(post.viewCount) || 0,
      ],
    );

    await connQuery(conn, "DELETE FROM topic_post_likes WHERE post_id = ?", [
      post.id,
    ]);
    await connQuery(
      conn,
      "DELETE FROM topic_post_comments WHERE post_id = ?",
      [post.id],
    );

    const likeIds = Array.isArray(post.likeIds) ? post.likeIds : [];
    await batchInsert(
      conn,
      "INSERT INTO topic_post_likes (post_id, user_id) VALUES",
      likeIds.filter(Boolean).map((userId) => ({ postId: post.id, userId })),
      {
        placeholder: "(?, ?)",
        values: (r) => [r.postId, r.userId],
      },
    );

    const comments = Array.isArray(post.comments) ? post.comments : [];
    for (const c of comments) {
      await connQuery(
        conn,
        `INSERT INTO topic_post_comments
          (id, post_id, user_id, username, author, content, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          c.id,
          post.id,
          c.userId || "",
          c.username || "",
          c.author || c.username || "",
          c.content || "",
          toDbDate(c.createdAt),
        ],
      );
    }
  });
  return post;
}

export async function deleteTopicPost(id) {
  await withTransaction(async (conn) => {
    await connQuery(conn, "DELETE FROM topic_post_likes WHERE post_id = ?", [
      id,
    ]);
    await connQuery(
      conn,
      "DELETE FROM topic_post_comments WHERE post_id = ?",
      [id],
    );
    await connQuery(conn, "DELETE FROM topic_posts WHERE id = ?", [id]);
  });
}

/* ---------------- Products ---------------- */

function collectTopicIds(product) {
  const ids = [];
  if (Array.isArray(product.topicIds)) {
    for (const raw of product.topicIds) {
      const id = String(raw || "").trim();
      if (id && !ids.includes(id)) ids.push(id);
    }
  }
  const legacy = String(product.topicId || "").trim();
  if (legacy && !ids.includes(legacy)) ids.unshift(legacy);
  return ids;
}

function collectCategories(product) {
  const cats = [];
  if (Array.isArray(product.categories)) {
    for (const raw of product.categories) {
      const name = String(raw || "").trim();
      if (name && !cats.includes(name)) cats.push(name);
    }
  }
  const legacy = String(product.category || "").trim();
  if (legacy && !cats.includes(legacy)) cats.unshift(legacy);
  return cats;
}

async function assembleProducts(productRows) {
  if (!productRows.length) return [];
  const ids = productRows.map((p) => p.id);
  const placeholders = ids.map(() => "?").join(",");

  const [cats, topics, ratings, comments] = await Promise.all([
    query(
      `SELECT * FROM product_categories WHERE product_id IN (${placeholders}) ORDER BY position ASC`,
      ids,
    ),
    query(
      `SELECT * FROM product_topics WHERE product_id IN (${placeholders}) ORDER BY position ASC`,
      ids,
    ),
    query(
      `SELECT * FROM product_ratings WHERE product_id IN (${placeholders})`,
      ids,
    ),
    query(
      `SELECT * FROM product_comments WHERE product_id IN (${placeholders}) ORDER BY created_at ASC`,
      ids,
    ),
  ]);

  const catMap = new Map();
  for (const row of cats) {
    if (!catMap.has(row.product_id)) catMap.set(row.product_id, []);
    catMap.get(row.product_id).push(row.category_name);
  }
  const topicMap = new Map();
  for (const row of topics) {
    if (!topicMap.has(row.product_id)) topicMap.set(row.product_id, []);
    topicMap.get(row.product_id).push(row.topic_id);
  }
  const ratingMap = new Map();
  const voterMap = new Map();
  for (const row of ratings) {
    if (!voterMap.has(row.product_id)) voterMap.set(row.product_id, []);
    voterMap.get(row.product_id).push(row.user_id);
    const hasScores =
      row.creativity != null &&
      row.completeness != null &&
      row.usefulness != null &&
      row.experience != null;
    if (hasScores) {
      if (!ratingMap.has(row.product_id)) ratingMap.set(row.product_id, {});
      ratingMap.get(row.product_id)[row.user_id] = {
        creativity: Number(row.creativity),
        completeness: Number(row.completeness),
        usefulness: Number(row.usefulness),
        experience: Number(row.experience),
      };
    }
  }
  const commentMap = new Map();
  for (const row of comments) {
    if (!commentMap.has(row.product_id)) commentMap.set(row.product_id, []);
    commentMap.get(row.product_id).push(mapComment(row));
  }

  return productRows.map((row) => {
    const categories = catMap.get(row.id) || [];
    const topicIds = topicMap.get(row.id) || [];
    const topicId = row.topic_id || topicIds[0] || "";
    if (topicId && !topicIds.includes(topicId)) topicIds.unshift(topicId);
    const category = row.category || categories[0] || "";
    if (category && !categories.includes(category)) categories.unshift(category);

    const product = {
      id: row.id,
      name: row.name || "",
      tagline: row.tagline || "",
      description: row.description || "",
      url: row.url || "",
      category,
      categories,
      topicId,
      topicIds,
      color: row.color || "",
      imageUrl: row.image_url || "",
      voters: voterMap.get(row.id) || [],
      ratings: ratingMap.get(row.id) || {},
      comments: commentMap.get(row.id) || [],
      submittedBy: row.submitted_by || "",
      submittedAt: toIso(row.submitted_at),
      status: row.status || "approved",
      rejectReason: row.reject_reason || "",
      reviewedAt: toIso(row.reviewed_at),
      reviewedBy: row.reviewed_by || "",
      isSpecial: toBool(row.is_special, false),
      campaign: row.campaign || "",
      viewCount: Number(row.view_count) || 0,
      shareCount: Number(row.share_count) || 0,
      appPlatform: row.app_platform || "h5",
    };
    if (row.submitted_nickname) {
      product.submittedNickname = row.submitted_nickname;
    }
    if (row.updated_at) product.updatedAt = toIso(row.updated_at);
    if (toBool(row.rank_pinned, false)) product.rankPinned = true;
    if (toBool(row.rank_hidden, false)) product.rankHidden = true;
    if (Number(row.rank_weight)) product.rankWeight = Number(row.rank_weight);
    return product;
  });
}

export async function listProducts() {
  const rows = await query("SELECT * FROM products");
  return assembleProducts(rows);
}

export async function getProduct(id) {
  const rows = await query("SELECT * FROM products WHERE id = ? LIMIT 1", [id]);
  if (!rows[0]) throw new Error("NOT_FOUND");
  const [product] = await assembleProducts(rows);
  return product;
}

export async function writeProduct(product) {
  const categories = collectCategories(product);
  const topicIds = collectTopicIds(product);
  const category = product.category || categories[0] || "";
  const topicId = product.topicId || topicIds[0] || "";
  const ratings =
    product.ratings && typeof product.ratings === "object"
      ? product.ratings
      : {};
  const voters = Array.isArray(product.voters) ? product.voters : [];
  const voterSet = new Set([
    ...voters.filter(Boolean),
    ...Object.keys(ratings),
  ]);

  await withTransaction(async (conn) => {
    await connQuery(
      conn,
      `INSERT INTO products
        (id, name, tagline, description, url, category, topic_id, color, image_url,
         submitted_by, submitted_nickname, submitted_at, status, reject_reason,
         reviewed_at, reviewed_by, is_special, campaign, view_count, share_count,
         app_platform, updated_at, rank_pinned, rank_hidden, rank_weight)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         tagline = VALUES(tagline),
         description = VALUES(description),
         url = VALUES(url),
         category = VALUES(category),
         topic_id = VALUES(topic_id),
         color = VALUES(color),
         image_url = VALUES(image_url),
         submitted_by = VALUES(submitted_by),
         submitted_nickname = VALUES(submitted_nickname),
         submitted_at = VALUES(submitted_at),
         status = VALUES(status),
         reject_reason = VALUES(reject_reason),
         reviewed_at = VALUES(reviewed_at),
         reviewed_by = VALUES(reviewed_by),
         is_special = VALUES(is_special),
         campaign = VALUES(campaign),
         view_count = VALUES(view_count),
         share_count = VALUES(share_count),
         app_platform = VALUES(app_platform),
         updated_at = VALUES(updated_at),
         rank_pinned = VALUES(rank_pinned),
         rank_hidden = VALUES(rank_hidden),
         rank_weight = VALUES(rank_weight)`,
      [
        product.id,
        product.name || "",
        product.tagline || "",
        product.description || "",
        product.url || "",
        category,
        topicId,
        product.color || "",
        product.imageUrl || "",
        product.submittedBy || "",
        product.submittedNickname || "",
        toDbDate(product.submittedAt),
        product.status || "approved",
        product.rejectReason || "",
        toDbDate(product.reviewedAt),
        product.reviewedBy || "",
        fromBool(Boolean(product.isSpecial)),
        product.campaign || "",
        Number(product.viewCount) || 0,
        Number(product.shareCount) || 0,
        product.appPlatform || "h5",
        toDbDate(product.updatedAt),
        fromBool(Boolean(product.rankPinned)),
        fromBool(Boolean(product.rankHidden)),
        Number(product.rankWeight) || 0,
      ],
    );

    await connQuery(
      conn,
      "DELETE FROM product_categories WHERE product_id = ?",
      [product.id],
    );
    await connQuery(conn, "DELETE FROM product_topics WHERE product_id = ?", [
      product.id,
    ]);
    await connQuery(conn, "DELETE FROM product_ratings WHERE product_id = ?", [
      product.id,
    ]);
    await connQuery(conn, "DELETE FROM product_comments WHERE product_id = ?", [
      product.id,
    ]);

    for (let i = 0; i < categories.length; i += 1) {
      await connQuery(
        conn,
        `INSERT INTO product_categories (product_id, category_name, position)
         VALUES (?, ?, ?)`,
        [product.id, categories[i], i],
      );
    }
    for (let i = 0; i < topicIds.length; i += 1) {
      await connQuery(
        conn,
        `INSERT INTO product_topics (product_id, topic_id, position)
         VALUES (?, ?, ?)`,
        [product.id, topicIds[i], i],
      );
    }

    for (const userId of voterSet) {
      const scores = ratings[userId];
      const hasScores =
        scores &&
        typeof scores === "object" &&
        scores.creativity != null &&
        scores.completeness != null &&
        scores.usefulness != null &&
        scores.experience != null;
      await connQuery(
        conn,
        `INSERT INTO product_ratings
          (product_id, user_id, creativity, completeness, usefulness, experience)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          product.id,
          userId,
          hasScores ? Number(scores.creativity) : null,
          hasScores ? Number(scores.completeness) : null,
          hasScores ? Number(scores.usefulness) : null,
          hasScores ? Number(scores.experience) : null,
        ],
      );
    }

    const comments = Array.isArray(product.comments) ? product.comments : [];
    for (const c of comments) {
      await connQuery(
        conn,
        `INSERT INTO product_comments
          (id, product_id, user_id, username, author, content, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          c.id,
          product.id,
          c.userId || "",
          c.username || "",
          c.author || c.username || "",
          c.content || "",
          toDbDate(c.createdAt),
        ],
      );
    }
  });

  return product;
}

export async function deleteProduct(id) {
  await withTransaction(async (conn) => {
    await connQuery(
      conn,
      "DELETE FROM product_categories WHERE product_id = ?",
      [id],
    );
    await connQuery(conn, "DELETE FROM product_topics WHERE product_id = ?", [
      id,
    ]);
    await connQuery(conn, "DELETE FROM product_ratings WHERE product_id = ?", [
      id,
    ]);
    await connQuery(conn, "DELETE FROM product_comments WHERE product_id = ?", [
      id,
    ]);
    await connQuery(conn, "DELETE FROM products WHERE id = ?", [id]);
  });
}

/* ---------------- Uploads (BLOB) ---------------- */

export async function saveUpload({ id, mimeType, data }) {
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  await query(
    `INSERT INTO uploads (id, mime_type, size, data, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       mime_type = VALUES(mime_type),
       size = VALUES(size),
       data = VALUES(data),
       created_at = VALUES(created_at)`,
    [
      id,
      mimeType || "application/octet-stream",
      buffer.length,
      buffer,
      toDbDate(new Date().toISOString()),
    ],
  );
  return { id, mimeType, size: buffer.length };
}

export async function getUpload(id) {
  const rows = await query(
    "SELECT id, mime_type, size, data, created_at FROM uploads WHERE id = ? LIMIT 1",
    [id],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    mimeType: row.mime_type || "application/octet-stream",
    size: Number(row.size) || 0,
    data: row.data,
    createdAt: toIso(row.created_at),
  };
}

export async function deleteUpload(id) {
  if (!id) return;
  await query("DELETE FROM uploads WHERE id = ?", [id]);
}
