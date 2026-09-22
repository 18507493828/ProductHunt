/**
 * 当前 MYSQL_* 库内的产品工具（默认只动本地）。
 * 本地与远程数据库永久分离：禁止把本地导出写入远程。
 *
 * 用法：
 *   node scripts/sync-products.mjs export      # 导出当前库产品到 JSON
 *   node scripts/sync-products.mjs patch-urls  # 只改落地页 URL（当前库）
 *
 * import 仅允许写入本机库（127.0.0.1 / localhost）。
 * 跨环境导入已禁用。
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

function assertLocalDbOnly(action) {
  const host = String(process.env.MYSQL_HOST || "127.0.0.1")
    .trim()
    .toLowerCase();
  const local =
    host === "127.0.0.1" ||
    host === "localhost" ||
    host === "::1" ||
    host === "0.0.0.0";
  if (!local) {
    throw new Error(
      `[blocked] ${action} 拒绝写入非本机库 MYSQL_HOST=${host}。本地与远程数据永久分离。`,
    );
  }
}

async function exportProducts() {
  await initDb();
  const list = await listProducts();
  await fs.mkdir(path.dirname(DUMP), { recursive: true });
  await fs.writeFile(DUMP, JSON.stringify(list, null, 2), "utf8");
  console.log(`[export] ${list.length} products → ${DUMP}`);
}

async function importProducts() {
  assertLocalDbOnly("import");
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
  console.log(`[import] upserted ${n} products into local MYSQL_* database`);
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
