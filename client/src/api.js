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

export async function register(username, nickname, password) {
  return request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, nickname, password }),
  });
}

export async function forgotPassword(username, nickname, password) {
  return request("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ username, nickname, password }),
  });
}

export async function fetchMe() {
  return request("/api/auth/me");
}

export async function fetchCategoryOptions() {
  return request("/api/category-options");
}

export async function fetchProducts({ category = "全部", range = "all", topicId = "", special = false, q = "" } = {}) {
  const params = new URLSearchParams();
  if (category && category !== "全部") params.set("category", category);
  if (range) params.set("range", range);
  if (topicId) params.set("topicId", topicId);
  if (special) params.set("special", "true");
  if (q) params.set("q", q);
  const query = params.toString();
  return request(`/api/products${query ? `?${query}` : ""}`);
}

export async function fetchProduct(id) {
  return request(`/api/products/${encodeURIComponent(id)}`);
}

export async function fetchStats() {
  return request("/api/stats");
}

export async function postComment(productId, content) {
  return request(`/api/products/${encodeURIComponent(productId)}/comments`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
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

export async function voteProduct(id, rating) {
  return request(`/api/products/${id}/vote`, {
    method: "POST",
    body: JSON.stringify({ rating }),
  });
}

/* ---------------- 话题 API ---------------- */

export async function fetchTopics({ tab = "hot", sort = "hot", city = "", page = 1, pageSize = 20, all = false, q = "" } = {}) {
  const params = new URLSearchParams();
  if (tab) params.set("tab", tab);
  if (sort) params.set("sort", sort);
  if (city) params.set("city", city);
  if (q) params.set("q", q);
  if (all) params.set("all", "1");
  else {
    if (page) params.set("page", page);
    if (pageSize) params.set("pageSize", pageSize);
  }
  const query = params.toString();
  return request(`/api/topics${query ? `?${query}` : ""}`);
}

export async function createTopic({ name, description, coverImage }) {
  return request("/api/topics", {
    method: "POST",
    body: JSON.stringify({ name, description, coverImage }),
  });
}

export async function fetchTopic(id) {
  return request(`/api/topics/${encodeURIComponent(id)}`);
}

export async function fetchTopicPosts(topicId) {
  return request(`/api/topics/${encodeURIComponent(topicId)}/posts`);
}

export async function submitTopicPost(topicId, { title, content, imageUrl, linkUrl }) {
  return request(`/api/topics/${encodeURIComponent(topicId)}/posts`, {
    method: "POST",
    body: JSON.stringify({ title, content, imageUrl, linkUrl }),
  });
}

export async function fetchTopicPost(id) {
  return request(`/api/topic-posts/${encodeURIComponent(id)}`);
}

export async function likeTopicPost(id) {
  return request(`/api/topic-posts/${encodeURIComponent(id)}/like`, {
    method: "POST",
  });
}

export async function postTopicComment(id, content) {
  return request(`/api/topic-posts/${encodeURIComponent(id)}/comments`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function followTopic(id) {
  return request(`/api/topics/${id}/follow`, { method: "POST" });
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

export async function setProductSpecial(id, isSpecial) {
  return request(`/api/admin/products/${id}/special`, {
    method: "POST",
    body: JSON.stringify({ isSpecial }),
  });
}

/* ---------------- 轮播图 API ---------------- */

export async function fetchBanners() {
  return request("/api/banners");
}

export async function fetchAdminBanners() {
  return request("/api/admin/banners");
}

export async function createBanner({ title, subtitle, imageUrl, linkUrl, sort, enabled }) {
  return request("/api/admin/banners", {
    method: "POST",
    body: JSON.stringify({ title, subtitle, imageUrl, linkUrl, sort, enabled }),
  });
}

export async function updateBanner(id, { title, subtitle, imageUrl, linkUrl, sort, enabled }) {
  return request(`/api/admin/banners/${id}`, {
    method: "PUT",
    body: JSON.stringify({ title, subtitle, imageUrl, linkUrl, sort, enabled }),
  });
}

export async function deleteBanner(id) {
  return request(`/api/admin/banners/${id}`, { method: "DELETE" });
}

/* ---------------- 导航 API ---------------- */

export async function fetchNavs() {
  return request("/api/navs");
}

export async function fetchAdminNavs() {
  return request("/api/admin/navs");
}

export async function createNav({ title, url, sort, enabled }) {
  return request("/api/admin/navs", {
    method: "POST",
    body: JSON.stringify({ title, url, sort, enabled }),
  });
}

export async function updateNav(id, { title, url, sort, enabled }) {
  return request(`/api/admin/navs/${id}`, {
    method: "PUT",
    body: JSON.stringify({ title, url, sort, enabled }),
  });
}

export async function deleteNav(id) {
  return request(`/api/admin/navs/${id}`, { method: "DELETE" });
}

export async function reorderNavs(ids) {
  return request("/api/admin/navs/reorder", {
    method: "PUT",
    body: JSON.stringify({ ids }),
  });
}
