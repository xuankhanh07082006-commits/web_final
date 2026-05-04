import React from 'react';

function ConfirmModal({ isOpen, message, onConfirm, onCancel }) {
  if (!isOpen) return null; // Nếu không mở thì ẩn đi

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div className="glass-modal" style={{ padding: '32px', maxWidth: '400px', width: '100%', color: 'var(--text-color)' }}>
        <h3 style={{ marginTop: 0, borderBottom: '1px solid var(--border-glass)', paddingBottom: '15px', fontSize: '24px', fontWeight: '700' }}>Xác nhận</h3>
        <p style={{ marginTop: '20px', fontSize: '16px', lineHeight: '1.5' }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
          <button className="glass-panel" onClick={onCancel} style={{ padding: '10px 20px', cursor: 'pointer', border: '1px solid var(--border-glass)', backgroundColor: 'transparent', color: 'var(--text-color)' }}>Hủy</button>
          <button className="glass-panel" onClick={onConfirm} style={{ padding: '10px 20px', cursor: 'pointer', border: 'none', backgroundColor: '#ef4444', color: '#fff', fontWeight: '600' }}>Xóa ngay</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;