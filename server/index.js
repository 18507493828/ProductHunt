import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { PRODUCT_CATEGORIES, DEFAULT_CATEGORY } from "./categories.js";
import {
  initAuth,
  registerUser,
  loginUser,
  getUserById,
  requireAuth,
  requireAdmin,
  attachUserIfPresent,
} from "./auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || "0.0.0.0";
const CLIENT_DIST = path.join(__dirname, "..", "client", "dist");
const STORAGE_DIR = path.join(__dirname, "storage", "products");
const UPLOADS_DIR = path.join(__dirname, "storage", "uploads");
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const RANGES = ["today", "week", "month", "all"];
const URL_PATTERN = /^https?:\/\/.+/i;
const IMAGE_URL_PATTERN = /^(https?:\/\/.+|\/uploads\/[\w.-]+)$/i;
const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const AVATAR_COLORS = [
  "#FF5722",
  "#FF7043",
  "#F4511E",
  "#E65100",
  "#FF8A65",
  "#D84315",
  "#FF6D00",
  "#BF360C",
];

const DAY_MS = 24 * 60 * 60 * 1000;

await fs.mkdir(STORAGE_DIR, { recursive: true });
await fs.mkdir(UPLOADS_DIR, { recursive: true });
await initAuth();

if (IS_PRODUCTION) {
  app.use(express.static(CLIENT_DIST));
}

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(UPLOADS_DIR));

const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase() || ".png";
      cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`);
    },
  }),
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (IMAGE_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("仅支持 JPG / PNG / GIF / WebP 图片"));
    }
  },
});

function pickAvatarColor(name = "") {
  const hash = [...name].reduce((acc, ch) => acc + ch.codePointAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

async function readProductFile(filePath) {
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw);
}

async function writeProductFile(product) {
  const filePath = path.join(STORAGE_DIR, `${product.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(product, null, 2), "utf-8");
}

async function listProducts() {
  const entries = await fs.readdir(STORAGE_DIR, { withFileTypes: true });
  const products = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;

    try {
      const product = await readProductFile(path.join(STORAGE_DIR, entry.name));
      if (!product || !product.id) continue;
      products.push(product);
    } catch {
      // skip invalid files
    }
  }

  return products;
}

async function getProduct(id) {
  const filePath = path.join(STORAGE_DIR, `${id}.json`);
  await fs.access(filePath);
  return readProductFile(filePath);
}

function getRangeStart(range) {
  const now = Date.now();

  if (range === "today") {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  if (range === "week") return now - 7 * DAY_MS;
  if (range === "month") return now - 30 * DAY_MS;
  return 0;
}

function toPublicProduct(product, currentUser) {
  const voteCount = Array.isArray(product.voters) ? product.voters.length : 0;
  return {
    id: product.id,
    name: product.name,
    tagline: product.tagline,
    description: product.description,
    url: product.url,
    category: product.category,
    color: product.color,
    imageUrl: product.imageUrl || "",
    voteCount,
    votedByMe: currentUser
      ? Array.isArray(product.voters) && product.voters.includes(currentUser.id)
      : false,
    submittedBy: product.submittedBy,
    submittedAt: product.submittedAt,
    status: product.status,
    rejectReason: product.rejectReason || "",
    reviewedAt: product.reviewedAt || "",
  };
}

function sortProducts(products) {
  return products.sort((a, b) => {
    const voteDiff = b.voters.length - a.voters.length;
    if (voteDiff !== 0) return voteDiff;
    return (b.submittedAt || "").localeCompare(a.submittedAt || "");
  });
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const result = await registerUser(username, password);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const result = await loginUser(username, password);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(401).json({ error: "用户不存在" });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/category-options", (_req, res) => {
  res.json({ categories: PRODUCT_CATEGORIES });
});

app.post("/api/upload", requireAuth, (req, res) => {
  imageUpload.single("image")(req, res, (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "图片不能超过 2MB"
          : err.message || "图片上传失败";
      return res.status(400).json({ error: message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "请选择要上传的图片" });
    }
    res.json({ url: `/uploads/${req.file.filename}` });
  });
});

app.get("/api/products", attachUserIfPresent, async (req, res) => {
  try {
    const range = RANGES.includes(req.query.range) ? req.query.range : "all";
    const category = req.query.category && req.query.category !== "全部"
      ? req.query.category
      : "";
    const rangeStart = getRangeStart(range);

    const all = await listProducts();
    const approved = all.filter((product) => (product.status || "approved") === "approved");
    const filtered = approved.filter((product) => {
      if (category && product.category !== category) return false;
      if (rangeStart > 0) {
        const submittedTime = new Date(product.submittedAt || 0).getTime();
        if (submittedTime < rangeStart) return false;
      }
      return true;
    });

    const sorted = sortProducts(filtered).map((product) =>
      toPublicProduct(product, req.user)
    );
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/me/products", requireAuth, async (req, res) => {
  try {
    const all = await listProducts();
    const mine = all
      .filter((product) => product.submittedBy === req.user.username)
      .sort((a, b) => (b.submittedAt || "").localeCompare(a.submittedAt || ""))
      .map((product) => toPublicProduct(product, req.user));
    res.json(mine);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/products", requireAuth, async (req, res) => {
  try {
    const { name, tagline, description, url, category, imageUrl } = req.body || {};

    const trimmedName = (name || "").trim();
    const trimmedTagline = (tagline || "").trim();
    const trimmedUrl = (url || "").trim();
    const trimmedDescription = (description || "").trim();
    const trimmedImageUrl = (imageUrl || "").trim();

    if (!trimmedName) {
      return res.status(400).json({ error: "请填写产品名称" });
    }
    if (trimmedName.length > 50) {
      return res.status(400).json({ error: "产品名称不能超过 50 字" });
    }
    if (!trimmedTagline) {
      return res.status(400).json({ error: "请填写一句话介绍" });
    }
    if (trimmedTagline.length > 100) {
      return res.status(400).json({ error: "一句话介绍不能超过 100 字" });
    }
    if (trimmedUrl && !URL_PATTERN.test(trimmedUrl)) {
      return res.status(400).json({ error: "产品链接需以 http:// 或 https:// 开头" });
    }
    if (trimmedImageUrl && trimmedImageUrl.length > 500) {
      return res.status(400).json({ error: "图片链接过长" });
    }
    if (trimmedImageUrl && !IMAGE_URL_PATTERN.test(trimmedImageUrl)) {
      return res.status(400).json({ error: "图片链接格式不正确" });
    }

    const finalCategory = PRODUCT_CATEGORIES.includes(category)
      ? category
      : DEFAULT_CATEGORY;

    const isAdmin = req.user.role === "admin";
    const now = new Date().toISOString();

    const product = {
      id: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
      name: trimmedName,
      tagline: trimmedTagline,
      description: trimmedDescription,
      url: trimmedUrl,
      category: finalCategory,
      color: pickAvatarColor(trimmedName),
      imageUrl: trimmedImageUrl,
      voters: [],
      submittedBy: req.user.username,
      submittedAt: now,
      status: isAdmin ? "approved" : "pending",
      rejectReason: "",
      reviewedAt: isAdmin ? now : "",
      reviewedBy: isAdmin ? req.user.username : "",
    };

    await writeProductFile(product);

    res.json({
      message: isAdmin
        ? "发布成功，产品已上架"
        : "提交成功，等待管理员审核",
      product: toPublicProduct(product, req.user),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/products/:id/vote", requireAuth, async (req, res) => {
  try {
    const product = await getProduct(req.params.id);

    if ((product.status || "approved") !== "approved") {
      return res.status(403).json({ error: "该产品尚未上架" });
    }

    const voters = Array.isArray(product.voters) ? product.voters : [];
    const voted = voters.includes(req.user.id);

    if (voted) {
      product.voters = voters.filter((id) => id !== req.user.id);
    } else {
      product.voters = [...voters, req.user.id];
    }

    await writeProductFile(product);

    res.json({
      message: voted ? "已取消投票" : "投票成功",
      voted: !voted,
      voteCount: product.voters.length,
    });
  } catch {
    res.status(404).json({ error: "产品不存在" });
  }
});

app.get("/api/admin/products", requireAdmin, async (req, res) => {
  try {
    const status = req.query.status || "pending";
    const all = await listProducts();
    const filtered =
      status === "all" ? all : all.filter((p) => (p.status || "approved") === status);
    const sorted = filtered.sort((a, b) =>
      (b.submittedAt || "").localeCompare(a.submittedAt || "")
    );
    res.json(sorted.map((product) => toPublicProduct(product, req.user)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/products/:id/approve", requireAdmin, async (req, res) => {
  try {
    const product = await getProduct(req.params.id);
    product.status = "approved";
    product.reviewedAt = new Date().toISOString();
    product.reviewedBy = req.user.username;
    product.rejectReason = "";
    await writeProductFile(product);
    res.json({ message: "已通过审核", product: toPublicProduct(product, req.user) });
  } catch {
    res.status(404).json({ error: "产品不存在" });
  }
});

app.post("/api/admin/products/:id/reject", requireAdmin, async (req, res) => {
  try {
    const product = await getProduct(req.params.id);
    product.status = "rejected";
    product.reviewedAt = new Date().toISOString();
    product.reviewedBy = req.user.username;
    product.rejectReason = (req.body?.reason || "").trim();
    await writeProductFile(product);
    res.json({ message: "已拒绝", product: toPublicProduct(product, req.user) });
  } catch {
    res.status(404).json({ error: "产品不存在" });
  }
});

app.delete("/api/products/:id", requireAdmin, async (req, res) => {
  try {
    const product = await getProduct(req.params.id);
    if (product.imageUrl && product.imageUrl.startsWith("/uploads/")) {
      await fs.rm(path.join(UPLOADS_DIR, path.basename(product.imageUrl)), {
        force: true,
      });
    }
    await fs.rm(path.join(STORAGE_DIR, `${req.params.id}.json`), { force: true });
    res.json({ message: "删除成功" });
  } catch {
    res.status(404).json({ error: "产品不存在" });
  }
});

if (IS_PRODUCTION) {
  app.get("*", (_req, res) => {
    res.sendFile(path.join(CLIENT_DIST, "index.html"));
  });
}

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
