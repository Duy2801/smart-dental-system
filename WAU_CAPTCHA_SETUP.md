# WauCaptcha cho đăng nhập bệnh nhân

CAPTCHA chỉ áp dụng cho bệnh nhân đăng nhập bằng email/mật khẩu trên web và ứng dụng mobile. Đăng nhập bằng Google không yêu cầu CAPTCHA. Backend kiểm tra vai trò tài khoản trước khi yêu cầu CAPTCHA. Bác sĩ, lễ tân và quản trị viên đăng nhập không cần CAPTCHA, kể cả khi đã bật `WAU_SECRET_KEY`.

CAPTCHA dùng loại **image_distort** (nhập mã trong ảnh) qua SDK `@waucaptcha-sdk/client` (gói cũ `@wau-captcha/*` đã được thay bằng gói mới). Trên web và mobile bệnh nhân, nhập mã trong ảnh rồi bấm **Đăng nhập**; ứng dụng xác minh đáp án với WauCaptcha và gửi token cho backend trong cùng thao tác. Nút làm mới cạnh ô nhập tạo ảnh mã khác. Nếu chưa điền site key, giao diện báo chưa cấu hình và không thể tải ảnh thật.

Backend xác minh token qua `POST https://api.waucaptcha.com/siteverify`, chỉ chấp nhận `success: true`, `behavior.verdict: human` và hostname nằm trong danh sách cho phép. Token chỉ dùng một lần; sau lần đăng nhập thất bại, ảnh mã được tải lại và bệnh nhân cần nhập mã mới. (Backend vẫn giữ sẵn quy tắc từ chối lượt `auto_check` kiểu `first_visit`, chỉ có tác dụng nếu sau này chuyển sang loại auto_check.)

## Biến cần điền

| Nơi cấu hình | Biến | Giá trị |
| --- | --- | --- |
| Backend / Botkeep | `WAU_SECRET_KEY` | Secret key, chỉ lưu ở backend |
| Backend / Botkeep | `WAU_CAPTCHA_ALLOWED_HOSTNAMES` | Hostname web bệnh nhân, cách nhau bằng dấu phẩy. Ví dụ: `patient.example.com,localhost,localhost:3001` |
| Web bệnh nhân / Vercel | `NEXT_PUBLIC_WAU_CAPTCHA_SITE_KEY` | Site key công khai (`pk_...`) |
| Backend / Botkeep | `FRONTEND_URL` | Origin HTTPS của web bệnh nhân; mobile mở `${FRONTEND_URL}/captcha/mobile` trong WebView |

Trong [dashboard WauCaptcha](https://waucaptcha.com/), thêm domain web bệnh nhân vào allowed domains của key. Khi thử local, thêm `localhost:3001`. Mobile sử dụng domain web bệnh nhân, không cần domain riêng. Web nhân viên không cần site key.

**Thứ tự bật:** triển khai backend mới khi chưa đặt `WAU_SECRET_KEY`, sau đó triển khai web bệnh nhân với site key và phát hành app mobile mới. Khi client bệnh nhân đã sẵn sàng, đặt `WAU_SECRET_KEY` và `WAU_CAPTCHA_ALLOWED_HOSTNAMES` trên backend rồi restart. Nếu đặt secret trước, bản mobile bệnh nhân cũ không gửi token sẽ bị từ chối đăng nhập; tài khoản nhân viên vẫn đăng nhập bình thường.

Khi chưa đặt `WAU_SECRET_KEY`, backend không yêu cầu CAPTCHA. Sau khi đặt site key trên Next.js, cần build/deploy lại web bệnh nhân vì `NEXT_PUBLIC_...` được đưa vào bundle lúc build.

## CAPTCHA trên ứng dụng mobile

App mobile hiển thị CAPTCHA **native** (component `NativeCaptcha`), giao diện giống web: ô nhập mã, nút đổi mã, ảnh mã. App gọi thẳng REST API WauCaptcha (`/challenge/new`, `/challenge/verify`), giải proof of work bằng `solvePow` của `@waucaptcha-sdk/client` và gửi kèm dữ liệu hành vi chạm / gõ phím. Không cần WebView hay web bệnh nhân đang chạy.

Mỗi yêu cầu tới WauCaptcha gửi header `Origin` là domain web bệnh nhân, nên WauCaptcha và backend coi token như được giải trên web (hostname phải nằm trong `WAU_CAPTCHA_ALLOWED_HOSTNAMES`).

| Biến trong `apps/mobile/.env` | Giá trị |
| --- | --- |
| `NEXT_PUBLIC_WAU_CAPTCHA_SITE_KEY` | Cùng site key công khai với web bệnh nhân |
| `NEXT_PUBLIC_WAU_CAPTCHA_ORIGIN` | Origin web bệnh nhân, ví dụ `http://localhost:3001` (local) hoặc `https://patient.example.com`. Bỏ trống thì app lấy theo `FRONTEND_URL` mà backend trả về |

Đổi `.env` của mobile cần khởi động lại Metro (`pnpm start --reset-cache`), không cần build lại native.

App hiện CAPTCHA khi có site key, trừ khi backend báo đã tắt CAPTCHA (`enabled: false`). Sau mỗi lần đăng nhập thất bại, app tự tải ảnh mã mới vì token chỉ dùng một lần. Nếu backend từ chối token, log backend ghi `WAU Captcha rejected: ...` kèm verdict và hostname để chẩn đoán.

**Chạy trên điện thoại / emulator Android:** `localhost` trong `.env` là chính thiết bị, nên phải chuyển cổng backend sang thiết bị (mỗi lần cắm lại máy):

```bash
cd apps/mobile
pnpm android:reverse   # adb reverse cho 8081 (Metro), 3000 (backend), 3001
pnpm android
```

Lưu ý `apps/mobile/.env` đang khai báo `NEXT_PUBLIC_API_URL` hai lần; dòng sau (`http://localhost:3000`) được dùng.
