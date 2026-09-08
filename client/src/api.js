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

export async function fetchAdminCategories() {
  return request("/api/admin/categories");
}

export async function createCategory({ name, sort, enabled }) {
  return request("/api/admin/categories", {
    method: "POST",
    body: JSON.stringify({ name, sort, enabled }),
  });
}

export async function updateCategory(id, { name, sort, enabled }) {
  return request(`/api/admin/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name, sort, enabled }),
  });
}

export async function deleteCategory(id) {
  return request(`/api/admin/categories/${id}`, { method: "DELETE" });
}

export async function fetchProducts({ category = "全部", range = "all", topicId = "", special = false, campaign = "", q = "" } = {}) {
  const params = new URLSearchParams();
  if (category && category !== "全部") params.set("category", category);
  if (range) params.set("range", range);
  if (topicId) params.set("topicId", topicId);
  if (campaign) params.set("campaign", campaign);
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
  categories = [],
  category,
  description,
  imageUrl,
  topicId = "",
  topicName = "",
  campaign = "",
}) {
  return request("/api/products", {
    method: "POST",
    body: JSON.stringify({
      name,
      tagline,
      url,
      categories,
      category,
      description,
      imageUrl,
      topicId,
      topicName,
      campaign,
    }),
  });
}

export async function updateProduct(
  id,
  {
    name,
    tagline,
    url,
    categories = [],
    category,
    description,
    imageUrl,
    topicId = "",
    topicName = "",
    campaign = "",
  },
) {
  return request(`/api/products/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({
      name,
      tagline,
      url,
      categories,
      category,
      description,
      imageUrl,
      topicId,
      topicName,
      campaign,
    }),
  });
}

export async function voteProduct(id, ratings) {
  return request(`/api/products/${id}/vote`, {
    method: "POST",
    body: JSON.stringify({ ratings }),
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

export async function fetchAdminProducts(status = "pending", filters = {}) {
  const params = new URLSearchParams();
  params.set("status", status);
  if (filters.q) params.set("q", filters.q);
  if (filters.campaign) params.set("campaign", filters.campaign);
  if (filters.category) params.set("category", filters.category);
  return request(`/api/admin/products?${params.toString()}`);
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

export async function setProductSpecial(id, { isSpecial, campaign } = {}) {
  return request(`/api/admin/products/${id}/special`, {
    method: "POST",
    body: JSON.stringify({ isSpecial, campaign }),
  });
}

export async function updateProductRank(id, payload) {
  return request(`/api/admin/products/${id}/rank`, {
    method: "POST",
    body: JSON.stringify(payload || {}),
  });
}

export async function fetchAdminRankings(filters = {}) {
  const params = new URLSearchParams();
  if (filters.campaign) params.set("campaign", filters.campaign);
  const qs = params.toString();
  return request(`/api/admin/rankings${qs ? `?${qs}` : ""}`);
}

export async function fetchAdminVotes(filters = {}) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.productId) params.set("productId", filters.productId);
  const qs = params.toString();
  return request(`/api/admin/votes${qs ? `?${qs}` : ""}`);
}

export async function deleteAdminVote(productId, userId) {
  return request(
    `/api/admin/votes/${encodeURIComponent(productId)}/${encodeURIComponent(userId)}`,
    { method: "DELETE" },
  );
}

export async function fetchShareConfig() {
  return request("/api/share-config");
}

export async function fetchAdminShareConfig() {
  return request("/api/admin/share-config");
}

export async function updateAdminShareConfig(payload) {
  return request("/api/admin/share-config", {
    method: "PUT",
    body: JSON.stringify(payload || {}),
  });
}

export async function fetchAdminShares(filters = {}) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.platform) params.set("platform", filters.platform);
  const qs = params.toString();
  const data = await request(`/api/admin/shares${qs ? `?${qs}` : ""}`);
  if (Array.isArray(data)) {
    return { items: data, stats: { all: data.length } };
  }
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    stats: data?.stats || { all: 0 },
  };
}

export async function deleteAdminShare(id) {
  return request(`/api/admin/shares/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function recordProductShare(id, { platform = "" } = {}) {
  return request(`/api/products/${encodeURIComponent(id)}/share`, {
    method: "POST",
    body: JSON.stringify({ platform }),
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

/* ---------------- 活动配置 API ---------------- */

export async function fetchCampaigns() {
  return request("/api/campaigns");
}

export async function fetchCampaign(id) {
  return request(`/api/campaigns/${encodeURIComponent(id)}`);
}

export async function fetchAdminCampaigns() {
  return request("/api/admin/campaigns");
}

export async function createCampaign(payload) {
  return request("/api/admin/campaigns", {
    method: "POST",
    body: JSON.stringify(payload || {}),
  });
}

export async function updateCampaign(id, payload) {
  return request(`/api/admin/campaigns/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload || {}),
  });
}

export async function deleteCampaign(id) {
  return request(`/api/admin/campaigns/${id}`, { method: "DELETE" });
}
