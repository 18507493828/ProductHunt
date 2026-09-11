/**
 * 本地 ↔ 远程 MySQL 产品数据同步（部署不会自动同步数据库）
 *
 * 用法：
 *   # 1) 从当前 MYSQL_*（默认本地）导出
 *   node scripts/sync-products.mjs export
 *
 *   # 2) 只把落地页 URL/形态对齐到 /apps/...（推荐，不丢投票）
 *   node scripts/sync-products.mjs patch-urls
 *
 *   # 3) 用本地导出的 JSON 写入「目标库」（设置目标 MYSQL_*）
 *   MYSQL_HOST=远程主机 MYSQL_USER=... MYSQL_PASSWORD=... MYSQL_DATABASE=... \
 *     node scripts/sync-products.mjs import
 *
 *   # 4) 清空并按场景种子重写（会删掉现有产品）
 *   MYSQL_HOST=... MYSQL_USER=... MYSQL_PASSWORD=... \
 *     npm run seed:scenes --prefix server
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { initDb, pool } from "../server/db.js";
import { listProducts, writeProduct, deleteProduct } from "../server/store.js";
import { syncAppLandings } from "../server/syncAppLandings.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DUMP = path.join(__dirname, "data", "products-export.json");

const cmd = process.argv[2] || "patch-urls";

async function exportProducts() {
  await initDb();
  const list = await listProducts();
  await fs.mkdir(path.dirname(DUMP), { recursive: true });
  await fs.writeFile(DUMP, JSON.stringify(list, null, 2), "utf8");
  console.log(`[export] ${list.length} products → ${DUMP}`);
}

async function importProducts() {
  await initDb();
  const raw = await fs.readFile(DUMP, "utf8");
  const list = JSON.parse(raw);
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error(`empty dump: ${DUMP}`);
  }

  const replace = process.argv.includes("--replace");
  if (replace) {
    const existing = await listProducts();
    for (const p of existing) await deleteProduct(p.id);
    console.log(`[import] cleared ${existing.length} existing products`);
  }

  let n = 0;
  for (const product of list) {
    await writeProduct(product);
    n += 1;
    console.log(`[import] + ${product.name} → ${product.url}`);
  }
  console.log(`[import] upserted ${n} products into current MYSQL_* database`);
}

async function main() {
  if (cmd === "export") {
    await exportProducts();
  } else if (cmd === "import") {
    await importProducts();
  } else if (cmd === "patch-urls") {
    await initDb();
    await syncAppLandings({ force: true });
  } else {
    console.error(`Unknown command: ${cmd}`);
    console.error("Use: export | import | patch-urls");
    process.exit(1);
  }
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await pool.end();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
