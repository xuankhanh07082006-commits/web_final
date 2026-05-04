const express = require('express');
const router = express.Router();
const pool = require('../db/database');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// @route   GET /api/notifications
// @desc    Lấy danh sách thông báo của User
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Đánh dấu thông báo đã đọc
router.put('/:id/read', async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Đã đánh dấu đọc' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Đánh dấu tất cả là đã đọc
router.put('/read-all', async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [req.user.id]
    );
    res.json({ message: 'Đã đánh dấu đọc tất cả' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

module.exports = router;
