import React, { useState, useEffect } from 'react';

function ShareModal({ isOpen, onClose, noteId }) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('read');
  const [sharedUsers, setSharedUsers] = useState([]);
  const [error, setError] = useState('');

  const fetchShares = async () => {
    try {
      const res = await fetch(`/api/shares/${noteId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSharedUsers(data);
      }
    } catch(err) { console.error('Lỗi lấy Shares', err); }
  };

  useEffect(() => {
    if (isOpen && noteId) {
      fetchShares();
    }
  }, [isOpen, noteId]);

  const handleShare = async () => {
    if (!email) return setError('Vui lòng nhập Email người nhận!');
    setError('');
    try {
      const res = await fetch('/api/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ noteId, recipientEmail: email, permission })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Lỗi hệ thống');
      } else {
        alert("Đã chia sẻ thành công!");
        setEmail('');
        fetchShares(); // load lại danh sách
      }
    } catch(err) {
      console.error(err);
      setError('Lỗi khi chia sẻ!');
    }
  };

  const handleRemove = async (shareId) => {
    try {
      await fetch(`/api/shares/${shareId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      fetchShares();
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangePermission = async (shareId, newPermission) => {
    try {
      const res = await fetch(`/api/shares/${shareId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ permission: newPermission })
      });
      if (res.ok) {
        fetchShares();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div className="glass-modal" style={{ padding: '32px', maxWidth: '500px', width: '100%', color: 'var(--text-color)' }}>
        <h3 style={{ marginTop: 0, borderBottom: '1px solid var(--border-glass)', paddingBottom: '15px', fontSize: '24px', fontWeight: '700' }}>👥 Chia Sẻ Ghi Chú</h3>
        
        <div className="share-modal-row" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <input 
            type="email" 
            placeholder="Nhập email người nhận..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="glass-panel"
            style={{ flex: 1, padding: '10px 15px', border: 'none' }}
          />
          <select className="glass-panel" value={permission} onChange={e => setPermission(e.target.value)} style={{ padding: '10px 15px', border: 'none' }}>
            <option value="read">Chỉ xem</option>
            <option value="edit">Được sửa</option>
          </select>
          <button className="btn-primary" onClick={handleShare} style={{ padding: '10px 20px', borderRadius: '8px' }}>Gửi Mời</button>
        </div>
        {error && <span style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px', display: 'block' }}>{error}</span>}

        <h4 style={{ marginTop: '25px', marginBottom: '15px', fontWeight: '600' }}>Danh sách người có quyền truy cập:</h4>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '200px', overflowY: 'auto' }}>
          {sharedUsers.length === 0 ? <li style={{ fontSize: '14px', fontStyle: 'italic', opacity: 0.7 }}>Chưa chia sẻ cho ai</li> : null}
          {sharedUsers.map(user => (
            <li key={user.share_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-glass)' }}>
              <div>
                <strong>{user.username}</strong> ({user.email}) <br/>
                <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <small style={{ color: 'var(--text-secondary)' }}>Quyền:</small>
                  <select 
                    value={user.permission} 
                    onChange={(e) => handleChangePermission(user.share_id, e.target.value)}
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '4px', padding: '2px 4px', fontSize: '12px', color: 'var(--text-color)', cursor: 'pointer', outline: 'none' }}
                  >
                    <option value="read">Chỉ xem</option>
                    <option value="edit">Được sửa</option>
                  </select>
                </div>
              </div>
              <button 
                className="glass-panel"
                onClick={() => handleRemove(user.share_id)}
                style={{ color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '6px 12px', cursor: 'pointer', fontSize: '13px' }}
              >
                Gỡ quyền
              </button>
            </li>
          ))}
        </ul>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px' }}>
          <button className="glass-panel" onClick={onClose} style={{ padding: '10px 20px', cursor: 'pointer', border: '1px solid var(--border-glass)' }}>Đóng</button>
        </div>
      </div>
    </div>
  );
}

export default ShareModal;
