import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      const result = await login(username, password);
      navigate(result.user?.role === "admin" ? "/admin" : "/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>登录</h1>
        <p className="auth-tip">登录后可上传资源，并为喜欢的资源评分</p>

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
          还没有账号？<Link to="/register">去注册</Link>
        </p>
        <p className="auth-switch">
          <Link to="/">返回首页</Link>
        </p>
      </form>
    </div>
  );
}
