import { Link, useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { useAuth } from "../AuthContext";
import BrandLogo from "./BrandLogo";
import { MainViewTabNav } from "./MainViewSwitch";
import SiteCmsNav from "./SiteCmsNav";
import { redirectToLogin } from "../authRedirect";

/**
 * 全站顶栏：首页 / 应用广场 / 我的 + CMS 导航 + 登录操作
 * 详情页与首页共用，避免进详情后菜单消失。
 */
export default function SiteHeader({
  activeView = null,
  onBuild,
  sticky = true,
}) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  function handleMainViewChange(viewId) {
    if (viewId === "home") {
      navigate("/");
      return;
    }
    navigate(`/?view=${encodeURIComponent(viewId)}`);
  }

  function handleBuild() {
    if (onBuild) {
      onBuild();
      return;
    }
    if (!user) {
      redirectToLogin(navigate, "/?build=1");
      return;
    }
    navigate("/?build=1");
  }

  return (
    <header className={sticky ? "ph-nav ph-nav-sticky" : "ph-nav"}>
      <div className="ph-nav-inner">
        <Link to="/" className="ph-logo" aria-label="码上创 vibe building">
          <BrandLogo />
        </Link>

        <MainViewTabNav
          activeView={activeView}
          loggedIn={!!user}
          onChange={handleMainViewChange}
        />

        <SiteCmsNav />

        <div className="ph-nav-actions">
          {user ? (
            <>
              <span className="ph-user-badge">
                <span className="ph-user-badge-icon" aria-hidden="true">
                  <User size={14} strokeWidth={2.2} />
                </span>
                {user.nickname || user.username}
              </span>
              {isAdmin && (
                <Link to="/admin" className="ph-nav-ghost">
                  ⚙ 运营端
                </Link>
              )}
              <button type="button" className="ph-nav-ghost" onClick={logout}>
                退出
              </button>
              <button
                type="button"
                className="ph-nav-primary"
                onClick={handleBuild}
              >
                我要构建
              </button>
            </>
          ) : (
            <Link to="/login" className="ph-nav-primary">
              注册 / 登录
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
