import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import {
  listUsers,
  saveUser,
  updateUser,
  findUserByUsername,
  findUserById,
  countAdmins,
} from "./store.js";

const JWT_SECRET =
  process.env.JWT_SECRET || "skill-store-dev-secret-change-me";
const JWT_EXPIRES_IN = "7d";

const USERNAME_MIN_LENGTH = 3;

function sanitizeUser(user) {
  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname || user.username,
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
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123456";

  const adminCount = await countAdmins();
  if (adminCount === 0) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await saveUser({
      id: crypto.randomUUID(),
      username: adminUsername,
      nickname: "管理员",
      passwordHash,
      role: "admin",
      createdAt: new Date().toISOString(),
    });
    console.log(`Default admin created: ${adminUsername}`);
  }
}

export async function registerUser(username, nickname, password) {
  const normalizedUsername = username.trim();
  const normalizedNickname = nickname.trim();
  if (normalizedUsername.length < USERNAME_MIN_LENGTH) {
    throw new Error("登录账号至少 3 个字符");
  }
  if (normalizedNickname.length < 2) {
    throw new Error("昵称至少 2 个字符");
  }
  if (normalizedNickname.length > 20) {
    throw new Error("昵称不能超过 20 个字符");
  }
  if (!password || password.length < 6) {
    throw new Error("密码至少 6 位");
  }

  const existing = await findUserByUsername(normalizedUsername);
  if (existing) {
    throw new Error("该登录账号已被注册");
  }

  const user = {
    id: crypto.randomUUID(),
    username: normalizedUsername,
    nickname: normalizedNickname,
    passwordHash: await bcrypt.hash(password, 10),
    role: "user",
    createdAt: new Date().toISOString(),
  };

  await saveUser(user);

  return {
    token: createToken(user),
    user: sanitizeUser(user),
  };
}

export async function loginUser(username, password) {
  const normalizedUsername = username.trim();
  const user = await findUserByUsername(normalizedUsername);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new Error("登录账号或密码错误");
  }

  return {
    token: createToken(user),
    user: sanitizeUser(user),
  };
}

export async function resetPassword(username, nickname, password) {
  const normalizedUsername = username.trim();
  const normalizedNickname = nickname.trim();
  if (normalizedUsername.length < USERNAME_MIN_LENGTH) {
    throw new Error("请填写登录账号");
  }
  if (normalizedNickname.length < 2) {
    throw new Error("请填写昵称");
  }
  if (!password || password.length < 6) {
    throw new Error("新密码至少 6 位");
  }

  const user = await findUserByUsername(normalizedUsername);
  if (!user) {
    throw new Error("登录账号不存在");
  }

  const storedNickname = (user.nickname || user.username).trim();
  if (storedNickname !== normalizedNickname) {
    throw new Error("昵称与账号不匹配");
  }

  await updateUser({
    ...user,
    passwordHash: await bcrypt.hash(password, 10),
  });

  return { message: "密码已重置，请使用新密码登录" };
}

export async function getUserById(id) {
  const user = await findUserById(id);
  return user ? sanitizeUser(user) : null;
}

export async function getUsersNicknameMap() {
  const users = await listUsers();
  const map = {};
  for (const user of users) {
    map[user.username] = user.nickname || user.username;
  }
  return map;
}

export async function getUsersIdMap() {
  const users = await listUsers();
  const map = {};
  for (const user of users) {
    map[user.id] = sanitizeUser(user);
  }
  return map;
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
