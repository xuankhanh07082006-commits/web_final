const express = require('express');
const router = express.Router();
const Share = require('../models/Share');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// @route   POST /api/shares
// @desc    Chia sẻ một ghi chú cho Email khác
router.post('/', async (req, res) => {
  try {
    const { noteId, recipientEmail, permission } = req.body;
    if (!noteId || !recipientEmail) {
      return res.status(400).json({ message: 'Thiếu thông tin yêu cầu!' });
    }

    const result = await Share.create(noteId, req.user.id, recipientEmail, permission || 'read');
    if (result.error) return res.status(400).json({ message: result.error });

    res.json({ message: result.message });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

// @route   GET /api/shares/:noteId
// @desc    Lấy danh sách người đã được chia sẻ ghi chú này
router.get('/:noteId', async (req, res) => {
  try {
    const shares = await Share.findByNote(req.params.noteId, req.user.id);
    res.json(shares);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

// @route   DELETE /api/shares/:shareId
// @desc    Gỡ quyền người dùng khỏi Ghi chú
router.delete('/:shareId', async (req, res) => {
  try {
    const success = await Share.delete(req.params.shareId, req.user.id);
    if (!success) return res.status(404).json({ message: 'Không tìm thấy kết nối chia sẻ' });
    
    res.json({ message: 'Đã thu hồi quyền truy cập' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

// @route   PUT /api/shares/:shareId
// @desc    Đổi quyền của người được chia sẻ
router.put('/:shareId', async (req, res) => {
  try {
    const { permission } = req.body;
    if (!['read', 'edit'].includes(permission)) {
      return res.status(400).json({ message: 'Quyền không hợp lệ' });
    }
    const success = await Share.updatePermission(req.params.shareId, req.user.id, permission);
    if (!success) return res.status(404).json({ message: 'Không tìm thấy kết nối chia sẻ' });
    
    res.json({ message: 'Đã cập nhật quyền truy cập' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

module.exports = router;
