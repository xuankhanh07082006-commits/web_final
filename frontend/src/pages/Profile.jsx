import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Profile() {
  const [avatar, setAvatar] = useState(''); // Ảnh đại diện (nếu có)
  const [isUploading, setIsUploading] = useState(false);
  const [profile, setProfile] = useState({ username: '', email: '' });
  const [profileMessage, setProfileMessage] = useState('');
  const navigate = useNavigate();
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          if (data.avatar_url) setAvatar(data.avatar_url);
          setProfile({ username: data.username || '', email: data.email || '' });
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileMessage('');

    if (!profile.username || !profile.email) {
      setProfileMessage('Vui lòng nhập đầy đủ tên hiển thị và email.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: profile.username, email: profile.email })
      });
      const data = await res.json();
      if (res.ok) {
        setProfileMessage('Cập nhật hồ sơ thành công.');
      } else {
        setProfileMessage(data.message || 'Cập nhật hồ sơ thất bại.');
      }
    } catch (err) {
      setProfileMessage('Lỗi hệ thống khi cập nhật hồ sơ.');
    }
  };
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const [error, setError] = useState('');
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setAvatar(previewUrl);
      const formData = new FormData();
      formData.append('avatar', file);
      try {
        setIsUploading(true);
        const token = localStorage.getItem('token');
        const res = await fetch('/api/auth/avatar', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        const data = await res.json();
        if (!res.ok) alert(data.message);
      } catch (err) {
        console.error(err);
        alert('Tải ảnh thất bại');
      } finally {
        setIsUploading(false);
      }
    }
  };
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwords.old || !passwords.new || !passwords.confirm) {
      setError('Vui lòng nhập đủ các ô!');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setError('Mật khẩu mới không khớp!');
      return;
    }
    
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ oldPassword: passwords.old, newPassword: passwords.new })
      });
      const data = await res.json();
      
      if (res.ok) {
        alert('Đổi mật khẩu thành công!');
        setPasswords({ old: '', new: '', confirm: '' }); // Reset form
      } else {
        setError(data.message);
      }
    } catch(err) {
      setError('Lỗi hệ thống');
    }
  };

  return (
    <div className="profile-page" style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', paddingTop: '60px' }}>
      <button className="profile-back" onClick={() => navigate('/')}>
        <span style={{ fontSize: '18px' }}>←</span> Quay lại ghi chú
      </button>
      <h2>👤 Quản lý Hồ sơ</h2>
      <hr style={{ marginBottom: '20px' }} />
      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Thông tin cá nhân</h3>
        <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label>Tên hiển thị:</label>
            <input
              type="text"
              value={profile.username}
              onChange={(e) => setProfile({ ...profile, username: e.target.value })}
              style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          <div>
            <label>Email:</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          {profileMessage && <span style={{ fontSize: '12px', color: profileMessage.includes('thành công') ? '#16a34a' : '#dc2626' }}>{profileMessage}</span>}
          <button type="submit" style={{ padding: '10px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Lưu thông tin
          </button>
        </form>
      </div>
      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
        <h3>Ảnh đại diện</h3>
        {avatar ? (
          <img 
            src={avatar} 
            alt="Avatar" 
            style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary-color)', marginBottom: '15px' }} 
          />
        ) : (
          <div
            style={{
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              border: '3px solid var(--primary-color)',
              margin: '0 auto 15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              fontWeight: '700',
              color: 'var(--text-color)',
              background: 'rgba(255,255,255,0.6)'
            }}
          >
            {(profile.username || '?').trim().charAt(0).toUpperCase()}
          </div>
        )}
        <br />
        <input type="file" accept="image/*" id="avatar-upload" style={{ display: 'none' }} onChange={handleAvatarChange} />
        <label htmlFor="avatar-upload" style={{ cursor: 'pointer', padding: '8px 15px', backgroundColor: 'var(--primary-color)', color: '#fff', borderRadius: '4px' }}>
          📷 Thay đổi Avatar
        </label>
      </div>
      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: '8px' }}>
        <h3> Đổi mật khẩu</h3>
        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div>
            <label>Mật khẩu hiện tại:</label>
            <input type="password" value={passwords.old} onChange={(e) => setPasswords({...passwords, old: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }} />
          </div>

          <div>
            <label>Mật khẩu mới:</label>
            <input type="password" value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }} />
          </div>

          <div>
            <label>Xác nhận mật khẩu mới:</label>
            <input type="password" value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: error ? '1px solid red' : '1px solid #ccc' }} />
            {error && <span style={{ color: 'red', fontSize: '12px' }}>{error}</span>}
          </div>

          <button type="submit" style={{ padding: '10px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>
            Lưu mật khẩu mới
          </button>
        </form>
      </div>
      
    </div>
  );
}

export default Profile;