import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();
  const isMatch = password === confirmPassword;

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!isMatch) return;

    try {
      const response = await fetch(`/api/auth/register`,  {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username: displayName, password })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || 'Đăng ký thất bại');
        return;
      }
      localStorage.setItem("token", data.token);
      alert(data.message); // Hiển thị thông báo yêu cầu check email
      navigate("/");
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra khi gọi server');
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleRegister}>
        <h2>Đăng ký</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Tên hiển thị"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Xác nhận mật khẩu"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        {!isMatch && confirmPassword && (
          <p className="error-text">
            Mật khẩu không khớp
          </p>
        )}

        <button type="submit" disabled={!isMatch}>
          Đăng ký
        </button>

        <p className="auth-link">
          Đã có tài khoản?{" "}
          <Link to="/login">Đăng nhập</Link>
        </p>
      </form>
    </div>
  );
}