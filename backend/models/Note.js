const pool = require('../db/database');

const Note = {
  // Lấy tất cả ghi chú của 1 người dùng, ưu tiên Pin lên đầu, và hỗ trợ tìm kiếm/lọc nhãn
  async findByUserId(userId, search = '', labelId = 'all') {
    const searchTerm = `%${search}%`;
    let query = `
      SELECT n.id, n.title, n.content, n.note_color, n.is_pinned, n.is_deleted, n.created_at, n.updated_at, n.has_password,
              n.user_id, MAX(ns.permission) as shared_permission,
              (SELECT COUNT(*) FROM note_shares WHERE note_id = n.id) > 0 AS is_shared_to_others,
              IFNULL(GROUP_CONCAT(DISTINCT i.image_url SEPARATOR ','), '') as images,
              IFNULL(GROUP_CONCAT(DISTINCT CONCAT(l.id, '::', l.name) SEPARATOR ','), '') as label_data
       FROM notes n
       LEFT JOIN note_images i ON n.id = i.note_id
       LEFT JOIN note_labels nl ON n.id = nl.note_id
       LEFT JOIN labels l ON nl.label_id = l.id
       LEFT JOIN note_shares ns ON n.id = ns.note_id AND ns.recipient_id = ?
       WHERE (n.user_id = ? OR ns.recipient_id = ?)
       AND n.is_deleted = false 
       AND (n.title LIKE ? OR n.content LIKE ?)
    `;
    
    // Thêm điều kiện lọc theo Label nếu tham số labelId != 'all'
    const queryParams = [userId, userId, userId, searchTerm, searchTerm];
    if (labelId && labelId !== 'all') {
      // Phải có label_id = labelId trong bảng note_labels
      query += ` AND n.id IN (SELECT note_id FROM note_labels WHERE label_id = ?)`;
      queryParams.push(labelId);
    }
    
    query += `
       GROUP BY n.id
       ORDER BY n.is_pinned DESC, n.created_at DESC
    `;

    const [rows] = await pool.query(query, queryParams);
    
    // Tách cột chuỗi thành mảng
    return rows.map(row => {
      let parsedLabels = [];
      if (row.label_data) {
        parsedLabels = row.label_data.split(',').map(item => {
          const [id, name] = item.split('::');
          return { id: parseInt(id), name };
        });
      }
      return {
        ...row,
        images: row.images ? row.images.split(',') : [],
        labels: parsedLabels,
        label_data: undefined, // giấu đi cho gọn
        // Xác định là chủ sở hữu hay không
        is_owner: row.user_id === userId,
        // Xác định đây là note của tôi hay là note do người khác share (hoặc của tôi nhưng share cho người khác)
        is_shared: row.user_id !== userId || row.is_shared_to_others === 1,
        // Ẩn nội dung nếu bị khóa
        content: row.has_password ? '*** Nội dung đã khóa. Yêu cầu nhập mật khẩu. ***' : row.content,
        // Có thể ẩn cả danh sách ảnh nếu muốn
        images: row.has_password ? [] : (row.images ? row.images.split(',') : [])
      };
    });
  },

  // Tạo ghi chú mới
  async create(userId, title, content, noteColor) {
    const [result] = await pool.query(
      'INSERT INTO notes (user_id, title, content, note_color) VALUES (?, ?, ?, ?)',
      [userId, title || 'Untitled', content || '', noteColor || '#ffffff']
    );
    return result.insertId; // Trả về ID của ghi chú vừa chèn
  },

  // Cập nhật lại tiêu đề và nội dung (Dành cho Auto-save)
  async update(noteId, userId, title, content, noteColor) {
    const [result] = await pool.query(
      `UPDATE notes 
       SET title = ?, content = ?, note_color = ? 
       WHERE id = ? 
         AND (user_id = ? OR id IN (SELECT note_id FROM note_shares WHERE recipient_id = ? AND permission = 'edit'))`,
      [title, content, noteColor || '#ffffff', noteId, userId, userId]
    );
    // Nếu row bị ảnh hưởng lớn hơn 0 có nghĩa là chỉnh sửa thành công
    return result.affectedRows > 0;
  },

  // Xóa ghi chú (Soft delete: Chỉ đưa vào thùng rác chứ không xóa hẳn)
  async delete(noteId, userId) {
    const [result] = await pool.query(
      'UPDATE notes SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [noteId, userId]
    );
    return result.affectedRows > 0;
  },

  // Việc 2: Đổi trạng thái Ghim (Pin / Unpin)
  async togglePin(noteId, userId) {
    // MySQL dùng hàm IF() hoặc XOR nhưng dùng cách đơn giản nhất là 1 - is_pinned cho kiểu đổi ngược (toggle)
    const [result] = await pool.query(
      'UPDATE notes SET is_pinned = NOT is_pinned WHERE id = ? AND user_id = ?',
      [noteId, userId]
    );
    return result.affectedRows > 0;
  },

  // ===================================
  // NHÓM BẢO MẬT GHI CHÚ
  // ===================================
  
  // Đặt mật khẩu khóa
  async setPassword(noteId, userId, passwordHash) {
    const [result] = await pool.query(
      'UPDATE notes SET has_password = true, password_hash = ? WHERE id = ? AND user_id = ?',
      [passwordHash, noteId, userId]
    );
    return result.affectedRows > 0;
  },

  // Xóa mật khẩu khóa
  async removePassword(noteId, userId) {
    const [result] = await pool.query(
      'UPDATE notes SET has_password = false, password_hash = NULL WHERE id = ? AND user_id = ?',
      [noteId, userId]
    );
    return result.affectedRows > 0;
  },

  // Lấy ra hash của mật khẩu để so sánh (Hỗ trợ cả Owner và người được Share)
  async getPasswordHash(noteId, userId) {
    const [rows] = await pool.query(
      `SELECT password_hash FROM notes 
       WHERE id = ? AND has_password = true 
         AND (user_id = ? OR id IN (SELECT note_id FROM note_shares WHERE recipient_id = ?))`,
      [noteId, userId, userId]
    );
    return rows.length ? rows[0].password_hash : null;
  },

  // Lấy ra Ghi chú nguyên vẹn (Đã Uncensor) sau khi giải mã
  async getNoteData(noteId) {
    const [rows] = await pool.query(
      `SELECT n.id, n.title, n.content, n.note_color,
              IFNULL(GROUP_CONCAT(DISTINCT i.image_url SEPARATOR ','), '') as images
       FROM notes n
       LEFT JOIN note_images i ON n.id = i.note_id
       WHERE n.id = ?
       GROUP BY n.id`, [noteId]
    );
    if (!rows.length) return null;
    return {
      ...rows[0],
      images: rows[0].images ? rows[0].images.split(',') : []
    };
  }
};

module.exports = Note;
