/**
 * 跳转登录页。
 * 默认 replace：避免「业务页 → 登录 → 回跳」在历史里留下登录页，
 * 导致登录成功后再点浏览器返回又回到登录。
 */
export function redirectToLogin(navigate, fromPath = "") {
  const from =
    (fromPath || `${window.location.pathname}${window.location.search}` || "/")
      .trim() || "/";
  const safeFrom = from.startsWith("/") ? from : "/";
  navigate(`/login?from=${encodeURIComponent(safeFrom)}`, { replace: true });
}
