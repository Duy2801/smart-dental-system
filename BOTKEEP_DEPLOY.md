# Deploy backend lên Botkeep

Repo này là pnpm workspace. Chọn repository `smart-dental-system` trên Botkeep và đặt **Project root** là thư mục gốc (`.`), nơi có `package.json`, `pnpm-workspace.yaml` và `pnpm-lock.yaml`. Chọn runtime **Node.js 22** (tối thiểu 22.12). Không chọn cấu hình Nodemon cho production.

Nếu Botkeep có các ô lệnh riêng, nhập:

| Ô cấu hình | Giá trị |
| --- | --- |
| Build command | `pnpm install --frozen-lockfile && pnpm botkeep:build` |
| Start command | `pnpm botkeep:start` |

`botkeep:build` chỉ tạo Prisma Client và build `apps/backend`. `botkeep:start` chỉ chạy tiến trình NestJS đã biên dịch (`apps/backend/dist/src/main.js`). Nếu máy chủ chưa có lệnh `pnpm`, bật Corepack hoặc cài pnpm 9 trước bước build. Không dùng `node dist/main.js` ở thư mục gốc vì file đó không tồn tại.

Backend đọc `SERVER_PORT` do Botkeep cấp (dự phòng `PORT`, rồi `3000`) và lắng nghe trên `0.0.0.0`. Sau khi deploy, bật domain HTTPS trong Botkeep và kiểm tra `GET /` cùng `/api`.

## Environment của Botkeep

Thêm giá trị thực trong mục **Environment/Secrets** của Botkeep, không commit file `.env`:

| Biến | Mục đích |
| --- | --- |
| `NODE_ENV=production` | Cookie đăng nhập hoạt động qua HTTPS giữa frontend và backend |
| `DATABASE_URL` | Kết nối PostgreSQL Prisma của ứng dụng |
| `JWT_SECRET` | Ký và xác thực token đăng nhập |
| `REDIS_URL` | Redis cho hàng đợi email và tính năng thời gian thực |
| `EMAIL_EMAIL_PASSUSER`, `EMAIL_EMAIL_PASSWORD` | Tài khoản gửi email; backend yêu cầu khi khởi động |
| `FRONTEND_URL` | URL HTTPS của frontend sau khi deploy lên Vercel |

Thêm các biến của dịch vụ đang dùng như `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, cấu hình thanh toán hoặc Google OAuth theo `.env` cục bộ. `DIRECT_URL` chỉ cần khi chạy lệnh migration/schema Prisma trực tiếp; `DATABASE_URL` dùng cho runtime. Không chạy seed trong build/start, vì seed có thể ghi đè dữ liệu production.

`FRONTEND_URL` phải có giá trị ngay khi backend khởi động. Nếu Vercel chưa có domain, dùng tạm URL frontend hiện tại (ví dụ `http://localhost:3001`) rồi đổi sang URL HTTPS của Vercel khi frontend được triển khai.

## Frontend trên Vercel

Tạo project Vercel riêng từ cùng repository và đặt **Root Directory** là `apps/frontend-patient`. Đặt `NEXT_PUBLIC_API_URL=https://<domain-backend>` (chỉ origin, không thêm `/api/v1`). Nếu dùng Socket.IO, đặt `NEXT_PUBLIC_SOCKET_URL` cùng origin đó. Backend có thể deploy trước; khi có URL Vercel thật, cập nhật `FRONTEND_URL` trong Botkeep và redeploy/restart backend.
