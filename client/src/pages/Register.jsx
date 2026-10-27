import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../AuthContext";

function resolvePostAuthTarget(searchParams, user) {
  const from = (searchParams.get("from") || "").trim();
  if (from.startsWith("/") && !from.startsWith("/login") && !from.startsWith("/register")) {
    return from;
  }
  if (user?.role === "admin") return "/admin";
  return "/";
}

export default function Register() {
  const { user, loading: authLoading, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fromQuery = searchParams.get("from");
  const loginHref = fromQuery
    ? `/login?from=${encodeURIComponent(fromQuery)}`
    : "/login";

  useEffect(() => {
    if (authLoading || !user) return;
    navigate(resolvePostAuthTarget(searchParams, user), { replace: true });
  }, [authLoading, user, searchParams, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    const phone = username.trim();
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError("请输入正确的 11 位手机号");
      return;
    }
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const result = await register(phone, nickname, password);
      navigate(resolvePostAuthTarget(searchParams, result.user), {
        replace: true,
      });
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
        <h1>注册码上创</h1>
        <p className="auth-tip">构建 · 发布 · 霸榜 · 加入开发者应用共创平台</p>

        <label>
          手机号
          <input
            type="tel"
            inputMode="numeric"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            placeholder="请输入手机号"
            pattern="1[3-9][0-9]{9}"
            title="请输入正确的中国大陆 11 位手机号"
            minLength={11}
            maxLength={11}
            required
          />
        </label>

        <label>
          昵称
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            autoComplete="nickname"
            placeholder="社区展示名称，2-20 个字符"
            minLength={2}
            maxLength={20}
            required
          />
        </label>

        <label>
          密码
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="至少 6 位"
            minLength={6}
            required
          />
        </label>

        <label>
          确认密码
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="再次输入密码"
            minLength={6}
            required
          />
        </label>

        {error && <div className="error">{error}</div>}

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? "注册中..." : "注册"}
        </button>

        <p className="auth-switch">
          已有账号？<Link to={loginHref}>去登录</Link>
        </p>
      </form>
    </div>
  );
}
