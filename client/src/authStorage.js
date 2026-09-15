const TOKEN_KEY = "product_hunt_token";
const APP_SESSION_KEY = "mashangchuang_app_session";
const LAST_LOGIN_USERNAME_KEY = "mashangchuang_last_login_username";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getLastLoginUsername() {
  try {
    return String(localStorage.getItem(LAST_LOGIN_USERNAME_KEY) || "").trim();
  } catch {
    return "";
  }
}

export function setLastLoginUsername(username) {
  const value = String(username || "").trim();
  if (!value) return;
  try {
    localStorage.setItem(LAST_LOGIN_USERNAME_KEY, value);
  } catch {
    /* ignore */
  }
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  try {
    localStorage.removeItem(APP_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/** 供 /apps 小应用读取的码上创会话（与 JWT 同步） */
export function syncAppSession(user, token = getToken()) {
  if (!user) {
    try {
      localStorage.removeItem(APP_SESSION_KEY);
    } catch {
      /* ignore */
    }
    return;
  }
  const payload = {
    user: {
      id: user.id,
      username: user.username,
      nickname: user.nickname || user.username,
      role: user.role || "user",
    },
    token: token || "",
    syncedAt: Date.now(),
  };
  localStorage.setItem(APP_SESSION_KEY, JSON.stringify(payload));
}
