import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../AuthContext";

function resolvePostLoginTarget(searchParams, user) {
  const from = (searchParams.get("from") || "").trim();
  if (user?.role === "admin") return "/admin";
  if (from.startsWith("/")) return from;
  return "/";
}

export default function Login() {
  const { user, loading: authLoading, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 已登录时不应停留在登录页（含浏览器返回又进登录的情况）
  useEffect(() => {
    if (authLoading || !user) return;
    const target = resolvePostLoginTarget(searchParams, user);
    navigate(target, { replace: true });
  }, [authLoading, user, searchParams, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      const result = await login(username, password);
      const target = resolvePostLoginTarget(searchParams, result.user);
      // replace：用目标页替换登录页，避免返回键回到登录
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || user) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <p className="auth-tip">正在进入…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>登录</h1>
        <p className="auth-tip">登录后可上传资源，并为喜欢的作品评分</p>

        <label>
          登录账号
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            placeholder="注册时使用的账号"
            required
          />
        </label>

        <label>
          密码
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <div className="auth-forgot-row">
          <Link to="/forgot-password" className="auth-forgot-link">
            忘记密码？
          </Link>
        </div>

        {error && <div className="error">{error}</div>}

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? "登录中..." : "登录"}
        </button>

        <p className="auth-switch">
          还没有账号？
          <Link to={`/register${searchParams.get("from") ? `?from=${encodeURIComponent(searchParams.get("from"))}` : ""}`}>
            去注册
          </Link>
        </p>
        <p className="auth-switch">
          <Link to="/">返回首页</Link>
        </p>
      </form>
    </div>
  );
}
