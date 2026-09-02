import { Link, Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../AuthContext";

const NAV_ITEMS = [
  { to: "/admin", end: true, label: "总览" },
  { to: "/admin/products", end: false, label: "资源审核" },
  { to: "/admin/banners", end: false, label: "轮播图管理" },
  { to: "/admin/navs", end: false, label: "导航管理" },
];

const TITLE_MAP = {
  "/admin": "后台总览",
  "/admin/products": "资源审核",
  "/admin/banners": "轮播图管理",
  "/admin/navs": "导航管理",
};

export default function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  const { pathname } = useLocation();
  const title = TITLE_MAP[pathname] || "后台管理";

  if (loading) {
    return <div className="auth-page">加载中...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>无权限</h1>
          <p className="auth-tip">需要管理员账号才能访问后台</p>
          <Link to="/" className="auth-submit-link">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="ph-page">
      <div className="admin-page">
        <div className="admin-layout">
          <aside className="admin-sidebar">
            <Link to="/" className="admin-sidebar-brand">
              <span className="admin-sidebar-logo" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                  <path
                    d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <span className="admin-sidebar-title">返回首页</span>
            </Link>

            <nav className="admin-sidebar-nav" aria-label="后台导航">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    "admin-nav-item" + (isActive ? " active" : "")
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>

          <main className="admin-main">
            <header className="admin-main-header">
              <div className="admin-main-title">
                <span className="admin-brand-name">Vibe Building</span>
                <span className="admin-brand-divider">·</span>
                <h1>{title}</h1>
              </div>
              <span className="admin-header-user">管理员：{user.username}</span>
            </header>
            <div className="admin-main-content">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
