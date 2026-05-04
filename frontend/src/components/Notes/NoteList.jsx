import React, { useState } from 'react';
import NoteCard from './NoteCard';

function NoteList({ notes, onDelete, onTogglePin, onEdit }) {
  const [viewMode, setViewMode] = useState('grid'); 

  return (
    <div className="note-list">
      <div className="note-list-header">
        <h3 className="note-list-title">Danh sách Ghi chú của bạn</h3>
        <button 
          onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          className="note-list-toggle"
        >
          Đang xem: <strong>{viewMode === 'grid' ? 'Lưới (Grid)' : 'Danh sách (List)'}</strong>
        </button>
      </div>
      <div className={`note-list-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
        {notes.map(note => (
          <NoteCard 
            key={note.id} 
            note={note} 
            onDelete={onDelete} 
            onTogglePin={onTogglePin} 
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
}

export default NoteList;