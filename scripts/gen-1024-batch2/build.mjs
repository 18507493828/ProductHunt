/**
 * 第二批 50 个应用：生成单文件 HTML + 介绍.txt（本地交付，不上传）
 * 运行：node scripts/gen-1024-batch2/build.mjs
 */
import fs from "fs/promises";
import path from "path";
import { pageFor, coverFor, introFor } from "./shell.mjs";
import apps1 from "./apps1.mjs";
import apps2 from "./apps2.mjs";
import apps3 from "./apps3.mjs";
import apps4 from "./apps4.mjs";
import apps5 from "./apps5.mjs";
import apps6 from "./apps6.mjs";
import apps7 from "./apps7.mjs";

/* 与线上已有应用重复，整条替换掉（旧目录会在构建时删除） */
const REPLACED = [
  "五子棋人机对战",
  "合成 2048",
  "贪吃蛇",
  "记忆翻牌",
  "扫雷经典版",
  "反应速度测试",
  "打字速度测试",
  "单位换算练习",
  "宿舍水电分摊",
  "课程表冲突检测",
  "群收款结算",
  "志愿服务时长记录",
  "睡眠周期计算",
  "跑步配速换算",
  "BMI 与体脂估算",
  "热量缺口计算",
  "露营装备清单",
];

const dropped = new Set(REPLACED);
const APPS = [...apps1, ...apps2, ...apps3, ...apps4, ...apps5]
  .filter((app) => !dropped.has(app.name))
  .concat(apps6, apps7);
const OUT = "/Users/lidiwen/Desktop/CSDN工作相关文件/外部广告项目/1024/生成应用/2026-10-21-第二批";
const ROOT_INDEX = "/Users/lidiwen/Desktop/CSDN工作相关文件/外部广告项目/1024/生成应用/应用清单-按日期.txt";

const CAT_ORDER = ["K12", "校园", "社交", "公益", "健身", "户外", "生活", "游戏"];

function fail(msg) {
  console.error("✗ " + msg);
  process.exitCode = 1;
}

async function main() {
  if (APPS.length !== 50) fail("应用数量应为 50，实际 " + APPS.length);

  const names = new Set();
  const slugs = new Set();
  for (const app of APPS) {
    if (names.has(app.name)) fail("应用名重复：" + app.name);
    if (slugs.has(app.slug)) fail("slug 重复：" + app.slug);
    names.add(app.name);
    slugs.add(app.slug);
    if (!app.body || !app.init) fail("缺少页面或逻辑：" + app.name);
  }

  /* 与已有 74 个应用比对名称，避免撞名 */
  try {
    const old = await fs.readFile(ROOT_INDEX, "utf8");
    const oldNames = new Set(
      old.split("\n").map((l) => l.trim().split(/\s{2,}/)[1]).filter(Boolean),
    );
    for (const app of APPS) {
      if (oldNames.has(app.name)) fail("与已有应用撞名：" + app.name);
    }
  } catch {
    console.warn("（未读到最后清单，跳过撞名检查）");
  }

  await fs.mkdir(OUT, { recursive: true });

  /* 清掉被替换掉的旧目录，避免交付里还留着重复应用 */
  for (const name of REPLACED) {
    await fs.rm(path.join(OUT, name), { recursive: true, force: true });
  }

  let totalBytes = 0;
  for (const app of APPS) {
    const dir = path.join(OUT, app.name);
    await fs.mkdir(dir, { recursive: true });
    const html = pageFor(app);
    await fs.writeFile(path.join(dir, app.name + ".html"), html, "utf8");
    await fs.writeFile(path.join(dir, "介绍.txt"), introFor(app), "utf8");
    await fs.writeFile(path.join(dir, ".cover.html"), coverFor(app), "utf8");
    totalBytes += Buffer.byteLength(html, "utf8");
  }

  /* 批次清单 */
  const byCat = {};
  for (const app of APPS) (byCat[app.cat] = byCat[app.cat] || []).push(app);
  const lines = ["第二批应用清单（2026-10-21 生成，共 50 个）", ""];
  for (const cat of CAT_ORDER) {
    const group = byCat[cat] || [];
    if (!group.length) continue;
    lines.push("【" + cat + "】" + group.length + " 个");
    lines.push("分类\t应用名\t一句话介绍");
    for (const app of group) {
      lines.push([app.cat, app.name, app.tagline].join("\t"));
    }
    lines.push("");
  }
  lines.push("分类分布：" + CAT_ORDER.filter((c) => byCat[c]).map((c) => c + " " + byCat[c].length).join("、"));
  await fs.writeFile(path.join(OUT, "应用清单-第二批.txt"), lines.join("\n"), "utf8");

  console.log("✓ 已生成 " + APPS.length + " 个应用到：");
  console.log("  " + OUT);
  console.log("  分类分布：" + CAT_ORDER.filter((c) => byCat[c]).map((c) => c + " " + byCat[c].length).join("、"));
  console.log("  HTML 总计 " + (totalBytes / 1024).toFixed(0) + " KB，平均 " + (totalBytes / APPS.length / 1024).toFixed(1) + " KB");
  console.log("  封面模板已写入各目录的 .cover.html，可用 Chrome 截图生成 封面.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
