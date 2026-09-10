import { SHARE_PLATFORMS } from "./sharePlatforms";

export function buildProductShareUrl(productOrId) {
  const id =
    typeof productOrId === "string" || typeof productOrId === "number"
      ? productOrId
      : productOrId?.id;
  if (!id) return "";
  return `${window.location.origin}/resource/${id}`;
}

function productBasics(product, config = null) {
  const name = String(product?.name || "").trim() || "这个作品";
  const tagline = String(product?.tagline || "").trim();
  const prefix = String(config?.titlePrefix || "").trim();
  const footer = String(config?.footer || "").trim();
  const title = prefix ? `${prefix}${name}` : name;
  const categories = Array.isArray(product?.categories)
    ? product.categories.filter(Boolean)
    : product?.category
      ? [product.category]
      : [];
  return { name, tagline, title, footer, prefix, categories };
}

function hashtagFromLabel(label) {
  return String(label || "")
    .replace(/\s+/g, "")
    .replace(/[^\u4e00-\u9fa5A-Za-z0-9]/g, "");
}

function buildHashtags(categories, extras = []) {
  const tags = [
    ...extras,
    ...categories.map(hashtagFromLabel),
    "VibeBuilding",
    "独立开发",
  ]
    .map((t) => String(t || "").trim())
    .filter(Boolean);
  const unique = [...new Set(tags)].slice(0, 6);
  return unique.map((t) => `#${t}`).join(" ");
}

function defaultTemplate(platform) {
  return (
    SHARE_PLATFORMS.find((p) => p.id === platform)?.defaultTemplate || "{url}"
  );
}

function platformExtras(platform) {
  if (platform === "douyin") return ["程序员", "效率工具", "AI应用"];
  if (platform === "xiaohongshu") return ["种草", "效率神器", "程序员日常"];
  return [];
}

function fillTemplate(template, vars) {
  return String(template || "")
    .replace(/\{(\w+)\}/g, (_, key) => {
      const value = vars[key];
      return value == null ? "" : String(value);
    })
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildShareVars(platform, product, url, config = null) {
  const { name, tagline, title, footer, prefix, categories } = productBasics(
    product,
    config,
  );
  const fallbackTagline =
    platform === "wechat"
      ? "我觉得挺有意思，适合开发者看看。"
      : platform === "xiaohongshu"
        ? "体验流畅，值得一试"
        : "开发者友好，上手快，建议收藏试试。";
  return {
    name,
    title,
    prefix,
    tagline: tagline || fallbackTagline,
    url: url || "",
    footer: footer || "",
    tags: buildHashtags(categories, platformExtras(platform)),
  };
}

/** 通用默认文案 */
export function buildProductShareText(
  product,
  url = buildProductShareUrl(product),
  config = null,
) {
  const { title, tagline, footer } = productBasics(product, config);
  const includeTagline = config ? config.includeTagline !== false : true;
  const includeUrl = config ? config.includeUrl !== false : true;
  const lines = [title];
  if (includeTagline && tagline) lines.push(tagline);
  if (includeUrl && url) lines.push(url);
  if (footer) lines.push(footer);
  return lines.filter(Boolean).join("\n");
}

export function buildPlatformShareText(platform, product, url, config = null) {
  const platformConfig = config?.platforms?.[platform];
  if (platformConfig && platformConfig.enabled === false) {
    return "";
  }
  const template =
    String(platformConfig?.template || "").trim() || defaultTemplate(platform);
  const vars = buildShareVars(platform, product, url, config);
  if (platform === "link") {
    return vars.url || buildProductShareUrl(product);
  }
  const text = fillTemplate(template, vars);
  if (vars.footer && !text.includes(vars.footer)) {
    return [text, vars.footer].filter(Boolean).join("\n");
  }
  return text;
}

export async function copyShareText(text) {
  const value = String(text || "");
  if (!value) throw new Error("没有可复制的内容");

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(textarea);
  if (!ok) throw new Error("复制失败");
}

/** 相对路径封面转成可 fetch 的绝对地址 */
export function resolveShareImageUrl(imageUrl) {
  const value = String(imageUrl || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;
  const path = value.startsWith("/") ? value : `/${value}`;
  return `${window.location.origin}${path}`;
}

async function blobToPngBlob(blob) {
  if (!blob) throw new Error("封面为空");
  if (blob.type === "image/png") return blob;

  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("无法处理封面图");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close?.();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (png) => {
        if (!png) reject(new Error("封面转换失败"));
        else resolve(png);
      },
      "image/png",
    );
  });
}

export async function fetchShareImageBlob(imageUrl) {
  const absolute = resolveShareImageUrl(imageUrl);
  if (!absolute) throw new Error("没有封面图");
  const res = await fetch(absolute, {
    mode: "cors",
    credentials: "same-origin",
    cache: "force-cache",
  });
  if (!res.ok) throw new Error("封面加载失败");
  return blobToPngBlob(await res.blob());
}

/**
 * 复制分享文案；若有封面则尽量连同图片写入剪贴板。
 * @returns {{ copiedImage: boolean }}
 */
export async function copySharePayload(text, imageUrl = "") {
  const value = String(text || "");
  if (!value) throw new Error("没有可复制的内容");

  const cover = String(imageUrl || "").trim();
  if (!cover || !navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    await copyShareText(value);
    return { copiedImage: false };
  }

  try {
    const pngBlob = await fetchShareImageBlob(cover);
    const textBlob = new Blob([value], { type: "text/plain" });
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/plain": textBlob,
        "image/png": pngBlob,
      }),
    ]);
    return { copiedImage: true };
  } catch {
    // 部分浏览器/跨域图无法写入图片，至少保证文案可复制
    await copyShareText(value);
    return { copiedImage: false };
  }
}
