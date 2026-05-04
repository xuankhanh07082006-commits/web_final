import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!email) return setError('Vui lòng nhập email của bạn!');
    
    try {
      const res = await fetch('/api/auth/forgot-password/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setError('');
        setStep(2);
      } else {
        setError(data.message);
      }
    } catch(err) { setError('Lỗi mạng'); }
  };
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) return setError('Vui lòng nhập đủ 6 số OTP');
    
    try {
      const res = await fetch('/api/auth/forgot-password/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (res.ok) {
        setError('');
        setStep(3);
      } else {
        setError(data.message);
      }
    } catch(err) { setError('Lỗi khi kiểm tra mã OTP'); }
  };
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!passwords.new || !passwords.confirm) return setError('Vui lòng nhập đủ 2 ô!');
    if (passwords.new !== passwords.confirm) return setError('Mật khẩu không khớp!');
    
    try {
      const res = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword: passwords.new })
      });
      const data = await res.json();
      
      if (res.ok) {
        alert('🎉 Khôi phục mật khẩu thành công! Vui lòng đăng nhập lại.');
        navigate('/login'); 
      } else {
        setError(data.message);
      }
    } catch(err) { setError('Lỗi khi đổi mật khẩu'); }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Khôi Phục Mật Khẩu</h2>
        {step === 1 && (
          <form onSubmit={handleSendEmail} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '14px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Nhập email bạn đã đăng ký để nhận mã OTP.
            </p>
            <input type="email" placeholder="Nhập địa chỉ Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            {error && <span className="error-text">{error}</span>}
            <button type="submit">Gửi mã OTP</button>
          </form>
        )}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '14px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Mã OTP đã được gửi đến <strong>{email}</strong>
            </p>
            <input type="text" placeholder="Nhập mã OTP (6 số)" value={otp} onChange={(e) => setOtp(e.target.value)} required />
            {error && <span className="error-text">{error}</span>}
            <button type="submit">Xác nhận OTP</button>
          </form>
        )}
        {step === 3 && (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '14px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Tạo mật khẩu mới cho tài khoản của bạn.
            </p>
            <input type="password" placeholder="Mật khẩu mới" value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} required />
            <input type="password" placeholder="Xác nhận mật khẩu mới" value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} required />
            {error && <span className="error-text">{error}</span>}
            <button type="submit">Cập nhật mật khẩu</button>
          </form>
        )}

        <div className="auth-link" style={{ marginTop: '10px' }}>
          <Link to="/login" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;