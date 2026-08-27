import { getToken } from "./authStorage";

async function request(url, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || "请求失败");
  }

  return data;
}

export async function login(username, password) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function register(username, password) {
  return request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function fetchMe() {
  return request("/api/auth/me");
}

export async function fetchCategoryOptions() {
  return request("/api/category-options");
}

export async function fetchProducts({ category = "全部", range = "all" } = {}) {
  const params = new URLSearchParams();
  if (category && category !== "全部") params.set("category", category);
  if (range) params.set("range", range);
  const query = params.toString();
  return request(`/api/products${query ? `?${query}` : ""}`);
}

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("image", file);
  return request("/api/upload", { method: "POST", body: formData });
}

export async function fetchMyProducts() {
  return request("/api/me/products");
}

export async function submitProduct({
  name,
  tagline,
  url,
  category,
  description,
  imageUrl,
}) {
  return request("/api/products", {
    method: "POST",
    body: JSON.stringify({ name, tagline, url, category, description, imageUrl }),
  });
}

export async function voteProduct(id) {
  return request(`/api/products/${id}/vote`, { method: "POST" });
}

export async function fetchAdminProducts(status = "pending") {
  return request(`/api/admin/products?status=${encodeURIComponent(status)}`);
}

export async function approveProduct(id) {
  return request(`/api/admin/products/${id}/approve`, { method: "POST" });
}

export async function rejectProduct(id, reason = "") {
  return request(`/api/admin/products/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function deleteProduct(id) {
  return request(`/api/products/${id}`, { method: "DELETE" });
}
