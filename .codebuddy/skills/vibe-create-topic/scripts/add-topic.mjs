#!/usr/bin/env node
/**
 * 码上创 / ProductHunt：向远程（或本地）运营后台追加「构建场景话题」
 *
 * Env:
 *   VIBE_BASE_URL       默认 http://159.75.116.187
 *   VIBE_ADMIN_USER     默认 admin
 *   VIBE_ADMIN_PASSWORD 默认 admin123456
 *
 * Usage:
 *   node add-topic.mjs list
 *   node add-topic.mjs add --scene campus --topic "校园自习搭子"
 *   node add-topic.mjs add --scene 校园 --topics "话题A,话题B"
 *   node add-topic.mjs add --scene social --topic "周末饭搭子" --dry-run
 */

const BASE = (process.env.VIBE_BASE_URL || "http://159.75.116.187").replace(
  /\/$/,
  "",
);
const USER = process.env.VIBE_ADMIN_USER || "admin";
const PASS = process.env.VIBE_ADMIN_PASSWORD || "admin123456";

function usage() {
  console.log(`Usage:
  node add-topic.mjs list
  node add-topic.mjs add --scene <id|名称> --topic <名称>
  node add-topic.mjs add --scene <id|名称> --topics <a,b,c>
  node add-topic.mjs add ... --dry-run

Env: VIBE_BASE_URL VIBE_ADMIN_USER VIBE_ADMIN_PASSWORD
Base: ${BASE}`);
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") out.dryRun = true;
    else if (a.startsWith("--") && i + 1 < argv.length) {
      out[a.slice(2)] = argv[++i];
    } else out._.push(a);
  }
  return out;
}

async function request(path, { method = "GET", token, body } = {}) {
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg = data.error || data.message || text || res.statusText;
    throw new Error(`${method} ${path} → ${res.status}: ${msg}`);
  }
  return data;
}

async function login() {
  const data = await request("/api/auth/login", {
    method: "POST",
    body: { username: USER, password: PASS },
  });
  const token = data.token || data.accessToken;
  if (!token) throw new Error("登录成功但未返回 token");
  if (data.user?.role && data.user.role !== "admin") {
    throw new Error(`账号 ${USER} 不是 admin（role=${data.user.role}）`);
  }
  return token;
}

function topicNameOf(t) {
  return typeof t === "string" ? t.trim() : String(t?.name || "").trim();
}

function findScene(scenes, key) {
  const k = String(key || "").trim();
  if (!k) return -1;
  return scenes.findIndex(
    (s) => s.id === k || s.name === k || String(s.name).includes(k),
  );
}

function printScenes(config) {
  const scenes = config.scenes || [];
  console.log(`远程: ${BASE}`);
  console.log(`场景数: ${scenes.length}\n`);
  for (const s of scenes) {
    const topics = Array.isArray(s.topics) ? s.topics : [];
    const flag = s.enabled === false ? " [已隐藏]" : "";
    console.log(`• ${s.name} (${s.id})${flag} · ${topics.length} 个话题`);
    topics.forEach((t, i) => {
      const name = topicNameOf(t);
      const off =
        typeof t === "object" && t && t.enabled === false ? " [关]" : "";
      console.log(`    ${i + 1}. ${name}${off}`);
    });
    console.log("");
  }
}

async function cmdList() {
  // 公开接口即可浏览；无鉴权也能看话题
  let config;
  try {
    const token = await login();
    config = await request("/api/admin/build-config", { token });
  } catch {
    config = await request("/api/build-config");
  }
  printScenes(config);
}

async function cmdAdd(args) {
  const sceneKey = args.scene;
  const single = args.topic ? [String(args.topic).trim()] : [];
  const multi = args.topics
    ? String(args.topics)
        .split(/[,，\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const names = [...single, ...multi].filter(Boolean);
  if (!sceneKey || names.length === 0) {
    usage();
    process.exit(1);
  }

  const token = await login();
  const config = await request("/api/admin/build-config", { token });
  const scenes = Array.isArray(config.scenes) ? [...config.scenes] : [];
  const idx = findScene(scenes, sceneKey);
  if (idx < 0) {
    console.error(`找不到场景: ${sceneKey}`);
    console.error(
      "可选:",
      scenes.map((s) => `${s.name}(${s.id})`).join(", "),
    );
    process.exit(1);
  }

  const scene = { ...scenes[idx] };
  const topics = Array.isArray(scene.topics) ? [...scene.topics] : [];
  const existing = new Set(topics.map(topicNameOf).filter(Boolean));
  const added = [];
  const skipped = [];

  for (const name of names) {
    if (existing.has(name)) {
      skipped.push(name);
      continue;
    }
    topics.push({
      id: "",
      name,
      enabled: true,
      sort: topics.length + 1,
    });
    existing.add(name);
    added.push(name);
  }

  scenes[idx] = { ...scene, topics };

  console.log(`场景: ${scene.name} (${scene.id})`);
  if (added.length) console.log(`将新增: ${added.join("、")}`);
  if (skipped.length) console.log(`已存在跳过: ${skipped.join("、")}`);

  if (!added.length) {
    console.log("无变更");
    return;
  }
  if (args.dryRun) {
    console.log("[dry-run] 未写入远程");
    return;
  }

  const result = await request("/api/admin/build-config", {
    method: "PUT",
    token,
    body: {
      scenes,
      tools: config.tools || [],
    },
  });
  console.log(result.message || "已保存");
  const saved = result.config?.scenes?.[idx] || scenes[idx];
  console.log(
    `当前话题数: ${(saved.topics || []).length} · ${BASE}`,
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0] || "list";
  try {
    if (cmd === "list" || cmd === "ls") await cmdList();
    else if (cmd === "add") await cmdAdd(args);
    else {
      usage();
      process.exit(1);
    }
  } catch (err) {
    console.error("失败:", err.message || err);
    process.exit(1);
  }
}

main();
