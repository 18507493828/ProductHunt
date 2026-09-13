/**
 * 码上创 vibe building · 小应用登录桥（无 UI）
 * - 静默复用主站 localStorage: product_hunt_token
 * - 会话缓存: mashangchuang_app_session
 * - 本地业务数据按登录账号隔离（scopedKey / readJSON / writeJSON）
 * - 默认不展示顶栏、不展示账号名；未登录也可使用
 */
(function (global) {
  const TOKEN_KEY = "product_hunt_token";
  const SESSION_KEY = "mashangchuang_app_session";

  function readToken() {
    try {
      return localStorage.getItem(TOKEN_KEY) || "";
    } catch {
      return "";
    }
  }

  function readSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || !data.user) return null;
      return data;
    } catch {
      return null;
    }
  }

  function writeSession(user, token) {
    const payload = {
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname || user.username,
        role: user.role || "user",
      },
      token: token || readToken(),
      syncedAt: Date.now(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
    return payload;
  }

  function clearSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }

  function displayName(user) {
    if (!user) return "访客";
    return String(user.nickname || user.username || "用户").trim() || "用户";
  }

  async function fetchMe(token) {
    const res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("unauthorized");
    const data = await res.json();
    return data.user || data;
  }

  async function resolveUser() {
    const token = readToken();
    const cached = readSession();
    if (!token) {
      clearSession();
      return null;
    }
    if (
      cached?.user &&
      cached.token === token &&
      Date.now() - (cached.syncedAt || 0) < 10 * 60e3
    ) {
      return cached.user;
    }
    try {
      const user = await fetchMe(token);
      writeSession(user, token);
      return user;
    } catch {
      clearSession();
      return null;
    }
  }

  function loginUrl() {
    const from = location.pathname + location.search + location.hash;
    return `/login?from=${encodeURIComponent(from || "/")}`;
  }

  function storageScope() {
    const u = getUser();
    if (u?.id) return `u:${u.id}`;
    if (u?.username) return `u:${u.username}`;
    return "guest";
  }

  /** 业务 localStorage key 按账号隔离 */
  function scopedKey(key) {
    return `msc:${storageScope()}:${key}`;
  }

  function readJSON(key, fallback) {
    try {
      const sk = scopedKey(key);
      let raw = localStorage.getItem(sk);
      if (raw == null) {
        // 兼容旧版未按账号隔离的数据，读到后迁移到当前账号下
        raw = localStorage.getItem(key);
        if (raw != null) localStorage.setItem(sk, raw);
      }
      if (raw == null || raw === "") return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(scopedKey(key), JSON.stringify(value));
  }

  function ensureStyles() {
    if (document.getElementById("msc-auth-style")) return;
    const style = document.createElement("style");
    style.id = "msc-auth-style";
    style.textContent = `
      .msc-gate{
        position:fixed;inset:0;z-index:9998;display:flex;align-items:center;justify-content:center;
        padding:24px;background:rgba(8,10,18,.72);backdrop-filter:blur(8px);
        font-family:"PingFang SC",system-ui,sans-serif;color:#fff;
      }
      .msc-gate-card{
        width:min(380px,100%);border-radius:20px;padding:28px 22px;text-align:center;
        background:linear-gradient(160deg,#2a2150,#151225 60%);
        border:1px solid rgba(255,255,255,.1);box-shadow:0 20px 50px rgba(0,0,0,.35);
      }
      .msc-gate-card h2{font-size:20px;margin:0 0 8px}
      .msc-gate-card p{font-size:13px;line-height:1.6;color:rgba(255,255,255,.72);margin:0 0 18px}
      .msc-gate-card .msc-primary{
        display:inline-flex;align-items:center;justify-content:center;gap:6px;
        min-width:160px;padding:12px 18px;border-radius:12px;font-weight:800;font-size:14px;
        background:linear-gradient(135deg,#7c6cff,#625cfc);color:#fff;text-decoration:none;
      }
      .msc-gate-card .msc-sub{display:block;margin-top:12px;font-size:12px;color:rgba(255,255,255,.55);text-decoration:none}
    `;
    document.head.appendChild(style);
  }

  function renderGate(appName) {
    ensureStyles();
    if (document.getElementById("msc-gate")) return;
    const gate = document.createElement("div");
    gate.id = "msc-gate";
    gate.className = "msc-gate";
    gate.innerHTML = `
      <div class="msc-gate-card">
        <h2>需要登录后继续</h2>
        <p>「${appName || "本应用"}」需要登录后使用。登录状态仅用于同步本机数据，不会在应用内展示账号信息。</p>
        <a class="msc-primary" href="${loginUrl()}">去登录</a>
        <a class="msc-sub" href="/">返回应用广场</a>
      </div>`;
    document.body.appendChild(gate);
  }

  function removeGate() {
    document.getElementById("msc-gate")?.remove();
  }

  let currentUser = null;

  async function boot(options = {}) {
    const opts = {
      requireLogin: false,
      showAuthBar: false,
      appName: document.title || "小应用",
      ...options,
    };
    currentUser = await resolveUser();
    // 外部小应用不展示「码上创 / 账号」顶栏
    document.getElementById("msc-auth-bar")?.remove();

    if (opts.requireLogin && !currentUser) {
      renderGate(opts.appName);
      document.documentElement.dataset.mscAuthed = "0";
      document.documentElement.dataset.mscUid = "";
      return null;
    }
    removeGate();
    document.documentElement.dataset.mscAuthed = currentUser ? "1" : "0";
    document.documentElement.dataset.mscUid = currentUser?.id
      ? String(currentUser.id)
      : "";
    if (typeof opts.onReady === "function") opts.onReady(currentUser);
    return currentUser;
  }

  function getUser() {
    return currentUser || readSession()?.user || null;
  }

  function meLabel(fallback = "我") {
    const u = getUser();
    return u ? displayName(u) : fallback;
  }

  function requireUser() {
    const u = getUser();
    if (!u) {
      location.href = loginUrl();
      return null;
    }
    return u;
  }

  global.MashangChuangAuth = {
    boot,
    resolveUser,
    getUser,
    meLabel,
    requireUser,
    displayName,
    loginUrl,
    writeSession,
    clearSession,
    storageScope,
    scopedKey,
    readJSON,
    writeJSON,
    SESSION_KEY,
    TOKEN_KEY,
  };
})(window);
