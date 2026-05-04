const express = require('express');
const router = express.Router();
const Label = require('../models/Label');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// @route   GET /api/labels
router.get('/', async (req, res) => {
  try {
    const labels = await Label.findByUserId(req.user.id);
    res.json(labels);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi tải danh sách nhãn' });
  }
});

// @route   POST /api/labels
router.post('/', async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ message: 'Tên nhãn không được trống!' });
    
    // Tạo và trả về luôn ID của cái mới tạo
    const labelId = await Label.create(req.user.id, name, color);
    res.status(201).json({ id: labelId, name, color });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi tạo nhãn' });
  }
});

// @route   PUT /api/labels/:id
router.put('/:id', async (req, res) => {
  try {
    const { name } = req.body;
    await Label.update(req.params.id, req.user.id, name);
    res.json({ message: 'Đổi tên thành công!' });
  } catch(err) {
    res.status(500).json({ message: 'Lỗi cập nhật' });
  }
});

// @route   DELETE /api/labels/:id
router.delete('/:id', async (req, res) => {
  try {
    await Label.delete(req.params.id, req.user.id);
    res.json({ message: 'Xóa nhãn thành công!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi xóa nhãn' });
  }
});

// ==============================
// GẮN/GỠ NHÃN CHO GHI CHÚ
// ==============================
router.post('/attach', async (req, res) => {
  const { noteId, labelId } = req.body;
  await Label.attachToNote(noteId, labelId);
  res.json({ message: 'Đã dán nhãn' });
});

router.post('/detach', async (req, res) => {
  const { noteId, labelId } = req.body;
  await Label.detachFromNote(noteId, labelId);
  res.json({ message: 'Đã gỡ nhãn' });
});

module.exports = router;
