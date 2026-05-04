import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import NoteEditor from './components/Notes/NoteEditor';
import NoteList from './components/Notes/NoteList';
import ConfirmModal from './components/UI/ConfirmModal';
import useDebounce from './hooks/useDebounce';
import LabelSidebar from './components/Labels/LabelSidebar';
import PasswordModal from './components/UI/PasswordModal';
import ShareModal from './components/UI/ShareModal';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import Verify from './pages/Verify';
import { saveNotesToLocal, getNotesFromLocal, getSyncQueue, removeFromSyncQueue } from './services/db';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function Home() {
  const colorPresets = [
    '#ffffff', '#f87171', '#fb923c', '#facc15', '#4ade80', '#2dd4bf', 
    '#3b82f6', '#818cf8', '#c084fc', '#f472b6', '#94a3b8', '#1e293b'
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300); // Trễ 300ms tìm kiếm
  
  const [notes, setNotes] = useState([]); // Khởi tạo mảng ghi chú trống

  const [activeLabel, setActiveLabel] = useState('all'); // Nhãn đang chọn
  const [isVerified, setIsVerified] = useState(1); // Trạng thái xác thực tài khoản
  const [labelsRefreshFlag, setLabelsRefreshFlag] = useState(0); // Flag để đồng bộ danh sách nhãn
  
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const syncOfflineData = async () => {
    try {
      const queue = await getSyncQueue();
      if (queue.length === 0) return;
      
      let syncedCount = 0;
      for (const action of queue) {
        const token = localStorage.getItem('token');
        if (action.type === 'CREATE') {
           const res = await fetch(`/api/notes`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify(action.payload)
           });
           if (res.ok) {
              await removeFromSyncQueue(action.tempId);
              syncedCount++;
           }
        } else if (action.type === 'UPDATE') {
           const res = await fetch(`/api/notes/${action.tempId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify(action.payload)
           });
           if (res.ok) {
              await removeFromSyncQueue(action.tempId);
              syncedCount++;
           }
        }
      }
      
      if (syncedCount > 0) {
        alert(`Đã đồng bộ thành công ${syncedCount} ghi chú lưu tạm khi ngoại tuyến!`);
        fetchNotes();
      }
    } catch (err) {
      console.error('Lỗi khi đồng bộ dữ liệu:', err);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setTimeout(() => syncOfflineData(), 1500);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.onLine) {
       setTimeout(() => syncOfflineData(), 1500);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchNotes = async (searchQuery = '', labelIdParam = activeLabel) => {
    try {

      let url = `/api/notes?labelId=${labelIdParam}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
        await saveNotesToLocal(data); // Lưu vào IndexedDB để dùng offline
      } else {
        throw new Error('Lỗi từ server');
      }
    } catch (error) {
      console.error('Lỗi khi tải ghi chú:', error);

      const offlineNotes = await getNotesFromLocal();
      const syncQueue = await getSyncQueue();
      
      let mergedNotes = [...offlineNotes];
      syncQueue.forEach(action => {
        if (action.type === 'CREATE') {
          mergedNotes.unshift({ id: action.tempId, ...action.payload, is_offline: true, updated_at: new Date().toISOString() });
        } else if (action.type === 'UPDATE') {
          mergedNotes = mergedNotes.map(n => n.id === action.tempId ? { ...n, ...action.payload, is_offline: true } : n);
        }
      });

      setNotes(mergedNotes);
      console.log('Đã tải ghi chú từ Local Database (Offline mode) và Sync Queue');
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        setNotifications(await response.json());
      }
    } catch (error) {
      console.error('Lỗi khi tải thông báo:', error);
    }
  };

  useEffect(() => {
    fetchNotes();
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (debouncedSearch !== '') {
      fetchNotes(debouncedSearch);
    } else {
      fetchNotes(); // Xóa sạch ô tìm kiếm thì load lại toàn bộ
    }
  }, [debouncedSearch]);

  const [currentTheme, setCurrentTheme] = useState('light');
  const [defaultNoteColor, setDefaultNoteColor] = useState('#ffffff');
  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const res = await fetch(`/api/auth/me`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
        if (res.ok) {
          const user = await res.json();
          setIsVerified(user.is_verified);
          setDefaultNoteColor(user.default_note_color || '#ffffff');
          if (user.theme === 'dark') {
            document.body.classList.add('dark-mode');
            setCurrentTheme('dark');
          }
          if (user.font_size) {
            document.documentElement.style.setProperty('--font-size', user.font_size);
            document.documentElement.style.zoom = parseInt(user.font_size) / 16;
          }
        }
      } catch (err) { console.error(err); }
    };
    fetchPrefs();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false); // Modal Xóa
  const [noteToDelete, setNoteToDelete] = useState(null); // ID của note chuẩn bị xóa
  const [passwordModal, setPasswordModal] = useState({ isOpen: false, mode: 'set', note: null }); // Quản lý chung Modal Mật Khẩu
  const [isShareModalOpen, setIsShareModalOpen] = useState(false); // Modal Chia Sẻ
  
  const [editingNote, setEditingNote] = useState(null); // Lưu trữ tờ Ghi chú đang được bấm vào để sửa

  const handleDeleteClick = (note) => {
    if (!note) return;
    if (note.has_password) {
      setPasswordModal({ isOpen: true, mode: 'delete', note: note });
      return;
    }
    setNoteToDelete(note.id);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    const idToDelete = noteToDelete || editingNote?.id;
    
    if (!idToDelete) {
      setIsModalOpen(false);
      return;
    }

    try {
      const response = await fetch(`/api/notes/${idToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        console.log('Đã xóa ghi chú');
        fetchNotes(); // Tải lại danh sách
        if (editingNote && editingNote.id === idToDelete) {
          setEditingNote(null);
        }
      }
    } catch (error) {
      console.error('Lỗi xóa:', error);
    }
    setIsModalOpen(false);
    setNoteToDelete(null);
  };

  const handleTogglePin = async (noteId) => {
    try {
      const response = await fetch(`/api/notes/${noteId}/pin`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        fetchNotes(); // Tải lại danh sách để cập nhật vị trí
      }
    } catch (error) {
      console.error('Lỗi ghim:', error);
    }
  };

  const savePreferences = async (theme, fontSize, noteColor) => {
    try {
      await fetch(`/api/auth/preferences`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ theme, fontSize, defaultNoteColor: noteColor })
      });
    } catch (err) { console.error('Lỗi khi lưu cài đặt', err); }
  };

  const getCurrentFontSize = () => {
    return getComputedStyle(document.documentElement).getPropertyValue('--font-size').trim() || '16px';
  };

  const toggleTheme = () => {
    const isDark = document.body.classList.toggle('dark-mode');
    const newTheme = isDark ? 'dark' : 'light';
    setCurrentTheme(newTheme);
    const currentFontSize = getCurrentFontSize();
    savePreferences(newTheme, currentFontSize, defaultNoteColor);
  };

  const changeFontSize = (e) => {
    const newSize = e.target.value;
    document.documentElement.style.setProperty('--font-size', newSize);
    document.documentElement.style.zoom = parseInt(newSize) / 16;
    savePreferences(currentTheme, newSize, defaultNoteColor);
  };

  const applyDefaultNoteColor = (newColor) => {
    setDefaultNoteColor(newColor);
    const currentFontSize = getCurrentFontSize();
    savePreferences(currentTheme, currentFontSize, newColor);
  };

  const changeDefaultNoteColor = (e) => {
    applyDefaultNoteColor(e.target.value);
  };



  const handleSelectLabel = (labelId) => {
    setActiveLabel(labelId);
    fetchNotes(debouncedSearch, labelId);
  };

  const handleEditClick = async (note) => {
    if (note.has_password && !note.is_unlocked) {

      setPasswordModal({ isOpen: true, mode: 'unlock', note: note });
    } else {
      setEditingNote(note);
    }
  };

  const handlePasswordConfirm = async (pwd, oldPwd) => {
    const { mode, note } = passwordModal;

    if (mode === 'unlock') {
      try {
        const res = await fetch(`/api/notes/${note.id}/unlock`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pwd })
        });
        if (res.ok) {
          const fullNote = await res.json();
          const unlockedNote = { ...note, content: fullNote.content, images: fullNote.images, note_color: fullNote.note_color, is_unlocked: true, has_password: true };
          setEditingNote(unlockedNote);

          setNotes(prevNotes => prevNotes.map(n => n.id === note.id ? unlockedNote : n));
        } else {
          const errorData = await res.json();
          throw new Error(errorData.message || "Mật khẩu sai hoặc bạn không có quyền xem!");
        }
      } catch(err) { throw new Error(err.message || "Lỗi hệ thống"); }
    } 

    else if (mode === 'delete') {
      try {
        const res = await fetch(`/api/notes/${note.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pwd })
        });
        if (res.ok) {
          fetchNotes(debouncedSearch, activeLabel);
          if (editingNote && editingNote.id === note.id) setEditingNote(null);
        } else {
          const errorData = await res.json();
          throw new Error(errorData.message || "Mật khẩu sai hoặc có lỗi xảy ra");
        }
      } catch (err) {
        throw new Error(err.message || "Lỗi khi xóa ghi chú khóa!");
      }
    }

    else if (mode === 'set') {
      if (!editingNote) {
        throw new Error("Vui lòng chọn 1 ghi chú để đặt mật khẩu");
      }
      try {
        const res = await fetch(`/api/notes/${editingNote.id}/password`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pwd, oldPassword: oldPwd })
        });
        if (res.ok) {
          fetchNotes(debouncedSearch, activeLabel);
          if (pwd) {
            setEditingNote({ ...editingNote, has_password: true });
          } else {
            setEditingNote({ ...editingNote, has_password: false });
          }
        } else {
          const errorData = await res.json();
          throw new Error(errorData.message || "Mật khẩu sai hoặc có lỗi xảy ra");
        }
      } catch (err) {
          throw new Error(err.message || "Lỗi khi đặt/gỡ mật khẩu!");
      }
    }

    setPasswordModal({ isOpen: false, mode: 'set', note: null });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  const markNotificationAsRead = async (id) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      fetchNotifications();
    } catch (err) {}
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      fetchNotifications();
    } catch (err) {}
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>

      {isVerified === 0 && (
        <div className="glass-panel" style={{ color: '#d97706', padding: '15px', marginBottom: '20px', borderLeft: '4px solid #f59e0b', fontWeight: '500' }}>
          ⚠️ Tài khoản của bạn chưa được xác thực. Vui lòng kiểm tra email để kích hoạt tài khoản ngay nhé!
        </div>
      )}

      <div className="header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}> 
          Trang chủ Quản lý Ghi chú
          {!isOnline && (
            <span style={{ fontSize: '12px', background: '#ef4444', color: 'white', padding: '4px 10px', borderRadius: '12px', whiteSpace: 'nowrap', boxShadow: '0 2px 4px rgba(239,68,68,0.3)' }}>
              ⚠️ Đang ngoại tuyến (Chỉ xem)
            </span>
          )}
        </h2>
        
        <div className="header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>

          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              style={{ background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', position: 'relative', marginTop: '5px', transition: 'transform 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              🔔
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '11px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  {notifications.filter(n => !n.is_read).length}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="glass-modal notifications-panel" style={{ position: 'absolute', top: '50px', right: '0', width: '320px', maxHeight: '400px', overflowY: 'auto', zIndex: 1000, padding: '10px' }}>
                <div style={{ padding: '10px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, color: 'var(--text-color)' }}>Thông báo</h4>
                  <button onClick={markAllNotificationsAsRead} style={{ fontSize: '12px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--primary-color)' }}>Đánh dấu đã đọc tất cả</button>
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#777' }}>Không có thông báo nào</div>
                ) : (
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {notifications.map(n => (
                      <li key={n.id} style={{ padding: '10px', borderBottom: '1px solid #eee', background: n.is_read ? 'transparent' : 'rgba(79, 70, 229, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: 'var(--text-color)' }}>{n.message}</p>
                          <small style={{ color: '#888' }}>{new Date(n.created_at).toLocaleString()}</small>
                        </div>
                        {!n.is_read && (
                          <button onClick={() => markNotificationAsRead(n.id)} style={{ background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer', marginLeft: '10px' }}>Đã đọc</button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <select className="glass-panel" onChange={changeFontSize} style={{ padding: '8px 12px', cursor: 'pointer', border: 'none', outline: 'none' }}>
            <option value="14px">Chữ nhỏ</option>
            <option value="16px">Chữ vừa</option>
            <option value="18px">Chữ to</option>
          </select>



          <button className="glass-panel" onClick={toggleTheme} style={{ padding: '8px 15px', cursor: 'pointer', border: 'none' }}>
            🌓 Sáng/Tối
          </button>

          <button className="btn-primary" onClick={() => window.location.href = '/profile'} style={{ padding: '8px 15px', cursor: 'pointer', borderRadius: '8px' }}>
            👤 Hồ sơ
          </button>
          
          <button className="glass-panel" onClick={handleLogout} style={{ padding: '8px 15px', cursor: 'pointer', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444' }}>
            Đăng xuất
          </button>
        </div>
      </div>

      <div style={{ margin: '20px 0' }}>
        <input 
          className="glass-panel search-input"
          type="text" 
          placeholder="🔍 Tìm kiếm tiêu đề, nội dung ghi chú..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
      </div>

      <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid var(--border-glass)' }} />

      <NoteEditor 
        defaultNoteColor={defaultNoteColor}
        labelsRefreshFlag={labelsRefreshFlag}
        isOnline={isOnline}
        onSaveSuccess={(createdNote) => { 
          if (createdNote && createdNote.is_offline) {
             setNotes(prev => {
                const exists = prev.find(n => n.id === createdNote.id);
                if (exists) return prev.map(n => n.id === createdNote.id ? createdNote : n);
                return [createdNote, ...prev];
             });
             if (!editingNote?.id) setEditingNote(createdNote);
             return;
          }
          fetchNotes(debouncedSearch, activeLabel); 
          if (createdNote && !editingNote?.id) setEditingNote(createdNote);
        }} 
        editingNote={editingNote}
        onCreateNew={() => setEditingNote(null)}
      />

      <div className="note-actions">
        <button 
          className="glass-panel"
          onClick={() => setIsShareModalOpen(true)} 
          style={{ padding: '10px 20px', color: 'var(--primary-color)', border: '1px solid var(--primary-color)', cursor: 'pointer', fontWeight: '600', display: editingNote && editingNote.is_owner !== false ? 'block' : 'none' }}
        >
           👥 Chia sẻ
        </button>
        <button 
          className="glass-panel"
          onClick={() => setPasswordModal({ isOpen: true, mode: 'set', note: editingNote })} 
          style={{ padding: '10px 20px', color: '#f59e0b', border: '1px solid #f59e0b', cursor: 'pointer', fontWeight: '600', display: editingNote && editingNote.is_owner !== false ? 'block' : 'none' }}
        >
           {editingNote && editingNote.has_password ? "🔐 Đổi/Gỡ khóa" : "🔒 Đặt mật khẩu"}
        </button>
        <button 
          className="glass-panel"
          onClick={() => handleDeleteClick(editingNote)} 
          style={{ padding: '10px 20px', color: '#ef4444', border: '1px solid #ef4444', cursor: 'pointer', fontWeight: '600', display: editingNote?.id && editingNote.is_owner !== false ? 'block' : 'none' }}
        >
           🗑 Xóa ghi chú
        </button>
      </div>

      <hr style={{ margin: '40px 0 30px 0', border: 'none', borderTop: '1px solid var(--border-glass)' }} />

      <div className="main-container">

        <div className="sidebar-wrapper">
          <LabelSidebar 
            activeLabel={activeLabel} 
            onSelectLabel={handleSelectLabel} 
            onLabelsChanged={() => setLabelsRefreshFlag(prev => prev + 1)}
          />
        </div>

        <div className="content-wrapper">
            <NoteList 
              notes={notes} 
              onDelete={handleDeleteClick} 
              onTogglePin={handleTogglePin} 
              onEdit={handleEditClick}
            />
        </div>

      </div>

      <ConfirmModal 
        isOpen={isModalOpen} 
        message="Bạn có chắc chắn muốn xóa ghi chú này không?" 
        onConfirm={confirmDelete} 
        onCancel={() => { setIsModalOpen(false); setNoteToDelete(null); }} 
      />

      <PasswordModal 
        isOpen={passwordModal.isOpen} 
        mode={passwordModal.mode}
        noteHasPassword={passwordModal.note ? passwordModal.note.has_password : (editingNote ? editingNote.has_password : false)}
        onClose={() => setPasswordModal({ isOpen: false, mode: 'set', note: null })} 
        onConfirm={handlePasswordConfirm} 
      />

      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        noteId={editingNote?.id}
      />

    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/verify" element={<Verify />} />

        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;