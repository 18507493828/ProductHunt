import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword } from "../api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      setSuccess("");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      const result = await forgotPassword(username, nickname, password);
      setSuccess(result.message || "密码已重置，请使用新密码登录");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>忘记密码</h1>
        <p className="auth-tip">验证登录账号与昵称后，可设置新密码</p>

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
          昵称
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            autoComplete="nickname"
            placeholder="注册时填写的昵称"
            required
          />
        </label>

        <label>
          新密码
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
          确认新密码
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="再次输入新密码"
            minLength={6}
            required
          />
        </label>

        {error && <div className="error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? "提交中..." : "重置密码"}
        </button>

        <p className="auth-switch">
          想起密码了？<Link to="/login">返回登录</Link>
        </p>
        <p className="auth-switch">
          <Link to="/register">还没有账号？去注册</Link>
        </p>
      </form>
    </div>
  );
}
