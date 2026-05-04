# Hướng dẫn Cài đặt Dự án Quản lý Ghi chú (NoteApp)

Đây là tài liệu hướng dẫn cài đặt và khởi chạy dự án trên môi trường Local (Windows) sử dụng XAMPP và Node.js.
Dự án đã tích hợp đầy đủ các tính năng: Đăng nhập, CRUD, Đặt mật khẩu, Gán nhãn, WebSockets (Real-time), Chia sẻ ghi chú, và PWA (Offline Mode).

## Lựa chọn 1: Chạy dự án tự động bằng Docker (Khuyên dùng)
Dự án đã được cấu hình sẵn Docker Compose, giúp việc khởi chạy trở nên dễ dàng và độc lập với môi trường máy chủ.

1. Đảm bảo máy tính đã cài đặt và bật **Docker Desktop**.
2. Mở Terminal/CMD tại thư mục gốc của dự án.
3. Chạy lệnh sau:
   ```bash
   docker compose up -d --build
   ```
4. Đợi quá trình build hoàn tất. 
5. Truy cập ứng dụng tại: `http://localhost:8080`.

---

## Lựa chọn 2: Chạy dự án thủ công bằng XAMPP và Node.js

Nếu không sử dụng Docker, vui lòng làm theo các bước dưới đây để thiết lập môi trường chạy thủ công.

### Bước 1: Khởi tạo Cơ sở dữ liệu (MySQL)
1. Mở **XAMPP Control Panel**, nhấn `Start` cho **Apache** và **MySQL**.
2. Truy cập `http://localhost/phpmyadmin`.
3. Tạo Database mới với tên: `noteapp` (Collation: `utf8mb4_unicode_ci`).
4. Chọn Database `noteapp`, nhấn tab **Import (Nhập)**.
5. Chọn file `backend/db/schema.sql` từ source code và nhấn **Go/Thực thi** để tự động tạo các bảng dữ liệu.

### Bước 2: Cấu hình Biến môi trường Backend (.env)
1. Di chuyển vào thư mục `backend`.
2. Copy file `.env.example` thành file `.env` (nếu chưa có).
3. Cấu hình thông số kết nối Database (mặc định XAMPP thường để mật khẩu rỗng):
   ```env
   PORT=5001
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=
   DB_NAME=noteapp
   DB_PORT=3306
   JWT_SECRET=super_secret_key_123
   CLIENT_URL=http://localhost:5173
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

### Bước 3: Cài đặt và Khởi chạy
Yêu cầu hệ thống: Đã cài đặt **Node.js** (Phiên bản 18+).

**Terminal 1: Khởi chạy Backend**
Mở terminal mới và chạy các lệnh sau:
```bash
cd backend
npm install
npm run dev
```

**Terminal 2: Khởi chạy Frontend**
Mở terminal mới và chạy các lệnh sau:
```bash
cd frontend
npm install
npm run dev
```

### Bước 4: Kiểm tra ứng dụng
- Mở trình duyệt và truy cập đường dẫn: `http://localhost:5173`
- Đăng ký một tài khoản mới để trải nghiệm các tính năng. Các tính năng thời gian thực (Real-time) và Ngoại tuyến (Offline Mode / PWA) sẽ tự động kích hoạt.
