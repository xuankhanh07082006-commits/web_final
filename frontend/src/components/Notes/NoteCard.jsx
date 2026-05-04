import React from 'react';

const getLuminance = (hex) => {
  const cleanHex = (hex || '').replace('#', '');
  if (cleanHex.length !== 6 && cleanHex.length !== 3) return 1;
  let r, g, b;
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else {
    r = parseInt(cleanHex.slice(0, 2), 16);
    g = parseInt(cleanHex.slice(2, 4), 16);
    b = parseInt(cleanHex.slice(4, 6), 16);
  }
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? 1 : 0;
};

const getNoteTextColors = (hex) => {
  const isLight = getLuminance(hex) === 1;
  return isLight
    ? { text: '#0f172a', secondary: '#475569' }
    : { text: '#ffffff', secondary: '#e2e8f0' };
};

function NoteCard({ note, onDelete, onTogglePin, onEdit }) {
  const noteText = getNoteTextColors(note.note_color || '#ffffff');

  return (
    <div className="glass-card" onClick={() => { if(onEdit) onEdit(note); }} style={{
      padding: '20px',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      cursor: 'pointer',
      height: '100%',
      backgroundColor: note.note_color || 'var(--bg-secondary)'
    }}>
      <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '8px', fontSize: '18px', zIndex: 10, color: noteText.text }}>
        <span 
          title={note.is_pinned ? "Bỏ ghim" : "Ghim lên đầu"} 
          onClick={(e) => { e.stopPropagation(); if (onTogglePin) onTogglePin(note.id); }}
          style={{ cursor: 'pointer', opacity: note.is_pinned ? 1 : 0.3 }}
        >
          📌
        </span>
        
        {note.has_password && <span title="Bảo vệ bằng mật khẩu">🔒</span>}
        {note.is_shared && <span title="Được chia sẻ">👥</span>}
        <span 
          title="Xóa ghi chú" 
          onClick={(e) => { e.stopPropagation(); if (onDelete) onDelete(note); }}
          style={{ cursor: 'pointer', color: 'red', marginLeft: '5px' }}
        >
          🗑️
        </span>
      </div>
      <h3 className="line-clamp-1" style={{ margin: 0, paddingRight: '60px', fontSize: '18px', color: noteText.text }}>
        {note.title || 'Ghi chú không có tiêu đề'}
      </h3>
      <p className="line-clamp-3" style={{ margin: 0, color: noteText.secondary, fontSize: '14px' }}>
        {note.content || 'Không có nội dung...'}
      </p>
      {note.images && note.images.length > 0 && (
        <div style={{ display: 'flex', gap: '5px', marginTop: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
          {note.images.map((imgUrl, idx) => (
            <img 
              key={idx} 
              src={imgUrl} 
              alt="Đính kèm" 
              style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #eee' }} 
            />
          ))}
        </div>
      )}
      {note.labels && note.labels.length > 0 && (
        <div style={{ display: 'flex', gap: '5px', marginTop: '10px', flexWrap: 'wrap' }}>
          {note.labels.map((lbl, idx) => (
            <span key={idx} style={{ backgroundColor: 'var(--primary-color)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', whiteSpace: 'nowrap' }}>
              {lbl.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default NoteCard;