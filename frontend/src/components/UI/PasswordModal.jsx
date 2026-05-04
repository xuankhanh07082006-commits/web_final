import React, { useState } from 'react';

function PasswordModal({ isOpen, onClose, onConfirm, mode = 'set', noteHasPassword = false }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (password === '') {
      setError('Vui lòng nhập mật khẩu!');
      return;
    }
    
    if (mode === 'set' && noteHasPassword && oldPassword === '') {
      setError('Vui lòng nhập mật khẩu hiện tại!');
      return;
    }

    if (mode === 'set') {
      if (password !== confirmPassword) {
        setError('Mật khẩu xác nhận không khớp!');
        return;
      }
    }
    
    setError('');
    
    try {
      await onConfirm(password, oldPassword);
      setPassword('');
      setConfirmPassword('');
      setOldPassword('');
    } catch (errMsg) {
      setError(errMsg.message || errMsg);
    }
  };

  const handleRemove = async () => {
    if (oldPassword === '') {
      setError('Vui lòng nhập mật khẩu hiện tại để gỡ khóa!');
      return;
    }
    try {
      await onConfirm('', oldPassword);
      setPassword('');
      setConfirmPassword('');
      setOldPassword('');
    } catch (errMsg) {
      setError(errMsg.message || errMsg);
    }
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div className="glass-modal" style={{ padding: '32px', maxWidth: '400px', width: '100%', color: 'var(--text-color)' }}>
        <h3 style={{ marginTop: 0, borderBottom: '1px solid var(--border-glass)', paddingBottom: '15px', fontSize: '24px', fontWeight: '700' }}>
          {mode === 'unlock' ? '🔓 Mở Khóa Ghi Chú' : mode === 'delete' ? '🗑️ Xác Nhận Xóa' : '🔒 Đặt Mật Khẩu'}
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
          {mode === 'set' && noteHasPassword && (
            <div>
              <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Mật khẩu hiện tại:</label>
              <input 
                type="password" 
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc', background: 'transparent', color: 'inherit' }}
              />
            </div>
          )}
          
          <div>
            <label style={{ fontSize: '14px', fontWeight: 'bold' }}>{mode === 'unlock' ? 'Nhập mật khẩu:' : mode === 'delete' ? 'Mật khẩu để xóa:' : 'Mật khẩu mới:'}</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc', background: 'transparent', color: 'inherit' }}
            />
          </div>

          {mode === 'set' && (
            <div>
              <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Xác nhận mật khẩu:</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: error && password !== confirmPassword ? '1px solid red' : '1px solid #ccc', background: 'transparent', color: 'inherit' }}
              />
            </div>
          )}
        </div>

        {error && (
          <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '15px', padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px', borderLeft: '3px solid #ef4444' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '25px', alignItems: 'center' }}>
          {mode === 'set' && noteHasPassword && (
            <button onClick={handleRemove} style={{ padding: '8px 15px', cursor: 'pointer', border: 'none', backgroundColor: '#dc3545', color: '#fff', borderRadius: '4px', marginRight: 'auto' }}>Gỡ Mật Khẩu</button>
          )}
          <button onClick={onClose} style={{ padding: '8px 15px', cursor: 'pointer', border: '1px solid #ccc', backgroundColor: 'transparent', color: 'inherit', borderRadius: '4px' }}>Hủy</button>
          <button onClick={handleSubmit} style={{ padding: '8px 15px', cursor: 'pointer', border: 'none', backgroundColor: mode === 'delete' ? '#dc3545' : 'var(--primary-color)', color: '#fff', borderRadius: '4px' }}>
            {mode === 'unlock' ? 'Mở Khóa' : mode === 'delete' ? 'Xóa Ghi Chú' : 'Xác Nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PasswordModal;