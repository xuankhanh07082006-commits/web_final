require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Setup Socket.io for realtime collaboration
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Việc 4: Cấp quyền truy cập công khai cho thư mục uploads/
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Example room joining for collaborative editing
  socket.on('join-note', (noteId) => {
    socket.join(`note-${noteId}`);
  });

  // Tín hiệu khi 1 user đang gõ chữ
  socket.on('edit-note', ({ noteId, title, content }) => {
    // Phát cho tất cả thành viên trong Room trừ bản thân người gửi
    socket.to(`note-${noteId}`).emit('note-updated', { title, content });
  });

  socket.on('leave-note', (noteId) => {
    socket.leave(`note-${noteId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Attach io to req object so routes can use it for notifications
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Basic route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running!' });
});

// TODO: Import and use actual routes here
app.use('/api/auth', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes')); // <-- Khai báo bộ cổng tiếp đón Note!
app.use('/api/upload', require('./routes/upload')); // <-- Gắn route upload
app.use('/api/labels', require('./routes/labels')); // <-- API Nhãn dán
app.use('/api/shares', require('./routes/shares')); // <-- API Chia sẻ
app.use('/api/notifications', require('./routes/notifications')); // <-- API Thông báo

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
