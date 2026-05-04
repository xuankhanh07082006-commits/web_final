const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middleware/auth');
const pool = require('../db/database');

// 1. CẤU HÌNH MULTER (Người vận chuyển)
// Định nghĩa nơi lưu file tải lên và cách đặt tên cho file đó (Tránh trùng lặp)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Thả file vào thư mục tên là 'uploads'
  },
  filename: function (req, file, cb) {
    // Đặt tên file: Tên trường + thời gian + đuôi file (.jpg, .png)
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Chỉ chấp nhận các file là hình ảnh
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép tải hình ảnh!'), false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// Tất cả file tải lên đều cần có thẻ JWT
router.use(authMiddleware);

// @route   POST /api/upload/:noteId
// @desc    Nhận file ảnh từ Frontend và lưu nối vào tờ Ghi chú
router.post('/:noteId', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Không tìm thấy file ảnh đính kèm' });
    }

    const noteId = req.params.noteId;
    const imageUrls = [];

    // Ghi sổ địa chỉ các bức ảnh vào bảng note_images trong Database
    for (const file of req.files) {
      const imageUrl = `/uploads/${file.filename}`;
      await pool.query(
        'INSERT INTO note_images (note_id, image_url) VALUES (?, ?)',
        [noteId, imageUrl]
      );
      imageUrls.push(imageUrl);
    }

    res.json({ message: 'Tải ảnh lên thành công', imageUrls: imageUrls });
  } catch (error) {
    console.error('Lỗi khi tải ảnh:', error);
    res.status(500).json({ message: 'Lỗi server khi upload ảnh' });
  }
});

// @route   DELETE /api/upload/:noteId
// @desc    Xóa ảnh đính kèm
router.delete('/:noteId', async (req, res) => {
  try {
    const noteId = req.params.noteId;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: 'Missing imageUrl' });
    }

    await pool.query('DELETE FROM note_images WHERE note_id = ? AND image_url = ?', [noteId, imageUrl]);

    const fs = require('fs');
    const filename = path.basename(imageUrl);
    const filepath = path.join(__dirname, '..', 'uploads', filename);
    
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    res.json({ message: 'Xóa ảnh thành công' });
  } catch (error) {
    console.error('Lỗi xóa ảnh:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
