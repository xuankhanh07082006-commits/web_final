import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

function Verify() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Đang xử lý kích hoạt...');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Thiếu mã kích hoạt.');
      return;
    }

    const checkAlreadyVerified = async () => {
      const accessToken = localStorage.getItem('token');
      if (!accessToken) return false;

      try {
        const meRes = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!meRes.ok) return false;
        const me = await meRes.json();
        return me.is_verified === 1 || me.is_verified === true;
      } catch {
        return false;
      }
    };

    const verifyAccount = async () => {
      try {
        const res = await fetch(`/api/auth/verify/${token}`);
        const data = await res.json();
        if (res.ok) {
          setStatus('success');
          setMessage(data.message || 'Kích hoạt thành công!');
          return;
        }

        const isVerified = await checkAlreadyVerified();
        if (isVerified) {
          setStatus('success');
          setMessage('Tài khoản đã được kích hoạt.');
        } else {
          setStatus('error');
          setMessage(data.message || 'Mã kích hoạt không hợp lệ hoặc đã được sử dụng.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Lỗi mạng khi kích hoạt tài khoản.');
      }
    };

    verifyAccount();
  }, [searchParams]);

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Xác thực tài khoản</h2>
        <p>{message}</p>

        {status !== 'loading' && (
          <div className="auth-link" style={{ marginTop: '12px' }}>
            <Link to="/login" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>
              Quay lại đăng nhập
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default Verify;
