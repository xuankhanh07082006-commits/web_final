const pool = require('../db/database');

const Label = {
  // Lấy danh sách toàn bộ Nhãn của 1 user
  async findByUserId(userId) {
    const [rows] = await pool.query('SELECT * FROM labels WHERE user_id = ? ORDER BY created_at ASC', [userId]);
    return rows;
  },

  // Tạo Nhãn mới
  async create(userId, name, color) {
    const [result] = await pool.query(
      'INSERT INTO labels (user_id, name, color) VALUES (?, ?, ?)',
      [userId, name, color || '#6366f1']
    );
    return result.insertId;
  },

  // Đổi tên Nhãn
  async update(id, userId, newName) {
    const [result] = await pool.query(
      'UPDATE labels SET name = ? WHERE id = ? AND user_id = ?',
      [newName, id, userId]
    );
    return result.affectedRows > 0;
  },

  // Xóa Nhãn
  async delete(id, userId) {
    const [result] = await pool.query(
      'DELETE FROM labels WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  },

  // (Phụ) Gắn Nhãn vào Ghi chú
  async attachToNote(noteId, labelId) {
    try {
      await pool.query('INSERT IGNORE INTO note_labels (note_id, label_id) VALUES (?, ?)', [noteId, labelId]);
      return true;
    } catch (err) { return false; }
  },

  // (Phụ) Gỡ Nhãn khỏi Ghi chú
  async detachFromNote(noteId, labelId) {
    const [result] = await pool.query('DELETE FROM note_labels WHERE note_id = ? AND label_id = ?', [noteId, labelId]);
    return result.affectedRows > 0;
  }
};

module.exports = Label;
