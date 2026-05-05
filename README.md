# Ứng Dụng Quản Lý Ghi Chú

## Thành viên nhóm
- Nguyễn Minh Đức - 52400179
- Nguyễn Trương Xuân Khánh - 52400200
- Đỗ Quốc Vinh - 52400063

## Giới thiệu dự án
Dự án là một ứng dụng quản lý ghi chú hiện đại được xây dựng dưới dạng ứng dụng web tiến tiến mang lại trải nghiệm tương tự ứng dụng gốc. Ứng dụng cung cấp các tính năng mạnh mẽ từ quản lý ghi chú cá nhân, đồng bộ hóa ngoại tuyến đến cộng tác theo thời gian thực và bảo mật bằng mật khẩu. Giao diện được thiết kế mang lại trải nghiệm mượt mà, trực quan và hiện đại.

## Các tính năng nổi bật
- **Quản lý ghi chú toàn diện:** Thêm, sửa, xóa, tìm kiếm và phân loại ghi chú một cách dễ dàng.
- **Cộng tác thời gian thực:** Nhiều người dùng có thể cùng chỉnh sửa một ghi chú đồng thời.
- **Hỗ trợ ngoại tuyến:** Ứng dụng vẫn có thể hoạt động ngay cả khi thiết bị mất kết nối mạng. Đồng bộ dữ liệu tự động lên máy chủ ngay khi mạng được kết nối trở lại.
- **Bảo mật và Xác thực:** Đăng nhập, đăng ký an toàn. Hỗ trợ đặt mật khẩu bảo vệ riêng tư cho từng ghi chú quan trọng.
- **Khôi phục mật khẩu:** Tính năng quên mật khẩu và gửi email chứa mã hoặc đường dẫn khôi phục qua email.
- **Đính kèm tập tin và hình ảnh:** Hỗ trợ tải lên hình ảnh hoặc các tệp tin đính kèm cho ghi chú.
- **Giao diện hiện đại:** Giao diện người dùng được tối ưu hóa chuẩn thiết kế hiện đại, tương thích hoàn hảo trên mọi thiết bị với các hiệu ứng chuyển động mượt mà.

## Công nghệ sử dụng
- **Giao diện người dùng (Frontend):** React.js, Vite, React Router DOM.
- **Máy chủ và Xử lý (Backend):** Node.js, Express.js, Socket.io, JSON Web Token, Bcryptjs, Nodemailer, Multer.
- **Cơ sở dữ liệu:** MySQL 8.
- **Triển khai và Môi trường:** Docker, Docker Compose.


## Hướng dẫn cài đặt và chạy dự án

Có thể chạy dự án dễ dàng thông qua **Docker** (Cách được khuyên dùng nhất) hoặc tiến hành cài đặt **Thủ công** từng thành phần trên máy tính cục bộ.

### Cách 1: Chạy bằng Docker (Khuyến nghị)
Đây là cách nhanh nhất và ổn định nhất để chạy toàn bộ hệ thống (Giao diện, Máy chủ, Cơ sở dữ liệu) mà không lo bị xung đột môi trường hay phải cài đặt từng công cụ riêng lẻ.

**Yêu cầu:** Đã cài đặt Docker Desktop.

**Các bước thực hiện:**
1. Mở dòng lệnh và di chuyển đến thư mục gốc của dự án (nơi chứa tập tin `docker-compose.yml`).
2. Chạy lệnh sau để Docker tự động xây dựng hình ảnh và khởi động toàn bộ hệ thống:
   ```bash
   docker compose up --build
   ```
   *(Để chạy ngầm, hãy thêm cờ `-d`: `docker compose up --build -d`)*
3. Chờ vài phút để Docker tải hình ảnh MySQL, cài đặt các thư viện Node.js và khởi tạo cơ sở dữ liệu (tự động nạp dữ liệu từ `backend/db/schema.sql`).
4. Mở trình duyệt và truy cập ứng dụng:
   - **Giao diện người dùng:** http://localhost:8080
   - **Máy chủ API:** http://localhost:5001
   - **Cơ sở dữ liệu (MySQL):** Chạy ở cổng `3307` cục bộ (`localhost:3307`, người dùng: `root`, mật khẩu: `root`).

**Để dừng ứng dụng:**
Nhấn `Ctrl + C` (nếu chạy không có `-d`) hoặc chạy lệnh sau để dừng và xóa các container:
```bash
docker compose down
```


### Cách 2: Chạy thủ công trên môi trường cục bộ (Không dùng Docker)
Phù hợp cho việc chỉnh sửa mã nguồn và xem thay đổi ngay lập tức trên máy cục bộ mà không cần xây dựng lại container.

**Yêu cầu tiên quyết:**
- Đã cài đặt Node.js (phiên bản 18 trở lên).
- Đã cài đặt MySQL server và đang hoạt động.

#### Bước 1: Cấu hình Cơ sở dữ liệu (MySQL)
1. Truy cập vào MySQL, tạo cơ sở dữ liệu tên là `noteapp`.
   ```sql
   CREATE DATABASE noteapp;
   ```
2. Nạp cấu trúc bảng từ tập tin `backend/db/schema.sql` vào cơ sở dữ liệu vừa tạo.
3. Chỉnh sửa thông tin đăng nhập cơ sở dữ liệu trong tập tin cấu hình ở Backend (ví dụ `DB_USER`, `DB_PASS`...) cho khớp với MySQL trên máy hiện tại. Mặc định dự án đang cấu hình người dùng là `root` và mật khẩu là `root`.

#### Bước 2: Khởi chạy Máy chủ (Backend)
1. Mở một dòng lệnh mới, di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```
2. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```
3. Khởi động máy chủ ở chế độ phát triển:
   ```bash
   npm run dev
   ```
   *(Máy chủ sẽ lắng nghe tại `http://localhost:5001`)*

#### Bước 3: Khởi chạy Giao diện (Frontend)
1. Mở một dòng lệnh mới khác, di chuyển vào thư mục frontend:
   ```bash
   cd frontend
   ```
2. Cài đặt các thư viện phụ thuộc của React:
   ```bash
   npm install
   ```
3. Khởi động giao diện người dùng:
   ```bash
   npm run dev
   ```
   *(Máy chủ giao diện sẽ lắng nghe tại `http://localhost:5173`)*

#### Bước 4: Trải nghiệm ứng dụng
Mở trình duyệt và truy cập vào đường dẫn mà máy chủ hiển thị (thường là http://localhost:5173).
