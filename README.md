# Ứng Dụng Quản Lý Ghi Chú (Note Management Application)

## Thành viên nhóm
- **[Nguyễn Minh Đức]** - [52400179]
- **[Nguyễn Trương Xuân Khánh]** - [52400200]
- **[Đỗ Quốc Vinh]** - [52400063]

## Giới thiệu dự án
Dự án là một ứng dụng quản lý ghi chú hiện đại (Note Management Application) được xây dựng dưới dạng Progressive Web App (PWA) mang lại trải nghiệm tương tự ứng dụng gốc. Ứng dụng cung cấp các tính năng mạnh mẽ từ quản lý ghi chú cá nhân, đồng bộ hóa ngoại tuyến (Offline sync) đến cộng tác theo thời gian thực (Real-time collaboration) và bảo mật bằng mật khẩu. Giao diện được thiết kế theo phong cách Glassmorphism mang lại trải nghiệm mượt mà, trực quan và hiện đại.

## Các tính năng nổi bật
- **Quản lý ghi chú toàn diện:** Thêm, sửa, xóa, tìm kiếm và phân loại ghi chú một cách dễ dàng.
- **Cộng tác thời gian thực (Real-time Collaboration):** Nhiều người dùng có thể cùng chỉnh sửa một ghi chú đồng thời (được hỗ trợ bởi thư viện Socket.io).
- **Hỗ trợ ngoại tuyến (Offline Mode - PWA):** Ứng dụng vẫn có thể hoạt động ngay cả khi thiết bị mất kết nối mạng. Đồng bộ dữ liệu tự động lên máy chủ ngay khi mạng được kết nối trở lại.
- **Bảo mật & Xác thực:** Đăng nhập, đăng ký an toàn với JWT. Hỗ trợ đặt mật khẩu bảo vệ riêng tư cho từng ghi chú quan trọng.
- **Khôi phục mật khẩu:** Tính năng quên mật khẩu và gửi email chứa mã/đường dẫn khôi phục qua email.
- **Đính kèm tập tin/Hình ảnh:** Hỗ trợ tải lên hình ảnh hoặc các tệp tin đính kèm cho ghi chú.
- **Giao diện hiện đại (Glassmorphism):** UI/UX được tối ưu hóa chuẩn thiết kế hiện đại, Responsive design tương thích hoàn hảo trên mọi thiết bị (Mobile, Tablet, Desktop) với các hiệu ứng chuyển động mượt mà.

## Công nghệ sử dụng
- **Frontend:** React.js (v19), Vite, React Router DOM, Vite PWA, Socket.io-client.
- **Backend:** Node.js, Express.js, Socket.io, JSON Web Token (JWT), Bcryptjs, Nodemailer, Multer.
- **Cơ sở dữ liệu:** MySQL 8.
- **Triển khai & Môi trường:** Docker, Docker Compose.


## Hướng dẫn cài đặt và chạy dự án

Bạn có thể chạy dự án dễ dàng thông qua **Docker** (Cách được khuyên dùng nhất) hoặc tiến hành cài đặt **Thủ công** từng thành phần trên máy tính cục bộ.

### Cách 1: Chạy bằng Docker (Khuyến nghị)
Đây là cách nhanh nhất và ổn định nhất để chạy toàn bộ hệ thống (Frontend, Backend, Database) mà không lo bị xung đột môi trường hay phải cài đặt từng công cụ riêng lẻ.

**Yêu cầu:** Đã cài đặt [Docker Desktop](https://www.docker.com/products/docker-desktop/).

**Các bước thực hiện:**
1. Mở terminal hoặc command prompt và di chuyển đến thư mục gốc của dự án (nơi chứa file `docker-compose.yml`).
2. Chạy lệnh sau để Docker tự động build hình ảnh và khởi động toàn bộ hệ thống:
   ```bash
   docker compose up --build
   ```
   *(Nếu bạn muốn chạy ngầm, hãy thêm cờ `-d`: `docker compose up --build -d`)*
3. Chờ vài phút để Docker tải image MySQL, cài đặt các thư viện Node.js và khởi tạo cơ sở dữ liệu (tự động load dữ liệu từ `backend/db/schema.sql`).
4. Mở trình duyệt và truy cập ứng dụng:
   - **Frontend (Giao diện người dùng):** [http://localhost:8080](http://localhost:8080)
   - **Backend API:** [http://localhost:5001](http://localhost:5001)
   - **Database (MySQL):** Chạy ở cổng `3307` trên local (`localhost:3307`, user: `root`, password: `root`).

**Để dừng ứng dụng:**
Nhấn `Ctrl + C` (nếu chạy không có `-d`) hoặc chạy lệnh sau để dừng và xóa các container:
```bash
docker compose down
```


### Cách 2: Chạy thủ công trên môi trường Local (Không dùng Docker)
Phù hợp nếu bạn muốn chỉnh sửa code và xem thay đổi ngay lập tức trên máy cục bộ của mình mà không cần build lại container.

**Yêu cầu tiên quyết:**
- Đã cài đặt [Node.js](https://nodejs.org/) (phiên bản 18+).
- Đã cài đặt [MySQL](https://www.mysql.com/) server và đang hoạt động.

#### Bước 1: Cấu hình Cơ sở dữ liệu (MySQL)
1. Truy cập vào MySQL của bạn, tạo database tên là `noteapp`.
   ```sql
   CREATE DATABASE noteapp;
   ```
2. Import cấu trúc bảng từ file `backend/db/schema.sql` vào database vừa tạo.
3. Chỉnh sửa thông tin đăng nhập database trong file cấu hình ở Backend (ví dụ `DB_USER`, `DB_PASS`...) cho khớp với MySQL ở máy của bạn. Mặc định dự án đang cấu hình user là `root` và password là `root`.

#### Bước 2: Khởi chạy Backend
1. Mở một terminal mới, di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```
2. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```
3. Khởi động server backend ở chế độ phát triển:
   ```bash
   npm run dev
   ```
   *(Backend sẽ lắng nghe tại `http://localhost:5001`)*

#### Bước 3: Khởi chạy Frontend
1. Mở một terminal mới khác, di chuyển vào thư mục frontend:
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
   *(Vite server sẽ lắng nghe tại `http://localhost:5173`)*

#### Bước 4: Trải nghiệm ứng dụng
Mở trình duyệt và truy cập vào đường dẫn mà Vite hiển thị (thường là [http://localhost:5173](http://localhost:5173)).
