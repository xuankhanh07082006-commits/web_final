const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const authMiddleware = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// ÁP DỤNG TRẠM GÁC:Tất cả các API bên dưới dòng này đều bắt buộc phải có thẻ JWT hợp lệ!
router.use(authMiddleware);

// @route   GET /api/notes
// @desc    Lấy toàn bộ ghi chú của user đang đăng nhập (hỗ trợ search search keyword)
router.get('/', async (req, res) => {
  try {
    const searchQuery = req.query.search || '';
    const labelId = req.query.labelId || 'all'; // Lấy thêm tham số lọc Label
    // req.user.id được lấy từ "Trạm gác"
    const notes = await Note.findByUserId(req.user.id, searchQuery, labelId);
    res.json(notes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi máy chủ khi tải ghi chú' });
  }
});

// @route   POST /api/notes
// @desc    Tạo 1 tờ ghi chú mới
router.post('/', async (req, res) => {
  try {
    const { title, content, noteColor } = req.body;
    
    // Yêu cầu đề bài 2.2: "Chỉ cho phép title và content, tự động lưu"
    const noteId = await Note.create(req.user.id, title, content, noteColor);
    
    res.status(201).json({ 
      message: 'Tạo ghi chú thành công', 
      note: { id: noteId, title: title || 'Untitled', content: content || '', note_color: noteColor || '#ffffff' } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi khi tạo ghi chú mới' });
  }
});

// @route   PUT /api/notes/:id
// @desc    Sửa ghi chú (API này sẽ chạy liên tục khi Auto-save diễn ra)
router.put('/:id', async (req, res) => {
  try {
    const { title, content, noteColor } = req.body;
    
    // Cập nhật lại nội dung dựa trên ID của ghi chú (req.params.id)
    const success = await Note.update(req.params.id, req.user.id, title, content, noteColor);
    
    if (!success) {
      return res.status(404).json({ message: 'Không tìm thấy ghi chú hoặc bạn không phải chủ nhân' });
    }
    
    res.json({ message: 'Đã sao lưu tự động' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi tự động lưu' });
  }
});

// @route   DELETE /api/notes/:id
// @desc    Bỏ ghi chú vào thùng rác
router.delete('/:id', async (req, res) => {
  try {
    const password = req.body ? req.body.password : undefined;
    const noteId = req.params.id;

    // Check password if it's locked
    const existingHash = await Note.getPasswordHash(noteId, req.user.id);
    if (existingHash) {
      if (!password) {
        return res.status(401).json({ message: 'Ghi chú đang bị khóa. Vui lòng nhập mật khẩu để xóa!' });
      }
      const isMatch = await bcrypt.compare(password, existingHash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Mật khẩu không chính xác!' });
      }
    }

    const success = await Note.delete(noteId, req.user.id);
    if (!success) {
      return res.status(404).json({ message: 'Không tìm ra ghi chú để xóa' });
    }
    res.json({ message: 'Đã chuyển ghi chú vào thùng rác an toàn' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi hệ thống khi xóa' });
  }
});

// @route   PUT /api/notes/:id/pin
// @desc    Đổi trạng thái Ghim / Hủy ghim
router.put('/:id/pin', async (req, res) => {
  try {
    const success = await Note.togglePin(req.params.id, req.user.id);
    if (!success) {
      return res.status(404).json({ message: 'Không tìm thấy ghi chú' });
    }
    res.json({ message: 'Đã cập nhật trạng thái Ghim' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi hệ thống' });
  }
});

// @route   PUT /api/notes/:id/password
// @desc    Thiết lập hoặc Gỡ bỏ mật khẩu
router.put('/:id/password', async (req, res) => {
  try {
    const { password, oldPassword } = req.body;
    const noteId = req.params.id;

    // Kiểm tra xem ghi chú đã có mật khẩu chưa
    const existingHash = await Note.getPasswordHash(noteId, req.user.id);
    if (existingHash) {
      if (!oldPassword) {
        return res.status(400).json({ message: 'Vui lòng nhập mật khẩu hiện tại để xác thực' });
      }
      const isMatch = await bcrypt.compare(oldPassword, existingHash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Mật khẩu hiện tại không chính xác' });
      }
    }

    // Nếu password trống = Xóa mật khẩu
    if (!password) {
      await Note.removePassword(noteId, req.user.id);
      return res.json({ message: 'Đã gỡ mật khẩu khóa' });
    }
    
    // Nếu có password = Mã hóa và Đặt mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    await Note.setPassword(noteId, req.user.id, hash);
    res.json({ message: 'Đã khóa ghi chú thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi đặt mật khẩu' });
  }
});

// @route   POST /api/notes/:id/unlock
// @desc    Mở khóa Ghi chú
router.post('/:id/unlock', async (req, res) => {
  try {
    const { password } = req.body;
    const noteId = req.params.id;

    // 1. Lấy mã hash thật từ DB
    const hash = await Note.getPasswordHash(noteId, req.user.id);
    if (!hash) return res.status(400).json({ message: 'Ghi chú này không bị khóa hoặc bạn không có quyền' });

    // 2. So sánh
    const isMatch = await bcrypt.compare(password, hash);
    if (!isMatch) return res.status(401).json({ message: 'Mật khẩu không chính xác!' });

    // 3. Trả về nội dung thật
    const realNote = await Note.getNoteData(noteId);
    res.json(realNote);

  } catch(err) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
