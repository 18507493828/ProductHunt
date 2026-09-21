/** 应用定价展示工具 */

function normalizePriceText(value) {
  return String(value ?? "").trim();
}

export function isNegotiablePrice(value) {
  return /^(面议)$/.test(normalizePriceText(value));
}

export function isProductFree(product) {
  const raw = normalizePriceText(product?.price);
  if (!raw || isNegotiablePrice(raw)) return false;
  if (/^(免费|free|0|0\.0+|0元)$/i.test(raw)) return true;
  const num = Number(raw);
  return Number.isFinite(num) && num <= 0;
}

/** 把已保存价格还原成发布表单的「自定义 / 面议」 */
export function priceFormFromStored(price) {
  const raw = normalizePriceText(price);
  if (!raw) return { priceMode: "", price: "" };
  if (isNegotiablePrice(raw)) return { priceMode: "negotiable", price: "" };
  return { priceMode: "custom", price: raw };
}

function formatMoney(raw) {
  const text = normalizePriceText(raw);
  if (!text) return "";
  const num = Number(text);
  if (Number.isFinite(num)) {
    return `¥${Number.isInteger(num) ? num : num.toFixed(2)}`;
  }
  return /[¥￥]/.test(text) ? text : `¥${text}`;
}

export function formatProductPrice(product) {
  const price = normalizePriceText(product?.price);
  const original = normalizePriceText(product?.originalPrice);

  if (!price || isProductFree(product)) {
    return {
      display: "",
      original: "",
      free: false,
      ranged: false,
      negotiable: false,
    };
  }

  if (isNegotiablePrice(price)) {
    return {
      display: "面议",
      original: "",
      free: false,
      ranged: false,
      negotiable: true,
    };
  }

  return {
    display: formatMoney(price),
    original: original ? formatMoney(original) : "",
    free: false,
    ranged: false,
    negotiable: false,
  };
}

export function buildCreatorChatPath(product) {
  const id = product?.id;
  if (!id) return "/chat";
  return `/chat/${encodeURIComponent(id)}`;
}
