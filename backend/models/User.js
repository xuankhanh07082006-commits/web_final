const pool = require('../db/database');

const User = {
  // Find a user by email
  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  },

  // Find a user by ID
  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  },

  // Create a new user
  async create(username, email, passwordHash, activationToken) {
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password_hash, activation_token, is_verified) VALUES (?, ?, ?, ?, false)',
      [username, email, passwordHash, activationToken]
    );
    return result.insertId;
  },

  // Activate user by token
  async activate(token) {
    const [result] = await pool.query(
      'UPDATE users SET is_verified = true, activation_token = NULL WHERE activation_token = ?',
      [token]
    );
    return result.affectedRows > 0;
  },

  // Cập nhật Avatar
  async updateAvatar(id, avatarUrl) {
    const [result] = await pool.query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, id]);
    return result.affectedRows > 0;
  },

  // Đổi Mật Khẩu
  async updatePassword(id, newPasswordHash) {
    const [result] = await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newPasswordHash, id]);
    return result.affectedRows > 0;
  },

  // Cập nhật tinh chỉnh Preferences
  async updatePreferences(id, theme, fontSize, defaultNoteColor) {
    const [result] = await pool.query(
      'UPDATE users SET theme = ?, font_size = ?, default_note_color = ? WHERE id = ?',
      [theme, fontSize, defaultNoteColor, id]
    );
    return result.affectedRows > 0;
  },

  // Cập nhật thông tin hồ sơ cơ bản
  async updateProfile(id, username, email) {
    const [result] = await pool.query(
      'UPDATE users SET username = ?, email = ? WHERE id = ?',
      [username, email, id]
    );
    return result.affectedRows > 0;
  },

  // Quên mật khẩu: Lưu mã OTP vào DB (Sử dụng tạm reset_token làm OTP)
  async saveOTP(email, otp) {
    // Cho phép OTP sống trong 15 phút
    const expires = new Date(Date.now() + 15 * 60000); 
    const [result] = await pool.query(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?',
      [otp, expires, email]
    );
    return result.affectedRows > 0;
  },

  // Kiểm tra OTP có đúng và chưa hết hạn hay không
  async verifyOTP(email, otp) {
    const [rows] = await pool.query(
      'SELECT id FROM users WHERE email = ? AND reset_token = ? AND reset_token_expires > CURRENT_TIMESTAMP',
      [email, otp]
    );
    if (rows.length > 0) {
      // Xác nhận đúng -> Dọn dẹp OTP cũ tránh dùng lại
      await pool.query('UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = ?', [rows[0].id]);
      return rows[0].id;
    }
    return null;
  },

  // Chỉ kiểm tra xem OTP có hợp lệ không (không xóa)
  async checkOTP(email, otp) {
    const [rows] = await pool.query(
      'SELECT id FROM users WHERE email = ? AND reset_token = ? AND reset_token_expires > CURRENT_TIMESTAMP',
      [email, otp]
    );
    return rows.length > 0;
  }
};

module.exports = User;
