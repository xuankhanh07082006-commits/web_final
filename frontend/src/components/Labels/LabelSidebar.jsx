import React, { useState, useEffect } from 'react';

function LabelSidebar({ activeLabel, onSelectLabel, onLabelsChanged }) {
  const [labels, setLabels] = useState([]);
  const fetchLabels = async () => {
    try {
      const res = await fetch('/api/labels', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      if (res.ok) {
        setLabels(await res.json());
        if (onLabelsChanged) onLabelsChanged();
      }
    } catch (err) { console.error('Lỗi tải nhãn'); }
  };

  useEffect(() => {
    fetchLabels();
  }, []);
  const handleAddLabel = async () => {
    const name = window.prompt('Nhập tên nhãn mới:');
    if (!name) return;
    try {
      const res = await fetch('/api/labels', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color: '#4f46e5' })
      });
      if (res.ok) fetchLabels();
    } catch (err) { alert('Lỗi tạo nhãn'); }
  };
  const handleEditLabel = async (e, id, oldName) => {
    e.stopPropagation(); // Ngăn không cho click nhảy sang đổi activeLabel
    const newName = window.prompt('Nhập tên nhãn mới:', oldName);
    if (!newName || newName === oldName) return;
    try {
      const res = await fetch(`/api/labels/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      if (res.ok) fetchLabels();
    } catch (err) { alert('Lỗi sửa nhãn'); }
  };
  const handleDeleteLabel = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhãn này?')) return;
    try {
      const res = await fetch(`/api/labels/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        if (activeLabel === id) onSelectLabel('all'); // Nếu đang xem nhãn bị xóa thì nhảy về all
        fetchLabels();
      }
    } catch (err) { alert('Lỗi xóa nhãn'); }
  };

  return (
    <div className="glass-panel label-sidebar" style={{ width: '250px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text-color)' }}>🏷️ Nhãn</h3>
        <button className="btn-primary" onClick={handleAddLabel} style={{ padding: '6px 12px', cursor: 'pointer', borderRadius: '8px', fontSize: '13px' }}>
          + Thêm
        </button>
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <li 
          onClick={() => onSelectLabel('all')}
          style={{ padding: '12px 15px', cursor: 'pointer', borderRadius: '12px', backgroundColor: activeLabel === 'all' ? 'var(--primary-color)' : 'transparent', color: activeLabel === 'all' ? 'white' : 'var(--text-color)', fontWeight: activeLabel === 'all' ? '600' : '500', transition: 'all 0.2s' }}
          onMouseOver={(e) => { if(activeLabel !== 'all') e.currentTarget.style.backgroundColor = 'var(--border-glass)'; }}
          onMouseOut={(e) => { if(activeLabel !== 'all') e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
           Tất cả ghi chú
        </li>
        {labels.map(label => (
          <li 
            key={label.id}
            onClick={() => onSelectLabel(label.id)}
            style={{ padding: '12px 15px', cursor: 'pointer', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: activeLabel === label.id ? 'var(--primary-color)' : 'transparent', color: activeLabel === label.id ? 'white' : 'var(--text-color)', fontWeight: activeLabel === label.id ? '600' : '500', transition: 'all 0.2s' }}
            className="label-item-hover"
          >
            <span>{label.name}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={(e) => handleEditLabel(e, label.id, label.name)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '14px', transition: 'transform 0.2s' }} title="Sửa nhãn">✏️</button>
              <button onClick={(e) => handleDeleteLabel(e, label.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '14px', transition: 'transform 0.2s' }} title="Xóa nhãn">❌</button>
            </div>
          </li>
        ))}
      </ul>
      <style>{`
        .label-item-hover button { opacity: 0; transform: scale(0.8); }
        .label-item-hover:hover button { opacity: 1; transform: scale(1); }
        .label-item-hover:hover { background-color: var(--border-glass); }
        li[style*="var(--primary-color)"]:hover { background-color: var(--primary-color) !important; }
      `}</style>
    </div>
  );
}

export default LabelSidebar;