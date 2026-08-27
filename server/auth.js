import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_FILE = path.join(__dirname, "storage", "users.json");
const JWT_SECRET =
  process.env.JWT_SECRET || "skill-store-dev-secret-change-me";
const JWT_EXPIRES_IN = "7d";

const USERNAME_MIN_LENGTH = 3;

async function readUsersFile() {
  try {
    const raw = await fs.readFile(USERS_FILE, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data.users) ? data.users : [];
  } catch {
    return [];
  }
}

async function writeUsersFile(users) {
  await fs.mkdir(path.dirname(USERS_FILE), { recursive: true });
  await fs.writeFile(
    USERS_FILE,
    JSON.stringify({ users }, null, 2),
    "utf-8"
  );
}

function sanitizeUser(user) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt,
  };
}

function createToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export async function initAuth() {
  const users = await readUsersFile();
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123456";

  const hasAdmin = users.some((user) => user.role === "admin");
  if (!hasAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    users.push({
      id: crypto.randomUUID(),
      username: adminUsername,
      passwordHash,
      role: "admin",
      createdAt: new Date().toISOString(),
    });
    await writeUsersFile(users);
    console.log(`Default admin created: ${adminUsername}`);
  }
}

export async function registerUser(username, password) {
  const normalizedUsername = username.trim();
  if (normalizedUsername.length < USERNAME_MIN_LENGTH) {
    throw new Error("用户名至少 3 个字符");
  }
  if (!password || password.length < 6) {
    throw new Error("密码至少 6 位");
  }

  const users = await readUsersFile();
  if (users.some((user) => user.username === normalizedUsername)) {
    throw new Error("用户名已存在");
  }

  const user = {
    id: crypto.randomUUID(),
    username: normalizedUsername,
    passwordHash: await bcrypt.hash(password, 10),
    role: "user",
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  await writeUsersFile(users);

  return {
    token: createToken(user),
    user: sanitizeUser(user),
  };
}

export async function loginUser(username, password) {
  const normalizedUsername = username.trim();
  const users = await readUsersFile();
  const user = users.find((item) => item.username === normalizedUsername);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new Error("用户名或密码错误");
  }

  return {
    token: createToken(user),
    user: sanitizeUser(user),
  };
}

export async function getUserById(id) {
  const users = await readUsersFile();
  const user = users.find((item) => item.id === id);
  return user ? sanitizeUser(user) : null;
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  return header.slice(7).trim();
}

export function requireAuth(req, res, next) {
  const token = getBearerToken(req);
  const payload = token ? verifyToken(token) : null;

  if (!payload) {
    return res.status(401).json({ error: "请先登录" });
  }

  req.user = {
    id: payload.sub,
    username: payload.username,
    role: payload.role,
  };
  next();
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "需要管理员权限" });
    }
    next();
  });
}

export async function attachUserIfPresent(req, _res, next) {
  const token = getBearerToken(req);
  const payload = token ? verifyToken(token) : null;
  if (payload) {
    req.user = {
      id: payload.sub,
      username: payload.username,
      role: payload.role,
    };
  }
  next();
}
