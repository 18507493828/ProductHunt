import { Link, Navigate, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import BrandLogo from "../../components/BrandLogo";

const NAV_GROUPS = [
  {
    items: [
      { to: "/admin", end: true, label: "数据看板" },
      { to: "/admin/products", end: false, label: "应用管理" },
      { to: "/admin/topics", end: false, label: "构建场景话题" },
      { to: "/admin/channels", end: false, label: "推广渠道管理" },
      { to: "/admin/rank-incentives", end: false, label: "榜单&激励管理" },
      { to: "/admin/build-tools", end: false, label: "构建工具&激励" },
    ],
  },
  {
    label: "内容运营",
    items: [
      { to: "/admin/votes", end: false, label: "投票管理" },
      { to: "/admin/categories", end: false, label: "分类管理" },
      { to: "/admin/campaigns", end: false, label: "活动管理" },
      { to: "/admin/banners", end: false, label: "轮播管理" },
      { to: "/admin/navs", end: false, label: "导航管理" },
    ],
  },
];

export default function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();

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
              <BrandLogo small showText={false} />
              <span className="admin-sidebar-title">返回首页</span>
            </Link>

            <nav className="admin-sidebar-nav" aria-label="后台导航">
              {NAV_GROUPS.map((group, groupIndex) => (
                <div className="admin-nav-group" key={group.label || groupIndex}>
                  {group.label ? (
                    <p className="admin-nav-group-label">{group.label}</p>
                  ) : null}
                  {group.items.map((item) => (
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
                </div>
              ))}
            </nav>
          </aside>

          <main className="admin-main">
            <header className="admin-main-header">
              <div className="admin-main-title">
                <span className="admin-brand-name">码上创 vibe building</span>
              </div>
              <span className="admin-header-user">{user.username}</span>
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
