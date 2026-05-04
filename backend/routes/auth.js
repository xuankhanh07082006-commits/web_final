const express = require('express');
const router = express.Router();
const User = require('../models/User'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');

// Cấu hình Multer lưu ảnh Avatar
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, 'avatar-' + Date.now() + path.extname(file.originalname));
  }
});
const uploadAvatar = multer({ storage: storage, fileFilter: (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Chỉ cho phép tải hình ảnh!'), false);
}});

// Cấu hình gửi email kích hoạt
const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendActivationEmail = async (toEmail, activationLink) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Thiếu EMAIL_USER/EMAIL_PASS, không thể gửi email thật.');
    return false;
  }

  try {
    await mailTransport.sendMail({
      from: `"NoteApp" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Kích hoạt tài khoản NoteApp',
      html: `
        <p>Chào bạn,</p>
        <p>Vui lòng bấm vào link dưới đây để kích hoạt tài khoản:</p>
        <p><a href="${activationLink}">${activationLink}</a></p>
        <p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
      `,
    });
    return true;
  } catch (err) {
    console.error('Gui email kich hoat that bai:', err.message);
    return false;
  }
};

const sendOTPEmail = async (toEmail, otp) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Thiếu EMAIL_USER/EMAIL_PASS, không thể gửi email thật.');
    return false;
  }

  try {
    await mailTransport.sendMail({
      from: `"NoteApp" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Mã OTP Khôi phục mật khẩu',
      html: `
        <p>Chào bạn,</p>
        <p>Mã OTP để khôi phục mật khẩu của bạn là: <strong style="font-size: 20px;">${otp}</strong></p>
        <p>Mã này có hiệu lực trong vòng 15 phút.</p>
        <p>Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này để bảo đảm an toàn.</p>
      `,
    });
    return true;
  } catch (err) {
    console.error('Gui email OTP that bai:', err.message);
    return false;
  }
};

// @route   POST /api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // 1. Validate inputs
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
    }

    // 2. Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Create activation token
    const activationToken = uuidv4();

    // 5. Save user to DB
    const userId = await User.create(username, email, passwordHash, activationToken);

    // 6. Output to terminal for testing (mock email sending)
    const clientUrl = process.env.CLIENT_URL || req.headers.origin || 'http://localhost:5173';
    const activationLink = `${clientUrl}/verify?token=${activationToken}`;
    console.log(`\n=================================================`);
    console.log(`[EMAIL MOCK] Vui lòng click vào link sau để kích hoạt tài khoản:`);
    console.log(`[EMAIL MOCK] ${activationLink}`);
    console.log(`=================================================\n`);

    // 6.1 Gui email kich hoat that
    await sendActivationEmail(email, activationLink);

    // 7. Auto login: Generate JWT
    const jwtSecret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';
    const token = jwt.sign(
      { id: userId, email }, 
      jwtSecret, 
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'Đăng ký thành công, vui lòng kiểm tra email để kích hoạt. Đã tự động đăng nhập.',
      token,
      user: { id: userId, username, email, is_verified: 0 }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 1. Validate inputs
    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu' });
    }

    // 2. Check if user exists
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    // 3. Compare passwords
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    // 4. Generate JWT & return
    const jwtSecret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';
    const token = jwt.sign(
      { id: user.id, email: user.email }, 
      jwtSecret, 
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_verified: user.is_verified,
        theme: user.theme,
        font_size: user.font_size,
        default_note_color: user.default_note_color
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// @route   GET /api/auth/verify/:token
// @desc    Verify account
// @access  Public
router.get('/verify/:token', async (req, res) => {
  try {
    const success = await User.activate(req.params.token);
    if (!success) {
      return res.status(400).json({ message: 'Mã kích hoạt không hợp lệ hoặc đã được sử dụng' });
    }
    res.json({ message: 'Kích hoạt tài khoản thành công!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

const authMiddleware = require('../middleware/auth');

// @route   GET /api/auth/me
// @desc    Get current logged in user profile
// @access  Private
// NOTE: Áp dụng 'authMiddleware' vào đây để bắt buộc người dùng dơ thẻ JWT mới được đi tiếp!
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // req.user được gán bởi trạm gác authMiddleware (chứa Token đã giải mã)
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Trả về thông tin an toàn (bỏ password_hash, token...)
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      is_verified: user.is_verified,
      avatar_url: user.avatar_url,
      theme: user.theme,
      font_size: user.font_size,
      default_note_color: user.default_note_color
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Cập nhật thông tin hồ sơ (tên hiển thị + email)
// @access  Private
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { username, email } = req.body;

    if (!username || !email) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser && existingUser.id !== req.user.id) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    const success = await User.updateProfile(req.user.id, username, email);
    if (!success) {
      return res.status(500).json({ message: 'Cập nhật hồ sơ thất bại' });
    }

    res.json({
      message: 'Cập nhật hồ sơ thành công',
      user: { id: req.user.id, username, email }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// @route   POST /api/auth/avatar
// @desc    Tải ảnh đại diện lên
router.post('/avatar', authMiddleware, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Không có file ảnh nào được chọn' });
    
    const avatarUrl = `/uploads/${req.file.filename}`;
    await User.updateAvatar(req.user.id, avatarUrl);
    
    res.json({ message: 'Cập nhật Avatar thành công', avatarUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi upload avatar' });
  }
});

// @route   PUT /api/auth/password
// @desc    Đổi mật khẩu bảo mật (yêu cầu mật khẩu cũ)
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    
    // Kiểm tra Pass cũ
    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: 'Mật khẩu cũ không đúng!' });
    
    // Đổi Pass mới
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);
    await User.updatePassword(req.user.id, newHash);
    
    res.json({ message: 'Đổi mật khẩu thành công!' });
  } catch(err) {
    res.status(500).json({ message: 'Lỗi hệ thống khi đổi mật khẩu' });
  }
});

// @route   PUT /api/auth/preferences
// @desc    Cập nhật cài đặt giao diện
router.put('/preferences', authMiddleware, async (req, res) => {
  try {
    const { theme, fontSize, defaultNoteColor } = req.body;
    await User.updatePreferences(req.user.id, theme, fontSize, defaultNoteColor);
    res.json({ message: 'Đã lưu Cài đặt Giao diện!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lưu cài đặt' });
  }
});

// ===================================
// LUỒNG QUÊN MẬT KHẨU (FORGOT PASSWORD)
// ===================================

// @route   POST /api/auth/forgot-password/send-otp
router.post('/forgot-password/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findByEmail(email);
    if (!user) return res.status(404).json({ message: 'Email này chưa được đăng ký trong hệ thống!' });
    
    // Tạo mã OTP 6 số ngẫu nhiên
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await User.saveOTP(email, otp);
    
    console.log(`\n=================================================`);
    console.log(`[EMAIL MOCK - MÃ OTP] Mã OTP quên mật khẩu của bạn là: ${otp}`);
    console.log(`[Lưu ý OTP sẽ hết hạn sau 15 phút]`);
    console.log(`=================================================\n`);
    
    await sendOTPEmail(email, otp);
    
    res.json({ message: 'Đã gửi mã OTP vào email của bạn!' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi sinh mã OTP' });
  }
});

// @route   POST /api/auth/forgot-password/verify-otp
router.post('/forgot-password/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const isValid = await User.checkOTP(email, otp);
    if (!isValid) {
      return res.status(400).json({ message: 'Mã OTP không đúng hoặc đã hết hạn!' });
    }
    res.json({ message: 'Mã OTP hợp lệ!' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi kiểm tra OTP' });
  }
});

// @route   POST /api/auth/forgot-password/reset
router.post('/forgot-password/reset', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    // Xác thực OTP
    const userId = await User.verifyOTP(email, otp);
    if (!userId) return res.status(400).json({ message: 'Mã OTP không đúng hoặc đã hết hạn!' });
    
    // Hash và lưu password mới
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    await User.updatePassword(userId, passwordHash);
    
    res.json({ message: 'Đã đặt lại mật khẩu thành công!' });
  } catch(err) {
    res.status(500).json({ message: 'Lỗi xác nhận đổi mật khẩu' });
  }
});

module.exports = router;
