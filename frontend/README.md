# Frontend - Dự án Quản lý Ghi chú (NoteApp)

Đây là thư mục chứa mã nguồn Frontend của ứng dụng, được phát triển dựa trên **ReactJS** và công cụ build **Vite**.

## Công nghệ sử dụng
- **React 18** (UI Library)
- **Vite** (Build Tool)
- **Socket.io-client** (Real-time collaboration)
- **Vite PWA Plugin** (Hỗ trợ chế độ Offline và cài đặt ứng dụng)
- **Vanilla CSS** (Giao diện chuẩn Glassmorphism nguyên bản)

## Cấu trúc thư mục
- `/src/components`: Các thành phần tái sử dụng (Notes, UI Modals, Labels, v.v.)
- `/src/contexts`: Quản lý trạng thái toàn cục (Theme, Font Size)
- `/src/pages`: Các trang giao diện chính (Login, Register, Home, Profile)
- `/src/services`: Tương tác với IndexedDB (Lưu trữ ngoại tuyến)
- `/src/index.css`: Toàn bộ CSS điều khiển giao diện Glassmorphism và Responsive

## Hướng dẫn chạy độc lập
*(Lưu ý: Bạn nên sử dụng Docker Compose ở thư mục gốc để chạy toàn bộ hệ thống).*

Nếu chỉ muốn chạy Frontend để thiết kế UI:
```bash
npm install
npm run dev
```
