const pool = require('../db/database');

const Share = {
  // Thực hiện chia sẻ Note cho một User (bằng Email)
  async create(noteId, ownerId, recipientEmail, permission = 'read') {
    // 1. Tìm ID của người nhận theo Email
    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [recipientEmail]);
    if (users.length === 0) return { error: 'Không tìm thấy người dùng có Email này' };
    
    const recipientId = users[0].id;
    if (recipientId === ownerId) return { error: 'Không thể tự Share cho chính mình' };

    // 2. Kiểm tra xem note này có thuộc sở hữu của ownerId không
    const [notes] = await pool.query('SELECT id FROM notes WHERE id = ? AND user_id = ?', [noteId, ownerId]);
    if (notes.length === 0) return { error: 'Ghi chú không tồn tại hoặc bạn không có quyền' };

    // 3. Thực hiện insert vào bảng note_shares
    try {
      await pool.query(
        'INSERT INTO note_shares (note_id, owner_id, recipient_id, permission) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE permission = ?',
        [noteId, ownerId, recipientId, permission, permission]
      );
      
      // 4. Tạo thông báo cho người nhận
      const ownerQuery = await pool.query('SELECT username FROM users WHERE id = ?', [ownerId]);
      const ownerName = ownerQuery[0][0]?.username || 'Một người dùng';
      await pool.query(
        'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
        [recipientId, 'share', `${ownerName} đã chia sẻ một ghi chú với bạn!`]
      );

      return { success: true, message: 'Đã chia sẻ thành công!' };
    } catch (err) {
      return { error: 'Lỗi hệ thống khi chia sẻ' };
    }
  },

  // Lấy danh sách những người đang được Share tờ Note này
  async findByNote(noteId, ownerId) {
    const [rows] = await pool.query(
      `SELECT ns.id as share_id, u.email, u.username, ns.permission 
       FROM note_shares ns
       JOIN users u ON ns.recipient_id = u.id
       WHERE ns.note_id = ? AND ns.owner_id = ?`,
      [noteId, ownerId]
    );
    return rows;
  },

  // Hủy quyền truy cập của một người dự trên ID của bảng note_shares
  async delete(shareId, ownerId) {
    const [result] = await pool.query(
      'DELETE FROM note_shares WHERE id = ? AND owner_id = ?',
      [shareId, ownerId]
    );
    return result.affectedRows > 0;
  },

  // Thay đổi quyền truy cập
  async updatePermission(shareId, ownerId, newPermission) {
    const [result] = await pool.query(
      'UPDATE note_shares SET permission = ? WHERE id = ? AND owner_id = ?',
      [newPermission, shareId, ownerId]
    );
    return result.affectedRows > 0;
  }
};

module.exports = Share;
