import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MYSQL_HOST = process.env.MYSQL_HOST || "127.0.0.1";
const MYSQL_PORT = Number(process.env.MYSQL_PORT) || 3306;
const MYSQL_USER = process.env.MYSQL_USER || "root";
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD ?? "";
const MYSQL_DATABASE = process.env.MYSQL_DATABASE || "vibebuilding";

/** Date / mysql DATETIME(3) → ISO string (empty if null) */
export function toIso(value) {
  if (value == null || value === "") return "";
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    return value.toISOString();
  }
  const s = String(value).trim();
  if (!s) return "";
  if (s.includes("T") && (s.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(s))) {
    return s;
  }
  // MySQL DATETIME string stored as UTC wall time
  const normalized = s.includes(" ") ? `${s.replace(" ", "T")}Z` : s;
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? s : d.toISOString();
}

/** ISO / Date → MySQL DATETIME(3) string, or null */
export function toDbDate(iso) {
  if (iso == null || iso === "") return null;
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 23).replace("T", " ");
}

export function toBool(value, defaultTrue = false) {
  if (value == null) return defaultTrue;
  if (typeof value === "boolean") return value;
  return Number(value) !== 0;
}

export function fromBool(value) {
  return value ? 1 : 0;
}

const baseConfig = {
  host: MYSQL_HOST,
  port: MYSQL_PORT,
  user: MYSQL_USER,
  password: MYSQL_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  enableKeepAlive: true,
  timezone: "Z",
  dateStrings: true,
};

/** @type {import('mysql2/promise').Pool | null} */
export let pool = null;

function getPool() {
  if (!pool) {
    throw new Error("Database not initialized. Call initDb() first.");
  }
  return pool;
}

export async function query(sql, params = []) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

/**
 * @template T
 * @param {(conn: import('mysql2/promise').PoolConnection) => Promise<T>} fn
 * @returns {Promise<T>}
 */
export async function withTransaction(fn) {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    try {
      await conn.rollback();
    } catch {
      /* ignore */
    }
    throw err;
  } finally {
    conn.release();
  }
}

async function loadSchemaSql() {
  const schemaPath = path.join(__dirname, "schema.sql");
  return fs.readFile(schemaPath, "utf-8");
}

function splitSqlStatements(sql) {
  return sql
    .split(/;\s*\n/)
    .map((s) =>
      s
        .split("\n")
        .filter((line) => !/^\s*--/.test(line))
        .join("\n")
        .trim(),
    )
    .filter(Boolean);
}

async function applySchema(conn) {
  const schemaSql = await loadSchemaSql();
  for (const statement of splitSqlStatements(schemaSql)) {
    await conn.query(statement);
  }
}

export async function initDb() {
  // 先尝试无库连接并 CREATE DATABASE（root 可用）；普通业务账号常无建库权限，失败则直连已有库
  let bootstrap;
  try {
    bootstrap = await mysql.createConnection({
      ...baseConfig,
      multipleStatements: true,
    });
    try {
      await bootstrap.query(
        `CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
      );
    } catch (err) {
      console.warn(
        `[db] CREATE DATABASE skipped (${err.code || err.message}); using existing database`,
      );
    }
    await bootstrap.changeUser({ database: MYSQL_DATABASE });
    await applySchema(bootstrap);
  } catch (err) {
    if (bootstrap) {
      try {
        await bootstrap.end();
      } catch {
        /* ignore */
      }
      bootstrap = null;
    }
    // 直连目标库再建表（适合 Navicat 已建好 vibebuilding、用户无 CREATE 权限）
    bootstrap = await mysql.createConnection({
      ...baseConfig,
      database: MYSQL_DATABASE,
      multipleStatements: true,
    });
    await applySchema(bootstrap);
  } finally {
    if (bootstrap) {
      await bootstrap.end().catch(() => {});
    }
  }

  if (pool) {
    await pool.end().catch(() => {});
  }
  pool = mysql.createPool({
    ...baseConfig,
    database: MYSQL_DATABASE,
  });

  console.log(
    `[db] connected ${MYSQL_USER}@${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_DATABASE}`,
  );
  return pool;
}
