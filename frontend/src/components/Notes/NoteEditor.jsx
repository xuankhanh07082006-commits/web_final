import React, { useState, useEffect, useRef } from 'react';
import useDebounce from '../../hooks/useDebounce';
import { io } from 'socket.io-client';
import { addToSyncQueue } from '../../services/db';


const colorPresets = [
  '#ffffff', // White
  '#f87171', // Red
  '#fb923c', // Orange
  '#facc15', // Yellow
  '#4ade80', // Green
  '#2dd4bf', // Teal
  '#3b82f6', // Blue
  '#818cf8', // Indigo
  '#c084fc', // Purple
  '#f472b6', // Pink
  '#94a3b8', // Gray
  '#1e293b'  // Dark slate
];

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
    ? { text: '#0f172a', secondary: '#475569', placeholder: '#64748b' }
    : { text: '#ffffff', secondary: '#e2e8f0', placeholder: '#cbd5f5' };
};

function NoteEditor({ onSaveSuccess, editingNote, onCreateNew, labelsRefreshFlag, defaultNoteColor, isOnline = true }) {
  const [noteId, setNoteId] = useState(null); // Theo dõi ID để biết là Đang tạo mới hay Đang sửa
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('');
  const [noteColor, setNoteColor] = useState('#ffffff'); // Mặc định nền trắng

  const [images, setImages] = useState([]); // Mảng chứa ảnh của Note hiện tại
  const [isUploading, setIsUploading] = useState(false);
  const [systemLabels, setSystemLabels] = useState([]); // Danh sách nhãn từ hệ thống
  const [attachedLabels, setAttachedLabels] = useState([]); // Nhãn đã gắn vào bài này
  const socketRef = useRef(null);

  useEffect(() => {

    socketRef.current = io();

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    fetch(`/api/labels`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => setSystemLabels(data))
      .catch(err => console.error(err));
  }, [labelsRefreshFlag]);
  useEffect(() => {
    if (editingNote) {
      if (editingNote.id !== noteId) {
        setNoteId(editingNote.id);
        setTitle(editingNote.title || '');
        setContent(editingNote.content || '');
        setImages(editingNote.images || []);
        setAttachedLabels(editingNote.labels || []);
        setNoteColor(editingNote.note_color || defaultNoteColor || '#ffffff');
        setStatus('Đang sửa...');
        socketRef.current.emit('join-note', editingNote.id);
      }
    } else {
      if (noteId) socketRef.current.emit('leave-note', noteId);
      setNoteId(null);
      setTitle('');
      setContent('');
      setNoteColor(defaultNoteColor || '#ffffff');
      setImages([]);
      setAttachedLabels([]);
      setStatus('');
    }
  }, [editingNote, noteId, defaultNoteColor]);

  useEffect(() => {
    if (!editingNote) {
      setNoteColor(defaultNoteColor || '#ffffff');
    }
  }, [defaultNoteColor, editingNote]);
  useEffect(() => {
    socketRef.current.on('note-updated', ({ title, content }) => {
      setTitle(title);
      setContent(content);
    });

    return () => {
      socketRef.current.off('note-updated');
    };
  }, []);
  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    setStatus('Đang gõ...');
    if (noteId) socketRef.current.emit('edit-note', { noteId, title: val, content });
  };

  const handleContentChange = (e) => {
    const val = e.target.value;
    setContent(val);
    setStatus('Đang gõ...');
    if (noteId) socketRef.current.emit('edit-note', { noteId, title, content: val });
  };

  const debouncedTitle = useDebounce(title, 1500);
  const debouncedContent = useDebounce(content, 1500);
  const debouncedNoteColor = useDebounce(noteColor, 500);

  const noteText = getNoteTextColors(noteColor || '#ffffff');

  useEffect(() => {
    if (debouncedTitle !== title || debouncedContent !== content || debouncedNoteColor !== noteColor) {
      return;
    }
    if (debouncedTitle || debouncedContent || noteId) {
      const saveNote = async () => {
        try {
          setStatus('Đang lưu...');
          const token = localStorage.getItem('token');

          const performOfflineSave = async () => {
             const payload = { title: debouncedTitle, content: debouncedContent, noteColor: debouncedNoteColor };
             let currentId = noteId;
             let actionType = 'UPDATE';

             if (!currentId || String(currentId).startsWith('offline_')) {
               currentId = currentId || `offline_${Date.now()}`;
               actionType = 'CREATE';
               setNoteId(currentId);
             }

             await addToSyncQueue({ tempId: currentId, type: actionType, payload, timestamp: Date.now() });
             setStatus('Đã lưu tạm (Offline)');
             
             if (onSaveSuccess) {
                onSaveSuccess({ id: currentId, ...payload, is_offline: true, updated_at: new Date().toISOString() });
             }
          };

          if (!isOnline) {
             await performOfflineSave();
             return;
          }

          try {
             if (!noteId || String(noteId).startsWith('offline_')) {
               const res = await fetch(`/api/notes`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                 body: JSON.stringify({ title: debouncedTitle, content: debouncedContent, noteColor: debouncedNoteColor })
               });
               const data = await res.json();
               if (res.ok && data.note) {
                 setNoteId(data.note.id);
                 if (socketRef.current) socketRef.current.emit('join-note', data.note.id);
                 setStatus('Đã lưu');
                 if (onSaveSuccess) onSaveSuccess(data.note);
               }
             } else {
               const res = await fetch(`/api/notes/${noteId}`, {
                 method: 'PUT',
                 headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                 body: JSON.stringify({ title: debouncedTitle, content: debouncedContent, noteColor: debouncedNoteColor })
               });
               if (res.ok) {
                 setStatus('Đã lưu thay đổi');
                 if (onSaveSuccess) onSaveSuccess();
               }
             }
          } catch (fetchErr) {
             if (fetchErr.message === 'Failed to fetch' || fetchErr.message.includes('NetworkError')) {
                await performOfflineSave();
             } else {
                throw fetchErr;
             }
          }
        } catch (error) {
          console.error(error);
          setStatus('Lỗi lưu!');
        }
      };

      saveNote();
    }
  }, [debouncedTitle, debouncedContent, debouncedNoteColor]); // Lưu khi đổi màu

  const handleFileUpload = async (e) => {

    if (!e.target.files || e.target.files.length === 0) return;
    if (!noteId) {
      alert("Hãy nhập một chữ nào đó vào Ghi chú (để nó tự tạo file) trước khi đính kèm ảnh!");
      return;
    }

    const files = e.target.files;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    try {
      setIsUploading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/upload/${noteId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (res.ok) {

        setImages((prev) => [...prev, ...data.imageUrls]);
        if (onSaveSuccess) onSaveSuccess(); // Refresh List tổng
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert('Tải ảnh thất bại!');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async (imageUrl) => {
    if (!window.confirm("Bạn có chắc muốn xóa ảnh này?")) return;
    try {
      const res = await fetch(`/api/upload/${noteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl })
      });
      if (res.ok) {
        setImages(prev => prev.filter(img => img !== imageUrl));
        if (onSaveSuccess) onSaveSuccess();
      } else {
        const data = await res.json();
        alert(data.message || 'Lỗi xóa ảnh');
      }
    } catch {
      alert('Lỗi khi xóa ảnh');
    }
  };

  const handleAttachLabel = async (e) => {
    const labelId = e.target.value;
    if (!labelId || labelId === "") return;
    if (!noteId) {
      alert("Hãy nhập nội dung trước khi gán nhãn!");
      e.target.value = ""; // Reset dropdown
      return;
    }

    const labelObj = systemLabels.find(l => l.id == labelId);
    if (!labelObj) return;

    try {
      const res = await fetch(`/api/labels/attach`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId, labelId })
      });
      if (res.ok) {
        setAttachedLabels(prev => {
          if (prev.find(l => l.id == labelId)) return prev;
          return [...prev, labelObj];
        });
        if (onSaveSuccess) onSaveSuccess();
      }
    } catch {
      alert('Lỗi gán nhãn');
    }
    e.target.value = ""; // Reset dropdown
  };

  const handleDetachLabel = async (labelId) => {
    try {
      const res = await fetch(`/api/labels/detach`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId, labelId })
      });
      if (res.ok) {
        setAttachedLabels(prev => prev.filter(l => l.id != labelId));
        if (onSaveSuccess) onSaveSuccess();
      }
    } catch {
      alert('Lỗi gỡ nhãn');
    }
  };

  const handleNewNote = () => {
    if (noteId && socketRef.current) {
      socketRef.current.emit('leave-note', noteId);
    }

    setNoteId(null);
    setTitle('');
    setContent('');
    setNoteColor(defaultNoteColor || '#ffffff');
    setImages([]);
    setAttachedLabels([]);
    setStatus('');

    if (onCreateNew) onCreateNew();
  };

  return (
    <div
      className="glass-panel note-editor"
      style={{
        backgroundColor: noteColor || 'var(--bg-secondary)',
        padding: '20px',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        position: 'relative',
        color: noteText.text,
        '--note-text-color': noteText.text,
        '--note-placeholder-color': noteText.placeholder
      }}
    >
      <div className="editor-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          className="btn-primary"
          onClick={handleNewNote}
          style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '14px', opacity: isOnline ? 1 : 0.6 }}
        >
          ➕ Soạn ghi chú mới
        </button>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--bg-color)', padding: '4px 10px', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
          {status} {editingNote?.shared_permission === 'read' && ' (Chỉ xem)'}
        </span>
      </div>
      <input
        disabled={editingNote?.shared_permission === 'read'}
        type="text"
        placeholder="Tiêu đề..."
        value={title}
        onChange={handleTitleChange}
        style={{ width: '100%', fontSize: '28px', fontWeight: '700', padding: '16px 10px', border: 'none', borderBottom: '1px solid var(--border-glass)', outline: 'none', backgroundColor: 'transparent', color: 'var(--note-text-color)' }}
      />
      <div style={{ position: 'relative' }}>
        {editingNote?.is_shared && editingNote.shared_permission === 'edit' && (
          <div style={{ position: 'absolute', top: -30, right: 0, fontSize: '12px', background: 'var(--primary-color)', color: 'white', padding: '4px 10px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
            🔵 Đang cùng chỉnh sửa
          </div>
        )}

        <textarea
          disabled={editingNote?.shared_permission === 'read'}
          placeholder="Nội dung ghi chú..."
          value={content}
          onChange={handleContentChange}
          rows={8}
          style={{ width: '100%', fontSize: '16px', padding: '16px 10px', border: 'none', outline: 'none', resize: 'vertical', backgroundColor: 'transparent', color: 'var(--note-text-color)', lineHeight: '1.6' }}
        />
      </div>
      <div className="editor-toolbar" style={{ marginTop: '10px', borderTop: '1px solid var(--border-glass)', paddingTop: '15px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600' }}>🌈 Màu nền:</span>
          <div className="color-swatches">
            {colorPresets.map((color) => (
              <button
                key={color}
                type="button"
                className={`color-swatch ${noteColor === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => { setNoteColor(color); setStatus('Đang gõ...'); }}
                aria-label={`Chọn màu ${color}`}
              />
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600' }}>📎 Đính kèm:</span>
          <label className="glass-panel" style={{ cursor: 'pointer', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', display: 'inline-block' }}>
            {isUploading ? '⏳ Đang tải...' : '🖼️ Chọn ảnh'}
            <input
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              disabled={isUploading || !isOnline}
            />
          </label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600' }}>🏷️ Gán nhãn:</span>
          <select className="glass-panel" onChange={handleAttachLabel} disabled={!isOnline} style={{ padding: '6px', borderRadius: '8px', cursor: isOnline ? 'pointer' : 'not-allowed', border: 'none' }}>
            <option value="">-- Chọn nhãn --</option>
            {systemLabels.map(label => (
              <option key={label.id} value={label.id}>{label.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        {attachedLabels.length > 0 && (
          <div style={{ display: 'flex', gap: '5px', marginTop: '10px', flexWrap: 'wrap' }}>
            {attachedLabels.map((lbl, idx) => (
              <span key={idx} style={{ backgroundColor: 'var(--primary-color)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                🏷️ {lbl.name}
                <button 
                  onClick={() => handleDetachLabel(lbl.id)}
                  style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '0 2px', fontSize: '10px', lineHeight: 1 }}
                  title="Gỡ nhãn"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        {images.length > 0 && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
            {images.map((img, idx) => (
              <div key={idx} style={{ position: 'relative', display: 'inline-block' }}>
                <img src={img} alt="đính kèm" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '5px', border: '1px solid #ccc' }} />
                <button
                  onClick={() => handleDeleteImage(img)}
                  style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                  title="Xóa ảnh"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default NoteEditor;