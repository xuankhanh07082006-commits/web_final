import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (email && password) {
      try {
        const response = await fetch(`/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
          alert(data.message || 'Đăng nhập thất bại');
          return;
        }

        localStorage.setItem("token", data.token);
        navigate("/");
      } catch (error) {
        console.error(error);
        alert('Có lỗi xảy ra khi gọi server');
      }
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleLogin}>
        <h2>Đăng nhập</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Link 
          to="/forgot-password" 
          style={{ 
            fontSize: '13px', 
            color: 'var(--primary-color)', 
            textAlign: 'right', 
            textDecoration: 'none',
            marginTop: '-5px',
            marginBottom: '5px'
          }}
        >
          Quên mật khẩu?
        </Link>
        <button type="submit">Đăng nhập</button>

        <p className="auth-link">
          Chưa có tài khoản?{" "}
          <Link to="/register">Đăng ký ngay</Link>
        </p>
      </form>
    </div>
  );
}