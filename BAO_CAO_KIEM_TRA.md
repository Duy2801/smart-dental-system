# Báo cáo kiểm tra toàn diện – Smart Dental System

**Ngày kiểm tra:** 20/11/2026 · **Commit:** `dc673c9` (nhánh `main`)

**Phạm vi:** cả 5 app trong monorepo: `backend` (NestJS), `frontend-patient` (Next.js), `frontend-admin-receptionist-doctor` (Next.js), `mobile` (React Native), `ai-service` (FastAPI). Tổng khoảng 140.000 dòng code.

**Cách kiểm tra:**
1. Chạy type-check, lint, unit test và build production cho từng app.
2. Phân tích code chết bằng script dựng đồ thị import (dùng TypeScript compiler), rồi grep lại từng kết quả để loại kết quả báo nhầm.
3. Liệt kê toàn bộ 184 route backend kèm guard/role để rà phân quyền.
4. Chạy thử giao diện thật bằng Playwright (Chromium) trên bản build production. Mỗi trang được test ở 2 kích thước (desktop 1366px, mobile 390px), có ảnh chụp, kiểm tra lỗi console, link chết, ảnh hỏng, tràn ngang. Chạy 2 lượt: khi backend không có mặt và khi đọc dữ liệu thật (chỉ request GET; mọi POST/PATCH/DELETE bị chặn ngay trong trình duyệt, không ghi gì vào hệ thống).
5. Đọc code các luồng quan trọng: auth, phân quyền, đặt lịch, thanh toán, hoàn tiền, tư vấn video, AI agent, upload, email, cron.

---

## ✅ KẾT QUẢ XỬ LÝ (cập nhật 20/11/2026)

Các mục bên dưới đã được sửa trong working tree, **chưa commit**. Kiểm tra sau khi sửa:

| Hạng mục | Trước | Sau |
|---|---|---|
| Backend type-check | 0 lỗi | ✅ 0 lỗi |
| Backend test | 179/179 | ✅ **183/183** (thêm test cho rate-limit và hoàn tiền) |
| Admin test | 90/90 | ✅ 90/90 |
| Patient test | không chạy được qua script | ✅ `npm run test` 1/1 |
| Mobile test | ❌ crash | ✅ **5/5** |
| Mobile lint | ❌ crash | ✅ 0 error |
| Backend lint | 1.396 vấn đề | 1.164 (đã hết lỗi thật; còn lại là `any` và format ở file chưa đụng tới) |
| Patient / Admin lint (error) | 49 / 41 | 41 / 39 (còn lại là rule React hooks, xem J) |
| Build production 2 frontend | OK | ✅ OK |
| Test giao diện các trang vừa sửa (Playwright, desktop + mobile) | – | ✅ **32/32** |

### Đã sửa
| Mục | Nội dung sửa |
|---|---|
| **E.1** | Tách `DoctorController` (công khai, chỉ đọc) và `AdminDoctorController` (`/admin/doctors`, bắt buộc đăng nhập; tạo/sửa/khoá chỉ ADMIN). Phát hiện thêm: tham số `isStaff` trước đây bị truyền nhầm vào chỗ `allowDraft` |
| **E.2** | `POST /payments` với `method: CASH` → 403 nếu không phải lễ tân/admin |
| **E.3** | Mọi route chatbot của AI service bắt buộc `x-api-key` (gom 3 bản `require_api_key` trùng nhau vào [security.py](apps/ai-service/app/api/security.py)). Mobile bỏ nhánh gọi thẳng AI service. Backend chỉ nhận `patientId` nếu hồ sơ đó thuộc người đang đăng nhập |
| **E.4** | Bỏ fallback `'dev-local-key'` ở backend, AI service, mobile và workflow; key rỗng hoặc bằng `dev-local-key` bị từ chối. Đã sinh **key ngẫu nhiên mới** cho `.env` local của backend và ai-service (bản sao `.env` cũ nằm trong thư mục scratchpad) |
| **E.5, F.9, F.10** | `GET /doctors`, `/clinical-cases` chỉ trả tên/ảnh, không còn email/SĐT/tài khoản. `GET /reviews` công khai luôn chỉ trả đánh giá đang hiển thị (quản lý qua `/admin/reviews`, có guard) |
| **E.6** | Đăng ký lại một email chưa xác thực sẽ ghi đè mật khẩu/họ tên, và dùng chung giới hạn gửi OTP |
| **F.1** | Access token Google được kiểm tra `aud`/`azp` qua `tokeninfo`; bắt buộc `email_verified` |
| **F.2** | OTP khoá sau 5 lần sai, sinh bằng `crypto.randomInt`. Thêm [RateLimitGuard](apps/backend/src/common/guards/rate-limit.guard.ts) (Redis, theo IP) cho đăng nhập, đăng ký, OTP, quên/đặt lại mật khẩu, Google, chatbot |
| **F.3** | Job bác sĩ vắng mặt: bỏ điều kiện `meetingUrl: null` sai, gắn `invoiceId`, báo cho bệnh nhân. API mới `PATCH /refund-requests/:id/bank-account` + nút "Cập nhật STK nhận hoàn tiền" / "Nhận hoàn tiền 100%" trên web. Lễ tân không thể bấm "đã hoàn tiền" khi chưa có STK |
| **F.4** | Từ chối hoàn tiền thì tự khôi phục lịch tư vấn (nếu chưa qua giờ và bác sĩ còn trống) |
| **F.5** | Email nhắc thanh toán tạo/cập nhật payment PENDING khớp với QR |
| **F.6** | Webhook SePay tìm payment theo mã ngay trong DB |
| **F.7** | Kiểm tra phạm vi mã khuyến mãi khi thanh toán. Mã nhập lúc đặt lịch được ghi vào ghi chú lịch hẹn cho lễ tân *(xem "chưa xử lý")* |
| **F.8, G.17** | Thêm [vn-time.ts](apps/backend/src/common/vn-time.ts); kiểm tra xung đột ca làm, "hôm nay" của chatbot, ngày kế hoạch điều trị dùng giờ VN |
| **G.1** | Không cho đổi email đăng nhập qua `PATCH /patients/me`; ô email trên web và mobile chuyển sang chỉ đọc |
| **G.2, G.3** | Bác sĩ không chuyển ca sang bác sĩ khác được; đổi giờ thì ca quay về PENDING; ca nghỉ khi sửa cũng được kiểm tra; validate `approvalStatus` |
| **G.4** | Lễ tân không đổi lịch về quá khứ được |
| **G.6** | [daily-code.ts](apps/backend/src/common/daily-code.ts): mã APT/INV dùng ngày VN, số thứ tự lấy bằng Redis INCR (không trùng khi tạo đồng thời), gom 5 bản sao hàm thành 1 |
| **G.8** | `markPaid` kiểm tra payment còn PENDING sau khi khoá hoá đơn: webhook gửi lại không ghi nhận/gửi email lần 2 |
| **G.9** | `escapeHtml` cho tên, lý do, ghi chú, chẩn đoán… trong 49 chỗ của email HTML |
| **G.10** | `payment_updated` chỉ gửi cho chủ hoá đơn + nhân viên (**trước đây mọi bệnh nhân online đều hiện toast "Thanh toán thành công!"** khi người khác trả tiền); bỏ `meetingUrl` khỏi broadcast |
| **G.11** | Ngày khuyến mãi hiểu theo giờ VN (00:00 → 23:59:59); form admin hiển thị đúng ngày |
| **G.13** | Job nền ghi log lỗi thay vì nuốt im lặng |
| **G.16** | File đính kèm hỗ trợ chỉ nhận ảnh/PDF/Word/Excel/TXT (backend + `accept` ở 2 giao diện) |
| **G.18** | `booking-options` bỏ qua giá trị sai định dạng trước khi dùng làm key cache |
| **D.1–D.5** | Trang [/reset-password](apps/frontend-patient/src/app/(auth)/reset-password/page.tsx); trang quên mật khẩu admin gọi API thật; sửa link email kế hoạch điều trị (`/records`) và nhắc tái khám (`/appointment`); trang [/contact](apps/frontend-patient/src/app/(dashboard)/contact/page.tsx) |
| **D.6, D.7** | Cài `@react-native/jest-preset@0.86.0`; thay test mẫu không chạy được bằng test validate/thông báo lỗi; thêm script `test` cho patient |
| **H.1, H.8, H.17** | Bỏ `JWT_SECRET \|\| 'secretKey'`; chặn open redirect `/\`; title trang ưu đãi không lặp tên |
| **I** | Xoá 61 file code chết + 5 hàm API xoá còn sót. Sửa toàn bộ lỗi lint thật của backend và mobile; `bootstrap()` có `.catch` |

### ⚠️ Việc bạn cần làm trước/khi deploy
1. **Đặt `AI_SERVICE_API_KEY` (cùng một chuỗi ngẫu nhiên, ví dụ `openssl rand -hex 32`) cho cả backend production và AI service trên Vercel.** Nếu thiếu, mọi tính năng AI sẽ trả 401/503. Đây là chủ ý, để không còn chạy với key đã lộ. Có thể copy giá trị trong `.env` local mới.
2. Kiểm tra backend production có `GOOGLE_CLIENT_ID`/`GOOGLE_WEB_CLIENT_ID`/`GOOGLE_MOBILE_CLIENT_ID` (thiếu thì đăng nhập Google bị tắt) và `JWT_SECRET` (socket giờ bắt buộc có).
3. Nginx phải chuyển header `X-Forwarded-For` (mặc định thường đã có), để giới hạn tần suất tính theo IP thật.
4. Build lại app mobile (đã xoá key hard-code).

### Chưa xử lý (cần bạn quyết định hoặc ngoài phạm vi sửa nhanh)
- **F.7 (phần còn lại):** lưu mã khuyến mãi vào lịch hẹn và tự áp vào hoá đơn cần **thêm cột DB (migration production)**.
- **Mobile:** chưa có nút cập nhật STK nhận hoàn tiền (web đã có, API đã sẵn).
- G.5 (race đổi lịch), G.7 (gửi trùng email khi lễ tân tạo lịch), G.12 (race tạo hoá đơn tư vấn), G.14 (nhắc lịch khám tự động là chức năng mới), G.15 (phân trang hoá đơn, cần sửa cả API lẫn UI).
- H.2 CORS whitelist (cần danh sách domain production chính xác), H.3 STK fallback, H.4 Jitsi riêng, H.5 cách lưu token, H.6 body limit, H.7, H.9 keystore release, H.11 phạm vi xem bệnh nhân của bác sĩ, H.12–H.14, H.15 nội dung chứng nhận ở trang chủ, H.16 tên thương hiệu, H.18 `next/image`.
- Lint React hooks (`set-state-in-effect`, gọi `Date.now()` khi render) ở 2 frontend: sửa từng component có rủi ro đổi hành vi, nên làm riêng.

---

## Mục lục
- [A. Kết quả chạy tự động](#a-kết-quả-chạy-tự-động)
- [B. Kết quả test giao diện](#b-kết-quả-test-giao-diện)
- [C. Tóm tắt lỗi](#c-tóm-tắt-lỗi)
- [D. Chức năng đang hỏng (đã chạy thử xác nhận)](#d-chức-năng-đang-hỏng-đã-chạy-thử-xác-nhận)
- [E. 🔴 Lỗi nghiêm trọng](#e--lỗi-nghiêm-trọng)
- [F. 🟠 Lỗi mức cao](#f--lỗi-mức-cao)
- [G. 🟡 Mức trung bình – xử lý chưa hợp lý](#g--mức-trung-bình--xử-lý-chưa-hợp-lý)
- [H. 🟢 Mức thấp / cấu hình / giao diện](#h--mức-thấp--cấu-hình--giao-diện)
- [I. Code dư thừa](#i-code-dư-thừa)
- [J. Chất lượng code (lint)](#j-chất-lượng-code-lint)
- [K. Thứ tự ưu tiên sửa](#k-thứ-tự-ưu-tiên-sửa)
- [L. Giới hạn của lần kiểm tra này](#l-giới-hạn-của-lần-kiểm-tra-này)

---

## A. Kết quả chạy tự động

| App | Type-check (`tsc`) | Lint | Unit test | Build production |
|---|---|---|---|---|
| backend | ✅ 0 lỗi | ❌ 1.396 vấn đề (1.362 error). Chủ yếu là format prettier và `no-unsafe-*` do dùng `any`; xem [mục J](#j-chất-lượng-code-lint) | ✅ 35/35 suite, 179/179 test | – (không build vì cần DB) |
| frontend-patient | ✅ 0 lỗi | ❌ 110 vấn đề (49 error, 61 warning) | ✅ 1/1 test. App **không có script `test`**, phải chạy tay `node --test tests/...` | ✅ Build OK, 23 route |
| frontend-admin | ✅ 0 lỗi sau khi build lại. Lần chạy đầu báo 1 lỗi vì `.next/types` cũ còn tham chiếu trang `admin/reports` đã xoá | ❌ 72 vấn đề (41 error, 31 warning) | ✅ 28/28 file, 90/90 test | ✅ Build OK, 44 route |
| mobile | ✅ 0 lỗi | ❌ **ESLint crash**, không chạy được: `@babel/eslint-parser` xung đột phiên bản `eslint-scope` | ❌ **Jest không chạy được**: `Preset @react-native/jest-preset not found`. RN 0.86 đã tách preset ra package riêng nhưng `package.json` chưa thêm vào devDependencies | – |
| ai-service | – | – | ⚠️ Không chạy được trên máy này: `.venv` trỏ tới `Python312`, bản Python này đã bị gỡ khỏi máy. Lỗi do môi trường, không phải do code | – |

> **Lưu ý quan trọng:** tất cả test hiện có đều pass, nhưng **không test nào bắt được các lỗi ở mục D–G**. Hầu hết lỗi nằm ở phân quyền, múi giờ và logic nghiệp vụ, những phần chưa có test.

Khi build, `frontend-patient` có cảnh báo: trang `/home` dùng ISR và gọi API ngay lúc build (`ECONNREFUSED localhost:3000`). Nếu backend không chạy lúc build, trang chủ sẽ được prerender với dữ liệu rỗng cho tới lần revalidate đầu tiên (10 phút).

---

## B. Kết quả test giao diện

**Đã test:** 23 đường dẫn của app bệnh nhân và 8 đường dẫn của app admin, mỗi đường dẫn × 2 kích thước màn hình, tổng 62 lượt tải trang, kèm crawl toàn bộ link nội bộ.

| Hạng mục | Kết quả |
|---|---|
| Trang công khai (home, dịch vụ, bác sĩ, ưu đãi, đăng nhập, đăng ký, điều khoản…) | ✅ Tải được, có dữ liệu thật, **không có lỗi JavaScript runtime**, không ảnh hỏng, **không tràn ngang** trên mobile 390px |
| Trang cần đăng nhập (`/records`, `/appointment`, `/profile`, `/payment`…) khi chưa đăng nhập | ✅ Hiện thẻ "Cần đăng nhập" kèm nút đăng nhập, có `?redirect=` quay lại đúng trang |
| Khi backend sập | ✅ Không trắng trang. Footer hiện "Chưa cập nhật", không crash |
| App admin: mọi trang `/admin`, `/doctor`, `/receptionist` khi chưa đăng nhập | ✅ Middleware chuyển về `/login?callbackUrl=...` đúng |
| Link chết | ❌ `/contact` trả **404** (xem D.5) |
| Đường dẫn trong email | ❌ `/reset-password`, `/dashboard/treatment-plans`, `/booking` đều **404** (xem D.1, D.3, D.4) |
| Khả năng truy cập | ⚠️ Ô tìm kiếm ở `/doctors` không có label (chỉ có placeholder); `/home` không có thẻ `<h1>` |
| SEO | ⚠️ Hầu hết trang có `<title>` chung "Smart Dental System". Title trang ưu đãi bị lặp: "… \| Smart Dental \| Smart Dental System" |

Ảnh chụp màn hình và file kết quả JSON nằm ở thư mục scratchpad của phiên kiểm tra (tạm thời, không nằm trong repo).

---

## C. Tóm tắt lỗi

| Mức độ | Số lượng | Ý nghĩa |
|---|---|---|
| ❌ Chức năng đang hỏng | 7 | Đã chạy thử và xác nhận người dùng gặp lỗi |
| 🔴 Nghiêm trọng | 6 | Có thể khai thác ngay: chiếm tài khoản, gian lận thanh toán, mạo danh qua AI, lộ dữ liệu |
| 🟠 Cao | 10 | Sai logic gây mất tiền hoặc sai lịch, hoặc lỗ hổng cần điều kiện |
| 🟡 Trung bình | 19 | Xử lý chưa hợp lý, race condition, sai múi giờ, thiếu validate |
| 🟢 Thấp / cải thiện | 18 | Cấu hình, hiệu năng, giao diện, nội dung |
| 🧹 Code dư thừa | 13 + 32 + 10 + 6 file | File không được import ở đâu, xem [mục I](#i-code-dư-thừa) |

---

## D. Chức năng đang hỏng (đã chạy thử xác nhận)

### D.1. ❌ Quên mật khẩu không dùng được ở bất kỳ app nào
- **Backend** gửi email chứa link `${FRONTEND_URL}/reset-password?token=...` ([mail.service.ts:114](apps/backend/src/modules/mail/mail.service.ts#L114)).
- **App bệnh nhân không có trang `/reset-password`.** Đã mở thử: **404**. Cũng không có màn hình nào gọi `POST /auth/reset-password`. Người dùng nhận email, bấm link và gặp trang lỗi.
- **Sửa:** tạo `app/(auth)/reset-password/page.tsx`. Trang này đọc `token` từ URL và gọi `POST /auth/reset-password { token, newPassword }`.

### D.2. ❌ Trang "Quên mật khẩu" của admin/lễ tân/bác sĩ chỉ có giao diện
- [forgot-password/page.tsx:13](apps/frontend-admin-receptionist-doctor/src/app/(auth)/forgot-password/page.tsx#L13): `<form>` không có `onSubmit`, không gọi API. Bấm "Gửi" chỉ reload trang và đưa email lên URL (`?email=...`).
- Ngay cả khi gọi API, link trong email vẫn trỏ về `FRONTEND_URL` là domain của app bệnh nhân, không phải app nhân viên.

### D.3. ❌ Email "Kế hoạch điều trị" có nút dẫn tới trang 404
- [mail.service.ts:1197](apps/backend/src/modules/mail/mail.service.ts#L1197): link `${frontendUrl}/dashboard/treatment-plans`. Route group `(dashboard)` của Next.js không xuất hiện trong URL, và trang kế hoạch điều trị thật là `/records`. Đã mở thử: **404**.

### D.4. ❌ Email nhắc tái khám định kỳ trỏ về `http://localhost:3000/booking`
- [mail.service.ts:872](apps/backend/src/modules/mail/mail.service.ts#L872) hard-code `localhost:3000`, đây lại là cổng **backend**. Route `/booking` cũng không tồn tại; trang đặt lịch là `/appointment`. Mọi bệnh nhân nhận email này đều bấm vào link chết.
- **Sửa:** `${this.config.frontendUrl}/appointment`.

### D.5. ❌ Link "Hỗ trợ" dẫn tới trang 404
- `ROUTES.contact = "/contact"` ([routes.ts:35](apps/frontend-patient/src/features/dashboard/common/routes.ts#L35)) được dùng ở footer mọi trang ([routes.ts:53](apps/frontend-patient/src/features/dashboard/common/routes.ts#L53)) và trong trang thanh toán ([BillingSupport.tsx:19](apps/frontend-patient/src/features/dashboard/payment/components/BillingSupport.tsx#L19)). App không có trang `/contact`. Crawler xác nhận **404**.

### D.6. ❌ Test và lint của mobile không chạy được
- [jest.config.js](apps/mobile/jest.config.js) dùng preset `@react-native/jest-preset` nhưng package này chưa được cài. Cần `pnpm add -D @react-native/jest-preset@0.86.0` trong `apps/mobile`.
- `eslint .` crash ngay khi load parser, do hai phiên bản `eslint-scope` không khớp nhau.

### D.7. ❌ App bệnh nhân không có script `test`
- File [tests/homeSearchSuggestions.test.mjs](apps/frontend-patient/tests/homeSearchSuggestions.test.mjs) có tồn tại, nhưng `package.json` không có `"test"`, nên `turbo`/CI không bao giờ chạy test này.

---

## E. 🔴 Lỗi nghiêm trọng

### E.1. API quản lý Bác sĩ KHÔNG có xác thực (ai cũng tạo/sửa/xoá được bác sĩ)
- **File:** [doctor.controller.ts:45-58](apps/backend/src/modules/doctor/doctor.controller.ts#L45-L58)
- `POST /doctors`, `PATCH /doctors/:id`, `DELETE /doctors/:id` không có `@UseGuards(JwtAuthGuard, RolesGuard)` hay `@Roles('ADMIN')`. Đã xác nhận bằng script quét toàn bộ 184 route: đây là **3 route ghi duy nhất không có guard** (ngoài auth và webhook).
- **Hậu quả:**
  - Người lạ gọi `POST /api/v1/doctors` với email/mật khẩu tự chọn là có tài khoản **DOCTOR** (`emailVerified: true`, `ACTIVE`). Từ đó vào được trang bác sĩ, xem bệnh án, kê đơn.
  - `PATCH /api/v1/doctors/:id` với `{ "password": "..." }` → **chiếm tài khoản của bất kỳ bác sĩ nào** ([doctor.service.ts:287-298](apps/backend/src/modules/doctor/doctor.service.ts#L287-L298)).
  - `DELETE` → vô hiệu hoá toàn bộ bác sĩ.
- **Sửa:** thêm `@Roles('ADMIN') @UseGuards(JwtAuthGuard, RolesGuard)` cho 3 route ghi.

### E.2. Bệnh nhân tự đánh dấu hoá đơn "đã thanh toán tiền mặt"
- **File:** [payment.controller.ts:69-81](apps/backend/src/modules/payment/payment.controller.ts#L69-L81), [payment.service.ts:145-155](apps/backend/src/modules/payment/payment.service.ts#L145-L155)
- `POST /payments` cho phép role `PATIENT` và chấp nhận `method: 'CASH'`. Với CASH, service gọi thẳng `markPaid()`: hoá đơn chuyển `PAID`, lịch hẹn chuyển `COUNTER_PAID`, buổi tư vấn video chuyển `SCHEDULED` + `isPaid: true`.
- **Hậu quả:** bệnh nhân không cần trả tiền mà vẫn được ghi nhận đã thanh toán.
- **Sửa:** chỉ cho phép `CASH` khi người gọi là nhân viên.

### E.3. AI service cho mạo danh bất kỳ người dùng nào (MỚI)
- **File:** [ai-service chatbot.py:13-24](apps/ai-service/app/api/routes/chatbot.py#L13-L24), [booking_agent.py:1278](apps/ai-service/app/services/booking_agent.py#L1278), [booking_agent.py:1942](apps/ai-service/app/services/booking_agent.py#L1942)
- `POST /api/v1/chatbot/chat` và `/agent-chat` của AI service **không có `require_api_key`**, trong khi các router doctor, vision, admin đều có. AI service được deploy công khai tại `https://smart-dental-system-ai-service.vercel.app`; app mobile còn gọi thẳng vào đó ([mobile ai/api.ts:96](apps/mobile/src/features/ai/api.ts#L96)).
- Agent **tin trường `created_by_user_id` trong body** rồi dùng API key nội bộ của chính nó để gọi backend:
  - `fetch_patient_profiles(created_by_user_id)` đọc hồ sơ người thân của user đó;
  - `fetch_user_appointments(created_by_user_id)` đưa danh sách lịch hẹn (mã, tên bệnh nhân, bác sĩ, giờ) vào câu trả lời;
  - `execute_book_appointment(...)` và `create_patient_profile(...)` **đặt lịch và tạo hồ sơ thay người đó**.
- User ID (UUID) không khó lấy: các API công khai `GET /doctors` và `GET /clinical-cases` đều trả `user.id` của bệnh nhân (xem E.5, F.9).
- **Hậu quả:** chỉ cần biết UUID là đọc được lịch hẹn và hồ sơ gia đình, hoặc đặt lịch giả dưới tên người khác, mà **không cần đăng nhập**.
- **Sửa:** bắt buộc `x-api-key` cho mọi route chatbot của AI service. Để backend là bên duy nhất truyền `created_by_user_id` (lấy từ JWT). Bỏ nhánh "gọi trực tiếp AI service" trong mobile.

### E.4. API key nội bộ đang là `dev-local-key`, và giá trị này nằm công khai trong app mobile (MỚI, cần kiểm tra production)
- `apps/ai-service/.env` đặt `AI_SERVICE_API_KEY` **đúng bằng `dev-local-key`**. `apps/backend/.env` **không đặt** biến này, nên backend dùng fallback `'dev-local-key'` ([internal-api-key.guard.ts:21](apps/backend/src/common/guards/internal-api-key.guard.ts#L21), [ai-client.service.ts:17](apps/backend/src/modules/ai/ai-client.service.ts#L17)).
- App mobile hard-code header `'x-api-key': 'dev-local-key'` ([mobile ai/api.ts:101](apps/mobile/src/features/ai/api.ts#L101)), nên ai giải nén APK cũng thấy. Giá trị này cũng nằm trong repo.
- Phần kiểm tra an toàn ở [config.py:60-68](apps/ai-service/app/config.py#L60-L68) chỉ chạy khi `NODE_ENV=production`, mà biến này thường không được đặt trên Vercel.
- **Nếu production dùng cùng cấu hình:** ai cũng gọi được các endpoint nội bộ của backend như `GET /chatbot-conversations/internal/patients?userId=...`, `/internal/appointments?userId=...`, `POST /internal/book`, `POST /internal/patients`. Đây là đường đọc và ghi dữ liệu bệnh nhân không cần đăng nhập.
- **Sửa:** sinh key ngẫu nhiên dài (`openssl rand -hex 32`) cho cả hai service, đổi fallback thành `getOrThrow`, xoá key khỏi mobile.

### E.5. API công khai `GET /doctors` làm lộ thông tin cá nhân của bệnh nhân và bác sĩ
- **File:** [doctor.service.ts:48-81](apps/backend/src/modules/doctor/doctor.service.ts#L48-L81)
- `includeDoctorRelations()` trả `user` đầy đủ của bác sĩ (email, phone, googleId, role…) và `reviews → patient → include: { user: true }`, tức là **email, SĐT, ngày sinh, địa chỉ của bệnh nhân đã đánh giá**. API này không cần đăng nhập.
- `sanitizeResponse` ([sanitize-response.ts](apps/backend/src/common/interceptors/sanitize-response.ts)) chỉ xoá `passwordHash`, các trường khác vẫn trả ra.
- **Sửa:** dùng `select` chỉ những trường công khai.

### E.6. Chiếm trước tài khoản qua luồng đăng ký (account pre-hijacking)
- **File:** [auth.service.ts:139-150](apps/backend/src/modules/auth/auth.service.ts#L139-L150)
- Kẻ xấu đăng ký trước bằng email của nạn nhân với mật khẩu của kẻ xấu. Khi nạn nhân đăng ký thật, hệ thống chỉ gửi lại OTP, **không cập nhật mật khẩu mới**. Nạn nhân nhập OTP xong, tài khoản được kích hoạt với **mật khẩu của kẻ xấu**.
- Nhánh này cũng bỏ qua giới hạn `MAX_RESEND`, nên có thể bị dùng để spam email OTP.
- **Sửa:** khi đăng ký lại một user chưa verify, cập nhật `passwordHash`/`fullName` và áp rate-limit.

---

## F. 🟠 Lỗi mức cao

### F.1. Đăng nhập Google chấp nhận access token của ứng dụng khác
- [auth.service.ts:557-600](apps/backend/src/modules/auth/auth.service.ts#L557-L600): token `ya29.*` chỉ được kiểm tra bằng `userinfo`, **không kiểm tra audience/client_id**. Hệ thống tự liên kết tài khoản theo email kể cả khi `email_verified = false` (dòng 634, mặc định `?? true`).
- **Sửa:** gọi `tokeninfo` để kiểm tra `aud`/`azp`; từ chối khi `email_verified !== true`.

### F.2. OTP 6 số dò được, cả hệ thống không có rate-limit
- [auth.service.ts:408-416](apps/backend/src/modules/auth/auth.service.ts#L408-L416): không đếm số lần nhập sai. Không có `ThrottlerModule`, nên `login` của nhân viên, `forgot-password`, `verify-otp`, `public-chat`, `public-agent-chat` (tốn tiền gọi LLM) đều bị gọi liên tục được.
- `generateOtp()` dùng `Math.random()`.
- **Sửa:** khoá OTP sau khoảng 5 lần sai, dùng `crypto.randomInt`, thêm `@nestjs/throttler`.

### F.3. Hoàn tiền khi "bác sĩ vắng mặt" không bao giờ xử lý xong và có thể không được tạo
- [video-consultation.service.ts:278-313](apps/backend/src/modules/video-consultation/video-consultation.service.ts#L278-L313):
  - (a) Điều kiện `meetingUrl: null` sai, vì `meetingUrl` được gán ngay khi bệnh nhân vào phòng chờ hoặc khi gửi nhắc lịch.
  - (b) RefundRequest tự động **không có `invoiceId`**, nên `processRefund` luôn ném `refund.invoice_not_found` ([refund.service.ts:305](apps/backend/src/modules/refund/refund.service.ts#L305)).
  - (c) Số tài khoản nhận hoàn tiền chỉ là placeholder, và **không có API cho bệnh nhân cập nhật**.

### F.4. Gửi yêu cầu hoàn tiền là huỷ luôn lịch, bị từ chối thì không khôi phục
- [refund.service.ts:169-175](apps/backend/src/modules/refund/refund.service.ts#L169-L175): consultation chuyển `CANCELLED` ngay khi gửi yêu cầu. Nếu bị REJECTED, bệnh nhân mất cả lịch lẫn tiền.

### F.5. Email nhắc thanh toán có QR nhưng chuyển khoản theo QR đó không được ghi nhận
- [payment.service.ts:656-700](apps/backend/src/modules/payment/payment.service.ts#L656-L700): hàm tạo QR nhưng **không tạo Payment PENDING**, nên webhook không có gì để khớp.

### F.6. Webhook SePay chỉ xét 50 payment PENDING mới nhất
- [payment.service.ts:319-327](apps/backend/src/modules/payment/payment.service.ts#L319-L327): `take: 50` rồi `find` trong bộ nhớ. Payment PENDING không bao giờ hết hạn, nên giao dịch cũ hơn sẽ bị bỏ sót.

### F.7. Khuyến mãi bị bỏ qua hoặc áp sai phạm vi
- Lúc đặt lịch, [appointment.service.ts:1948-1954](apps/backend/src/modules/appointment/appointment.service.ts#L1948-L1954) chỉ kiểm tra mã rồi bỏ đi. Chatbot vẫn trả `appliedPromotionCode` ([chatbot-conversation.service.ts:489-515](apps/backend/src/modules/chatbot-conversation/chatbot-conversation.service.ts#L489-L515)), nên bệnh nhân tưởng đã được giảm giá.
- Lúc thanh toán, `applyPromotion` ([payment.service.ts:733-760](apps/backend/src/modules/payment/payment.service.ts#L733-L760)) không kiểm tra mã có áp dụng cho dịch vụ đó không.

### F.8. Kiểm tra xung đột khi đổi ca làm việc bác sĩ bị lệch 7 tiếng (MỚI)
- **File:** [doctor-availability.service.ts:99-101](apps/backend/src/modules/doctor-availability/doctor-availability.service.ts#L99-L101) và [146-153](apps/backend/src/modules/doctor-availability/doctor-availability.service.ts#L146-L153)
- Ca làm lưu theo giờ VN (`"08:00"`). Nhưng:
  - nhánh theo ngày cụ thể tạo `new Date("${date}T08:00:00.000Z")`, tức là coi giờ VN là UTC (08:00Z = 15:00 VN);
  - nhánh theo tuần so `scheduledAt.toISOString().slice(11,16)` (giờ UTC) và `getUTCDay()` với giờ VN. Riêng `main.ts` lại đặt `TZ=Asia/Ho_Chi_Minh`.
- **Ví dụ:** có lịch hẹn 9h sáng (02:00 UTC), admin xoá hoặc đổi ca sáng 08:00–12:00, hệ thống báo **"không có xung đột"**. Ngược lại, lịch 15h lại bị báo trùng với ca sáng.
- **Hậu quả:** bỏ ca mà không biết còn bệnh nhân đã đặt lịch.
- **Sửa:** quy đổi giờ VN sang UTC trước khi so (hoặc so bằng `Intl.DateTimeFormat` với `timeZone: 'Asia/Ho_Chi_Minh'`).

### F.9. `GET /clinical-cases` công khai trả toàn bộ thông tin tài khoản của bệnh nhân (MỚI)
- [clinical-case.service.ts:16-20](apps/backend/src/modules/clinical-case/clinical-case.service.ts#L16-L20): `patient: { include: { user: true } }` và `doctor: { include: { user: true } }`. Bệnh nhân chỉ đồng ý công khai **ca điều trị** (`patientConsentPublic`), không đồng ý công khai **email, SĐT, googleId, user.id**.
- `limit` lấy từ query mà không có giới hạn trên (`?limit=100000`).

### F.10. `GET /reviews` công khai trả cả những đánh giá admin đã ẩn (MỚI)
- [review.service.ts:12-20](apps/backend/src/modules/review/review.service.ts#L12-L20): `visibility` mặc định `'ALL'`, và route `GET /reviews` (cùng alias `/admin/reviews`) không có guard. Đánh giá bị ẩn vì xúc phạm hay spam vẫn lấy được, kèm họ tên bệnh nhân. Người gọi còn tự truyền được `?visibility=HIDDEN`.
- **Sửa:** khi người gọi không phải nhân viên, luôn ép `isVisible: true`.

---

## G. 🟡 Mức trung bình – xử lý chưa hợp lý

| # | Vấn đề | Vị trí | Ghi chú / cách sửa |
|---|---|---|---|
| G.1 | Bệnh nhân **đổi email đăng nhập không cần OTP** | [patient.service.ts:800](apps/backend/src/modules/patient/patient.service.ts#L800) | Cần flow xác nhận email mới. |
| G.2 | Bác sĩ sửa ca: đổi được `doctorId` và **không bị đưa về PENDING** | [doctor-availability.service.ts:304-364](apps/backend/src/modules/doctor-availability/doctor-availability.service.ts#L304-L364) | Ca đã duyệt bị kéo dài mà không cần duyệt lại. |
| G.3 | `PATCH /doctor-availability/:id/approval` không validate enum | [doctor-availability.controller.ts:89](apps/backend/src/modules/doctor-availability/doctor-availability.controller.ts#L89) | Gửi giá trị lạ → lỗi 500. |
| G.4 | Lễ tân đổi lịch về **thời điểm trong quá khứ** | [appointment.service.ts:674-700](apps/backend/src/modules/appointment/appointment.service.ts#L674-L700) | Thiếu check `scheduledAt <= now`. |
| G.5 | Race condition: bệnh nhân đổi lịch nhiều hơn 1 lần | [appointment.service.ts:254-260](apps/backend/src/modules/appointment/appointment.service.ts#L254-L260) | Đọc giới hạn ngoài transaction. |
| G.6 | Sinh mã `APT-/INV-yyyyMMdd-xxxx` bằng `count+1` và ngày UTC | [appointment.service.ts:3015-3046](apps/backend/src/modules/appointment/appointment.service.ts#L3015-L3046), [patient.service.ts:1770-1778](apps/backend/src/modules/patient/patient.service.ts#L1770-L1778), [treatment-plan.service.ts:614](apps/backend/src/modules/treatment-plan/treatment-plan.service.ts#L614) | Đặt đồng thời bị trùng mã (500). Từ 0h đến 7h sáng, prefix mang ngày hôm trước. |
| G.7 | Gửi **trùng email và thông báo** khi lễ tân tạo lịch | [appointment.service.ts:159-194](apps/backend/src/modules/appointment/appointment.service.ts#L159-L194), [2049](apps/backend/src/modules/appointment/appointment.service.ts#L2049) | Lịch còn `PENDING` mà thông báo đã ghi "đã xác nhận". |
| G.8 | `markPaid` chạy 2 lần (webhook retry + lễ tân confirm cùng lúc) | [payment.service.ts:403-500](apps/backend/src/modules/payment/payment.service.ts#L403-L500) | `usedCount` khuyến mãi tăng 2 lần, gửi 2 biên lai. |
| G.9 | **Email HTML không escape tên người dùng** | [mail.service.ts:93](apps/backend/src/modules/mail/mail.service.ts#L93) và các template khác | Có thể nhúng HTML hoặc link lừa đảo vào email gửi từ domain phòng khám. |
| G.10 | Socket `broadcast` gửi thanh toán và **meetingUrl** cho mọi client | [payment.service.ts:582-584](apps/backend/src/modules/payment/payment.service.ts#L582-L584), [video-consultation.service.ts:1748](apps/backend/src/modules/video-consultation/video-consultation.service.ts#L1748) | Người lạ kết nối socket là vào được phòng tư vấn. |
| G.11 | **Khuyến mãi hết hạn lúc 7h sáng ngày cuối** (MỚI) | [promotion.service.ts:137-138](apps/backend/src/modules/promotion/promotion.service.ts#L137-L138), [176-177](apps/backend/src/modules/promotion/promotion.service.ts#L176-L177) | Admin chọn ngày `2026-11-30`, backend lưu `new Date('2026-11-30')` = 00:00 UTC = **07:00 VN**. Khuyến mãi bắt đầu muộn 7 tiếng và kết thúc sớm 17 tiếng. Nên lưu `endDate` là 23:59:59 giờ VN. |
| G.12 | **GET có tác dụng phụ** và race khi tạo hoá đơn tư vấn (MỚI) | [video-consultation.service.ts:1418](apps/backend/src/modules/video-consultation/video-consultation.service.ts#L1418) | `GET payment-info` (frontend poll mỗi 4 giây) tự tạo invoice khi chưa có. Hai request đầu chạy song song có thể tạo 2 hoá đơn. `invoiceCode = INV-VC-` + **6 số cuối của millisecond** dễ trùng (unique → 500). Dòng 847 lại dùng một cách sinh mã khác. |
| G.13 | Job nền chạy bằng `setInterval`, **lỗi bị nuốt mất** (MỚI) | [video-consultation.service.ts:184-191](apps/backend/src/modules/video-consultation/video-consultation.service.ts#L184-L191) | `.catch(() => {})` không ghi log. Job hỏng sẽ không ai biết (không hoàn tiền, không nhắc lịch). Nếu chạy hơn 1 instance thì job chạy trùng và gửi email trùng. |
| G.14 | **Lịch khám tại phòng khám không có nhắc tự động** (MỚI) | [appointment.service.ts:793](apps/backend/src/modules/appointment/appointment.service.ts#L793) | Chỉ có nút "Nhắc lịch" cho lễ tân bấm tay. Tư vấn video thì có job nhắc trước 10 phút. Đây là chức năng còn thiếu. |
| G.15 | Danh sách hoá đơn **không phân trang** (MỚI) | [invoice.service.ts:14](apps/backend/src/modules/invoice/invoice.service.ts#L14), [billing/page.tsx:333-334](apps/frontend-admin-receptionist-doctor/src/app/(dashboard)/receptionist/billing/page.tsx#L333-L334) | Mỗi lần mở trang thu ngân là tải **toàn bộ** hoá đơn đã thanh toán từ trước tới nay. Số hoá đơn càng nhiều thì trang càng chậm. |
| G.16 | File đính kèm hỗ trợ **nhận mọi loại file** (MỚI) | [support-conversation.service.ts:432-443](apps/backend/src/modules/support-conversation/support-conversation.service.ts#L432-L443) | Không whitelist MIME như ảnh bệnh án hay tài liệu nhân sự. Bệnh nhân gửi được `.exe`, `.html`, `.svg` cho lễ tân tải về. |
| G.17 | Các chỗ khác dùng ngày UTC thay vì giờ VN (MỚI) | [chatbot-conversation.service.ts:102](apps/backend/src/modules/chatbot-conversation/chatbot-conversation.service.ts#L102), [treatment-plan.service.ts:176](apps/backend/src/modules/treatment-plan/treatment-plan.service.ts#L176), [schedules/constants.ts:23](apps/frontend-admin-receptionist-doctor/src/components/admin/schedules/constants.ts#L23), [reschedulePolicy.ts:51](apps/frontend-patient/src/features/dashboard/consultation/reschedulePolicy.ts#L51), [promo-form-modal.tsx:116-121](apps/frontend-admin-receptionist-doctor/src/components/admin/promotion/components/promo-form-modal.tsx#L116-L121) | Từ 0h đến 7h sáng: chatbot coi "hôm nay" là hôm qua, form ca làm mặc định ngày hôm qua, kiểm tra ngày bắt đầu kế hoạch điều trị bị lệch một ngày. |
| G.18 | Cache `booking-options` công khai dùng giá trị query tuỳ ý làm key (MỚI) | [appointment.service.ts:1595](apps/backend/src/modules/appointment/appointment.service.ts#L1595) | Người lạ gửi hàng loạt `date`/`time` ngẫu nhiên để sinh vô hạn key Redis, tốn quota Upstash. Nên validate định dạng trước khi cache. |
| G.19 | Agent chat nhận `patientId` do client gửi (MỚI) | [chatbot-conversation.service.ts:55](apps/backend/src/modules/chatbot-conversation/chatbot-conversation.service.ts#L55) | Đặt lịch vẫn được chặn bởi `ensureUserCanBookPatient` (tốt). Nhưng `internal/patient-busy` trả giờ bận của bất kỳ `patientId` nào. Nên kiểm tra quyền sở hữu ngay từ đầu. |

---

## H. 🟢 Mức thấp / cấu hình / giao diện

**Bảo mật & cấu hình**
1. `JWT_SECRET || 'secretKey'` trong socket ([events.gateway.ts:131](apps/backend/src/modules/socket/events.gateway.ts#L131)). Nên dùng `getOrThrow`.
2. **CORS `origin: true` + `credentials: true`** ([main.ts:27-31](apps/backend/src/main.ts#L27-L31)), socket `origin: '*'`. Nên whitelist domain.
3. **Số tài khoản ngân hàng cá nhân bị hard-code** làm fallback ([payment.service.ts:770-776](apps/backend/src/modules/payment/payment.service.ts#L770-L776)).
4. Phòng video dùng **Jitsi công cộng**, không có mật khẩu (`roomPin` luôn `null`).
5. Refresh token vẫn trả trong body ([auth.controller.ts:66-72](apps/backend/src/modules/auth/auth.controller.ts#L66-L72)). Admin lưu token trong cookie JS (không httpOnly), patient lưu trong `localStorage`.
6. Body limit 50MB ([main.ts:20-21](apps/backend/src/main.ts#L20-L21)), ảnh minh chứng tới 7MB base64 lưu thẳng vào DB.
7. Thông báo lỗi đăng nhập khác nhau tuỳ trường hợp, nên dò được email nào đã đăng ký.
8. **Open redirect nhẹ** sau đăng nhập ở app bệnh nhân ([login/page.tsx:48](apps/frontend-patient/src/app/(auth)/login/page.tsx#L48)): đã chặn `//` nhưng chưa chặn `/\evil.com` (trình duyệt hiểu như `//`).
9. **APK release ký bằng `debug.keystore`** ([build.gradle:104](apps/mobile/android/app/build.gradle#L104)). Không đưa lên Play Store được, và ai có keystore debug mặc định cũng ký được bản giả.
10. Mobile `console.log` một phần Google idToken và luồng đăng nhập ([googleAuth.ts:62](apps/mobile/src/features/auth/googleAuth.ts#L62), [auth/api.ts:66](apps/mobile/src/features/auth/api.ts#L66)). Nên xoá trước khi build release.
11. Bác sĩ nào cũng xem được **toàn bộ** danh sách và chi tiết bệnh nhân (`GET /patients`, `GET /patients/:id`), không giới hạn ở bệnh nhân của mình. Cần xác nhận đây có phải yêu cầu nghiệp vụ không.

**Hiệu năng**

12. `invalidateBookingCache` chạy 5 lệnh `SCAN` toàn keyspace mỗi lần lịch đổi trạng thái ([appointment.service.ts:1393-1428](apps/backend/src/modules/appointment/appointment.service.ts#L1393-L1428)).
13. Khách chưa đăng nhập vẫn gọi `POST /auth/refresh` mỗi lần tải trang (quan sát qua Playwright): một request thừa cho mỗi lượt xem.
14. Truy vấn trùng lịch video chỉ nhìn lại 60 phút. Nếu có gói tư vấn dài hơn 60 phút sẽ bỏ sót.

**Giao diện & nội dung**

15. **Trang chủ hard-code chứng nhận không có thật**: "ISO 9001:2015", "Bộ Y Tế – Giấy phép 0123/BYT", "Top 10 Nha Khoa – Giải thưởng 2026", "10K+ khách hàng" ([home/page.tsx:60-61](apps/frontend-patient/src/app/(dashboard)/home/page.tsx#L60-L61)). Nếu chạy thật sẽ gây hiểu nhầm. Khi demo nên ghi rõ là dữ liệu mẫu.
16. **Tên thương hiệu không thống nhất** trên cùng một trang: header "Smart Dental Clinic" ([LoginForm.tsx:34](apps/frontend-patient/src/features/auth/login/LoginForm.tsx#L34) và các fallback khác), footer "Smart Dental System", bản mobile "NHA KHOA SmartDental". Dữ liệu giờ mở cửa và địa chỉ trên production không có dấu ("Thu Hai - Thu Tu", "123 Nguyen Van Linh").
17. SEO và truy cập: phần lớn trang chỉ có title chung; `/home` thiếu `<h1>`; ô tìm bác sĩ thiếu label.
18. 28 chỗ (app bệnh nhân) và 9 chỗ (app admin) dùng `<img>` thay cho `next/image` (cảnh báo `no-img-element`), làm ảnh tải chậm hơn.

---

## I. Code dư thừa

Danh sách dưới đây là các file **không được import từ bất kỳ trang hay entry nào**. Mỗi file đã được grep lại tên để chắc không có tham chiếu động. Xoá đi không ảnh hưởng chức năng.

### frontend-patient (13 file, khoảng 1.260 dòng)
| File | Dòng |
|---|---|
| `features/dashboard/records/components/PatientMedicalRecordSection.tsx` | 500 |
| `features/dashboard/promotion/components/PromotionServicesList.tsx` | 143 |
| `features/dashboard/records/components/RecordPatientHero.tsx` | 118 |
| `features/dashboard/appointment/components/workspace/AppointmentHistoryList.tsx` | 117 |
| `features/dashboard/records/components/RecordTreatmentTimeline.tsx` | 84 |
| `features/dashboard/common/PatientAccountSidebar.tsx` | 83 |
| `features/dashboard/common/colors.ts` | 70 |
| `features/dashboard/appointment/components/workspace/StatCard.tsx` | 40 |
| `features/dashboard/common/DashboardLogoutButton.tsx` | 32 |
| `features/auth/common/SecurityNotice.tsx` | 21 |
| `features/dashboard/records/components/RecordInfoChip.tsx` | 20 |
| `features/dashboard/profile/components/PatientProfileEditor.tsx` | 17 |
| `features/dashboard/appointment/components/workspace/AppointmentsEmptyState.tsx` | 14 |

Ngoài ra:
- Route **`/doctor` trùng với `/doctors`**: [doctor/page.tsx](apps/frontend-patient/src/app/(dashboard)/doctor/page.tsx) chỉ re-export trang `/doctors`. Hai URL cùng nội dung, nên giữ một và redirect URL còn lại.
- Hàm/hook export nhưng không dùng: `useUserNotificationsInfinite`, `usePatientRecordsQuery`, `ScrollReveal`, `PatientSkeleton`, `PatientCardSkeleton`, `PatientRecordsSkeleton`, `HomeHeroSlideshow`, `formatNumber`, `overlapsClinicLunchBreak`, `getLocalDateId`, `isFutureSlot`, `removeAuthCookie`, `formatLongDate`, `formatTime`.
- Import/biến không dùng (từ lint): `serviceIconMap` ([appointment/api.ts:219](apps/frontend-patient/src/features/dashboard/appointment/api.ts#L219)), `canEditBookingDetails` và `onCancelBooking` trong `BookingPanel`, `getInitials` và `Image` trong `doctors/page.tsx`, `DashboardIcon` và `ROUTES` trong `layout.tsx`…

### frontend-admin-receptionist-doctor (31 file + 1 file setup test)
| Nhóm | File |
|---|---|
| **Module đánh giá cũ** (đã thay bằng trang `admin/reviews`), khoảng 780 dòng | toàn bộ `components/admin/evaluate/` (10 file: `reviews-page-content.tsx`, `review-api.ts`, `review-list.tsx`, `review-pagination.tsx`, `review-summary-card.tsx`, `reviews-toolbar.tsx`, `star-rating.tsx`, `review-utils.ts`, `types.ts`, `index.ts`) |
| Thành phần dashboard cũ | `components/admin/overview/components/{quick-links,recent-activity,stat-card}.tsx` (291 dòng) |
| Bác sĩ | `components/doctor/aftercare-draft.tsx` (**470 dòng**) |
| Khác | `components/admin/promotion/components/add-promo-modal.tsx`, `components/shared/empty-state.tsx`, `constants/colors.ts`, `hooks/use-debounce.ts`, `hooks/use-media-query.ts`, `providers/auth-provider.tsx`, `features/auth/services/auth.service.ts`, `features/auth/types.ts` |
| File type rỗng/không dùng | `types/{api,appointment,patient,user}.ts`, `features/{appointments,billing,patients,treatment-records}/types.ts` |

Ngoài ra:
- **API xoá còn sót** sau commit "bỏ chức năng xóa" (`b3bdcc7`): `deleteBanner`, `deletePromotion`, `deleteService`, `deleteTreatmentMethod`, `deleteStaffUser` không còn nút nào gọi tới.
- [`service-detail` editor](apps/frontend-admin-receptionist-doctor/src/components/admin/service_pricing): lint báo 9 hàm `addMedia`, `addStep`, `addFaq`, `updateMedia`, `updateStep`, `updateFaq`, `addTextListItem`, `removeTextListItem`, `updateTextList` cùng component `ContentListSection` được khai báo nhưng không dùng. Phần soạn media/bước/FAQ có vẻ làm dở.
- `config/site.ts` có `apiUrl` mặc định `.../api/v1`, trong khi `lib/api/client.ts` dùng biến riêng: hai nơi cấu hình URL cho cùng một việc.

### mobile (10 file)
`features/report/components/PlanSelectorList.tsx` (313 dòng), `features/report/components/PlanProgressSummary.tsx` (167), `features/profile/ProfileScreen.tsx`, `features/profile/api.ts`, `features/function/api.ts`, `hooks/useAuthed.ts`, `utils/helper.ts`, cùng các `index.ts` không dùng trong `features/appointment`, `features/report`, `features/service`.

### backend (6 file)
| File | Ghi chú |
|---|---|
| `common/guards/permission.guard.ts` + `common/decorators/permissions.decorator.ts` | Cơ chế phân quyền theo permission **chưa từng được gắn vào route nào**; toàn hệ thống chỉ dùng `@Roles` |
| `modules/auth/dto/register.dto.ts`, `verify-otp.dto.ts`, `create-user.dto.ts` | DTO cũ, đã thay bằng `auth.dto.ts`. `register.dto.ts` cũ còn cho mật khẩu 6 ký tự và trường `roles` |
| `modules/notification/notification.controller.ts` | Chỉ re-export 2 controller khác, không được import |
| `apps/backend/test_date.js` | File thử nghiệm lẻ ở gốc app backend |

### Tài nguyên & tài liệu thừa
- `apps/frontend-admin-receptionist-doctor/public/pomotion/` chứa `image copy.png`, `image copy 2.png` … `image copy 5.png` (tên thư mục sai chính tả "pomotion", ảnh trùng).
- Ở thư mục gốc có nhiều file báo cáo/ghi chú: `report.md`, `CONTEXT.md`, `local-dental-vision.md`, `BOTKEEP_DEPLOY.md`, `WAU_CAPTCHA_SETUP.md`. Nên gom vào `docs/`.
- `apps/frontend-admin-receptionist-doctor/pnpm-lock.yaml` và `apps/mobile/package-lock.json` là lockfile riêng nằm trong monorepo pnpm, dễ lệch phiên bản với `pnpm-lock.yaml` ở gốc.

---

## J. Chất lượng code (lint)

### Backend: 1.396 vấn đề
| Rule | Số lượng | Ý nghĩa |
|---|---|---|
| `no-unsafe-member-access` / `assignment` / `call` / `argument` / `return` | 921 | Dùng `any` (81 chỗ `: any`/`as any`), mất kiểm tra kiểu |
| `prettier/prettier` | 439 | Chỉ là format, chạy `pnpm --filter backend format` là hết |
| `no-unused-vars` | 9 | Import thừa ở [patient.service.ts:12-23](apps/backend/src/modules/patient/patient.service.ts#L12-L23), `IsUrl` ở `create-banner.dto.ts` |
| `only-throw-error` | 1 | [appointment.service.ts:1426](apps/backend/src/modules/appointment/appointment.service.ts#L1426) ném biến có thể không phải `Error` |
| `no-base-to-string` | 4 | [invoice.service.ts:80, 113, 181-182](apps/backend/src/modules/invoice/invoice.service.ts#L80): `String(obj)` có thể ra `"[object Object]"` khi dữ liệu JSON items không đúng dạng |
| `no-floating-promises` | 1 | [main.ts:74](apps/backend/src/main.ts#L74): `bootstrap()` không `.catch`, khởi động lỗi sẽ thành unhandled rejection |
| `no-restricted-imports` | 1 | [test/app.e2e-spec.ts:5](apps/backend/test/app.e2e-spec.ts#L5) |

### Frontend (patient 49 error, admin 41 error)
- **`react-hooks/set-state-in-effect`** (khoảng 40 chỗ): gọi `setState` đồng bộ trong `useEffect`, gây render thừa. Có thể làm modal nháy hoặc dữ liệu cập nhật hai lần.
- **`Cannot call impure function during render`** (khoảng 10 chỗ): gọi `Date.now()`/`new Date()` ngay khi render (ví dụ [AppointmentRecordCard.tsx:70](apps/frontend-patient/src/features/dashboard/appointment/components/workspace/AppointmentRecordCard.tsx#L70)). Giá trị khác nhau giữa server và client, dễ gây hydration mismatch.
- **`Cannot access refs during render`**: [ConsultationPaymentModal.tsx:29-31](apps/frontend-patient/src/features/dashboard/consultation/components/ConsultationPaymentModal.tsx#L29-L31).
- `no-explicit-any` (khoảng 28 chỗ), `no-unescaped-entities` (dấu `"` trong JSX), `exhaustive-deps` (thiếu dependency trong `useEffect` ở `app-provider.tsx`, `useSocket.tsx`).

### Mobile
- 49 chỗ dùng `any`, 19 `console.log` còn sót. Lint không chạy được (xem D.6).

---

## K. Thứ tự ưu tiên sửa

1. **Ngay lập tức (bảo mật):**
   - E.1: thêm guard cho Doctor.
   - E.2: chặn bệnh nhân dùng CASH.
   - E.3 + E.4: khoá route chatbot của AI service, đổi `AI_SERVICE_API_KEY` thành key ngẫu nhiên, xoá key khỏi mobile, và **kiểm tra cấu hình production**.
   - E.5, F.9, F.10: chỉ `select` các trường công khai.
   - E.6: xử lý đăng ký lại.
2. **Trước khi demo/bảo vệ (chức năng người dùng thấy ngay):**
   - D.1–D.5: quên mật khẩu, các link email, `/contact`.
   - F.8: lệch giờ ca làm.
   - G.11: khuyến mãi hết hạn sớm.
   - F.3–F.7: hoàn tiền, QR, webhook, khuyến mãi.
   - H.15: chứng nhận giả trên trang chủ.
3. **Tiếp theo:** F.1, F.2 (Google, rate-limit), G.1, G.10, G.12, G.13 và các mục còn lại của phần G.
4. **Dọn dẹp:** xoá code thừa ở mục I, chạy `prettier`, sửa lỗi lint React hooks, cài lại `@react-native/jest-preset`, thêm script `test` cho app bệnh nhân.
5. **Viết thêm test:** test phân quyền controller (gọi route khi không có token hoặc sai role), test `PATIENT + CASH`, test kiểm tra xung đột ca làm với giờ VN, test link trong email.

---

## L. Giới hạn của lần kiểm tra này

- **Không chạy backend local:** DB (Prisma Postgres) và Redis (Upstash) trong `.env` là dịch vụ cloud, nhiều khả năng là dữ liệu thật. Chạy backend sẽ kích hoạt job nền (huỷ đơn hết hạn, hoàn tiền, gửi email), nên không chạy để tránh sửa dữ liệu. Vì vậy **các luồng sau khi đăng nhập** (đặt lịch, thanh toán, bác sĩ kê đơn, lễ tân thu tiền) chỉ được kiểm tra bằng đọc code, chưa bấm thử trên giao diện.
- **Không thử khai thác các lỗ hổng** trên hệ thống thật. Mục E.4 cần bạn tự kiểm tra biến `AI_SERVICE_API_KEY` trên server production.
- Test giao diện với dữ liệu thật chỉ dùng request **GET** tới backend đã deploy; mọi request ghi đều bị chặn.
- Test Python của `ai-service` chưa chạy được do môi trường máy (venv hỏng). Cần tạo lại venv: `python -m venv .venv` rồi `pip install -r requirements.txt`.
- App mobile chỉ được kiểm tra type-check và đọc code, chưa chạy trên emulator.
