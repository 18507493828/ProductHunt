const TOKEN_KEY = "product_hunt_token";
const APP_SESSION_KEY = "mashangchuang_app_session";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
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
