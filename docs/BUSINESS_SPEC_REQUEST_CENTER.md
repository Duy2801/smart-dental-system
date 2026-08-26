# TÀI LIỆU NGHIỆP VỤ & QUY TRÌNH XỬ LÝ YÊU CẦU DÀNH CHO LỄ TÂN (REQUEST CENTER SPECIFICATION)

> **Hệ thống Quản lý Nha khoa Thông minh — Smart Dental System**  
> **Phân hệ:** Quản lý Lễ tân & Chăm sóc Bệnh nhân (Receptionist & Patient Care)  
> **Module:** Trung tâm Tiếp nhận & Phê duyệt Yêu cầu (`/receptionist/requests`)  
> **Kênh thông báo chuẩn:** **Gmail (Email Transactional)** & **In-App Notification (Hệ thống chuông & Toast thời gian thực)**  
> **Phiên bản:** 1.1.0  
> **Ngày ban hành:** 24/08/2026  

---

## 1. 🎯 MỤC TIÊU NGHIỆP VỤ (BUSINESS OBJECTIVES)

Trong quá trình vận hành phòng khám nha khoa, các thay đổi lịch trình và nhu cầu tài chính phát sinh liên tục:
1. **Bệnh nhân:** Có việc đột xuất cần đổi ngày khám, kẹt xe, hoặc muốn hủy buổi tư vấn trực tuyến để xin hoàn tiền.
2. **Bác sĩ:** Có ca mổ khẩn cấp, đi công tác, hoặc nghỉ đột xuất cần dời lịch khám của hàng loạt bệnh nhân đã đặt trước.
3. **Lễ tân (Receptionist):** Đóng vai trò **"Nhạc trưởng điều phối" (Central Coordinator)** tiếp nhận mọi yêu cầu, liên hệ bệnh nhân, cân đối lịch ghế điều trị và phê duyệt xử lý minh bạch.

Module **"Yêu cầu"** giúp:
* Số hóa 100% quy trình tiếp nhận và xử lý khiếu nại / dời lịch.
* Tránh tình trạng sót lịch hẹn, trùng lịch bác sĩ hoặc thất thoát tài chính khi hoàn tiền.
* Tự động hóa gửi thông báo kết quả tức thì qua **Gmail** và **In-App** cho Bệnh nhân và Bác sĩ.
* Minh bạch lịch sử xử lý (ai duyệt, lúc mấy giờ, lý do từ chối là gì).

---

## 2. 👥 CÁC BÊN THAM GIA & PHÂN QUYỀN (STAKEHOLDERS)

| Vai trò | Quyền hạn & Trách nhiệm trong Module Yêu cầu |
| :--- | :--- |
| **Bệnh nhân (Patient)** | Gửi yêu cầu xin đổi lịch khám, yêu cầu hoàn tiền tư vấn video, gửi yêu cầu hỗ trợ qua App/Web bệnh nhân. Nhận email thông báo qua **Gmail** và **In-App**. |
| **Bác sĩ (Doctor)** | Gửi yêu cầu báo bận / nghỉ đột xuất kèm danh sách ca cần dời lịch. Nhận thông báo qua **In-App & Gmail** khi lễ tân đã hoàn tất điều phối bệnh nhân. |
| **Lễ tân (Receptionist)** | **Chủ thể xử lý chính**: Xem danh sách yêu cầu chờ duyệt, gọi điện xác nhận, bấm Phê duyệt (Duyệt đổi lịch / Duyệt hoàn tiền) hoặc Từ chối kèm lý do. |
| **Quản trị viên (Admin)** | Xem báo cáo tổng hợp tỷ lệ hủy lịch, số tiền hoàn trả định kỳ, giám sát chất lượng phản hồi của lễ tân. |

---

## 3. 📂 MA TRẬN CÁC LOẠI YÊU CẦU (REQUEST TAXONOMY)

### 3.1. 🔄 Yêu cầu Đổi lịch khám (Reschedule Appointment)
* **Người gửi:** Bệnh nhân.
* **Mục đích:** Xin chuyển ca khám tại phòng khám từ ngày/giờ cũ sang ngày/giờ mới.
* **Quy tắc xử lý:**
  1. Lễ tân kiểm tra khung giờ mới mà bệnh nhân mong muốn xem Bác sĩ đó có trống ghế không.
  2. Nếu trống $\rightarrow$ Lễ tân bấm **`Duyệt`**, hệ thống tự động cập nhật giờ hẹn trên Lịch tuần của Bác sĩ và gửi thông báo xác nhận qua **Gmail** và **In-App** cho bệnh nhân.
  3. Nếu kín lịch $\rightarrow$ Lễ tân bấm **`Gọi điện`** cho bệnh nhân để thương lượng khung giờ gần nhất khả dụng.

---

### 3.2. 💸 Yêu cầu Hoàn tiền / Hủy ca tư vấn trực tuyến (Refund / Cancellation)
* **Người gửi:** Bệnh nhân đã thanh toán gói tư vấn Video Call nhưng không thể tham gia.
* **Chính sách hoàn tiền (Refund Policy SLA):**
  * **Hủy trước > 24 giờ so với giờ hẹn:** Hoàn **100%** phí tư vấn.
  * **Hủy từ 4 giờ đến 24 giờ trước giờ hẹn:** Hoàn **50%** phí tư vấn.
  * **Hủy dưới 4 giờ hoặc vắng mặt (No-Show):** Hoàn **0%** (Không áp dụng hoàn tiền theo quy định của phòng khám).
* **Quy trình duyệt hoàn tiền:**
  1. Hệ thống tự động tính toán số tiền hoàn dựa trên mốc thời gian gửi đơn so với giờ hẹn.
  2. Lễ tân kiểm tra lý do và bấm **`Duyệt hoàn tiền`**.
  3. Hệ thống tạo lệnh hoàn tiền về tài khoản ngân hàng / ví điện tử của bệnh nhân, lưu vết vào phân hệ Tài chính (`/admin/finance`), đồng thời gửi biên nhận hoàn tiền qua **Gmail** và **In-App** cho bệnh nhân.

---

### 3.3. 👨‍⚕️ Yêu cầu Bác sĩ dời ca trực / Nghỉ khẩn cấp (Doctor Emergency Reschedule)
* **Người gửi:** Bác sĩ phụ trách.
* **Tình huống:** Bác sĩ có việc đột xuất (bệnh tật, hội chẩn viện TW, mổ cấp cứu).
* **Quy trình điều phối của Lễ tân:**
  1. Lễ tân nhận được thông báo yêu cầu dời ca của Bác sĩ kèm danh sách các bệnh nhân bị ảnh hưởng.
  2. Lễ tân liên hệ từng bệnh nhân qua điện thoại để:
     * *Phương án A:* Chuyển sang Bác sĩ khác cùng chuyên môn khám trong ngày.
     * *Phương án B:* Dời sang ngày làm việc tiếp theo của Bác sĩ đó.
  3. Sau khi sắp xếp xong, Lễ tân bấm **`Đã điều phối xong`** để hoàn tất yêu cầu. Hệ thống tự động gửi **Gmail xác nhận lịch mới** đến từng bệnh nhân.

---

### 3.4. 🆘 Yêu cầu Hỗ trợ Đặc biệt & Khiếu nại (Special Support)
* **Người gửi:** Bệnh nhân.
* **Nội dung:** Xin cấp lại hóa đơn đỏ bảo hiểm, thắc mắc về đơn thuốc, phản hồi chất lượng phục vụ.
* **Quy trình:** Lễ tân tiếp nhận, liên hệ giải đáp hoặc chuyển tiếp cho bộ phận Kế toán / Ban Giám đốc xử lý. Kết quả phản hồi sẽ được gửi qua **Gmail** và **In-App**.

---

## 4. 🔄 MÁY TRẠNG THÁI & LUỒNG XỬ LÝ (STATE MACHINE)

```
       [BỆNH NHÂN / BÁC SĨ TẠO YÊU CẦU]
                      │
                      ▼
               ┌──────────────┐
               │   PENDING    │ (Chờ Lễ tân xử lý)
               └──────┬───────┘
                      │
         ┌────────────┴────────────┐
         │                         │
         ▼                         ▼
  ┌──────────────┐          ┌──────────────┐
  │   APPROVED   │          │   REJECTED   │
  │  (Đã duyệt)  │          │ (Đã từ chối) │
  └──────────────┘          └──────────────┘
```

* **`PENDING` (Chờ duyệt):** Yêu cầu mới được tạo, hiển thị nổi bật với huy hiệu màu hổ phách (`Amber Badge`) có nhấp nháy pulse.
* **`APPROVED` (Đã duyệt):** Lễ tân chấp thuận, hệ thống tự động cập nhật cơ sở dữ liệu lịch hẹn / hoàn tiền và lưu thông tin người duyệt (`resolvedBy`).
* **`REJECTED` (Đã từ chối):** Lễ tân từ chối kèm theo **Lý do từ chối bắt buộc** gửi về hòm thư thông báo của bệnh nhân / bác sĩ.

---

## 5. 📱 MA TRẬN THÔNG BÁO TỰ ĐỘNG QUA GMAIL & IN-APP (NOTIFICATION PROTOCOL)

Hệ thống sử dụng **2 kênh thông báo chính thức**:
1. **Gmail (Email Transactional HTML):** Gửi thư có định dạng thương hiệu chuyên nghiệp, mã QR lịch hẹn và biên lai hoàn phí chi tiết vào hộp thư của người dùng.
2. **In-App Notification:** Thông báo đẩy Real-time (Chuông thông báo ở góc màn hình và popup Toast).

| Sự kiện kích hoạt | Kênh gửi | Người nhận | Nội dung mẫu chi tiết |
| :--- | :---: | :---: | :--- |
| **Bệnh nhân gửi yêu cầu mới** | In-App (Chuông + Toast) | Lễ tân trực ca | *"🔔 Yêu cầu mới: Bệnh nhân Nguyễn Văn Hùng xin đổi lịch hẹn #YCQ-8492."* |
| **Lễ tân duyệt đổi lịch** | **Gmail** + In-App | Bệnh nhân | **Tiêu đề Gmail:** `[Smart Dental] Xác nhận đổi lịch hẹn thành công #YCQ-8492`<br>**Nội dung:** Kính gửi Quý khách, yêu cầu đổi lịch hẹn đã được chấp thuận. **Lịch mới: 26/08/2026 lúc 15:00** với **BS. Trần Quang Minh**. |
| **Lễ tân duyệt hoàn tiền** | **Gmail** + In-App | Bệnh nhân | **Tiêu đề Gmail:** `[Smart Dental] Thông báo hoàn tiền tư vấn trực tuyến #YCQ-8493`<br>**Nội dung:** Yêu cầu hủy ca của bạn đã được duyệt. Số tiền hoàn: **200.000 VNĐ (100%)**. Tiền sẽ được hoàn về tài khoản trong 1-2 ngày làm việc. |
| **Lễ tân từ chối yêu cầu** | **Gmail** + In-App | Bệnh nhân | **Tiêu đề Gmail:** `[Smart Dental] Thông báo về yêu cầu #YCQ-8481`<br>**Nội dung:** Yêu cầu của bạn chưa thể thực hiện. **Lý do:** *Hóa đơn đã đóng kỳ khai thuế tháng 7 theo quy định tài chính.* |
| **Bác sĩ dời ca khẩn cấp** | **Gmail** + In-App | Bệnh nhân liên quan | **Tiêu đề Gmail:** `[Smart Dental] Thông báo dời lịch hẹn từ Bác sĩ phụ trách`<br>**Nội dung:** Bác sĩ có lịch hội chẩn khẩn cấp. Lễ tân đã sắp xếp lịch mới cho bạn vào **27/08 lúc 14:30**. |

---

## 6. 📊 CHỈ SỐ ĐO LƯỜNG HIỆU QUẢ (KPIs / METRICS)

1. **Thời gian phản hồi trung bình (Average Response Time):** Mục tiêu $\le 15\text{ phút}$ kể từ lúc bệnh nhân gửi yêu cầu trong giờ hành chính.
2. **Tỷ lệ xử lý thành công (Resolution Rate):** $\ge 95\%$ các yêu cầu được giải quyết trong ngày.
3. **Tỷ lệ gửi Email thành công (Email Delivery Rate):** $\ge 99.5\%$ email Gmail được gửi thành công không bị rơi vào hộp thư rác (Spam).
4. **Mức độ hài lòng của Bệnh nhân (CSAT):** Đạt từ $4.8 / 5$ sao về sự linh hoạt trong đổi lịch và hỗ trợ khách hàng.
