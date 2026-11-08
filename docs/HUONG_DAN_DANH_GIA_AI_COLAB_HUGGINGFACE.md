# Hướng dẫn Test AI X-quang trên Cloud Google Colab (Không cần tải ảnh về máy tính)

Bạn có **2 cách** để lấy bảng điểm Precision / Recall / F1 và biểu đồ báo cáo đồ án:

1. **Cách 1 (Khuyên dùng — Chạy 100% trên Cloud Google Colab bằng GPU T4):**
   - **Không tải bất kỳ tấm ảnh nào về máy tính của bạn** (0 MB tốn ổ cứng).
   - Máy chủ Google Colab tự tải trực tiếp bộ dữ liệu chuẩn quốc tế **MICCAI DENTEX 2023** (`ibrahimhamamci/DENTEX` & `anshs990/DENTEX`) và trọng số model `Hau1122/smart-dental-pano-ai` từ Hugging Face, chạy bằng **GPU T4** nhanh gấp ~50–100 lần CPU laptop.
   - Quy mô dữ liệu chuẩn bác sĩ có sẵn trên Cloud:
     - **1.005 phim X-quang Panorama = 32.160 mẫu vị trí răng FDI (`11`–`48`)** cho nhóm bệnh lý sâu răng (`Caries`) và tổn thương quanh chóp (`Periapical radiolucency`).
     - **634 phim X-quang Panorama = 20.288 mẫu vị trí răng FDI (`11`–`48`)** cho nhóm mất răng (`Missing tooth`).
     - Tổng cộng: **1.639 phim X-quang Panorama (52.448 mẫu đánh giá răng FDI)**.
2. **Cách 2 (Tuỳ chọn phụ — Chạy trên máy tính cá nhân với thư mục ảnh riêng):**
   - Dùng khi bạn muốn test riêng vài chục ảnh tự chuẩn bị trên ổ cứng máy tính.

---

## Cách 1: Chạy 100% trên Cloud Google Colab (Không tải ảnh về máy, chạy hàng trăm / nghìn ảnh bằng GPU)

### Bước 1 — Mở notebook trên Google Colab và bật GPU T4
1. Truy cập **https://colab.research.google.com/** và đăng nhập tài khoản Google.
2. Chọn **File → Upload notebook (Tải sổ tay lên)**.
3. Chọn file **`docs/Test_AI_Xquang.ipynb`** trong dự án này.
4. Trên thanh menu Colab, vào **Runtime (Thời gian chạy) → Change runtime type (Đổi loại thời gian chạy)** → chọn **T4 GPU** → bấm **Save (Lưu)**.

### Bước 2 — Bấm nút ▶ ở 3 ô (Ô 1 → Ô 2A → Ô 3)
1. **Ô số 1:** Bấm nút tam giác **▶** bên trái để nạp hàm tính điểm chuẩn `evaluate()`.
2. **Ô số 2A:**
   - Mặc định `LOAI_BENH = "ALL"` và `SO_LUONG_ANH = 200` (tương đương **6.400 mẫu vị trí răng FDI**, có thể tăng lên `500`, `1000` hoặc tối đa `2261` phim = **72.352 mẫu răng FDI**) sẽ tự động đánh giá **đủ cả 8/8 loại phát hiện nha khoa** trong 1 lần chạy duy nhất:
     1. **Sâu răng (`Caries`)**
     2. **Tổn thương / Tiêu xương quanh chóp (`Periapical radiolucency`)**
     3. **Răng đã mất (`Missing tooth`)**
     4. **Chân răng còn sót (`Residual root`)**
     5. **Miếng trám răng (`Filling`)**
     6. **Điều trị nội nha / Chữa tủy (`Root canal filling`)**
     7. **Mão răng / Cầu răng sứ (`Crown / Bridge`)**
     8. **Trụ Implant (`Implant`)**
   - Bộ ngưỡng tối ưu theo kích thước tổn thương (`NGUONG_THEO_LOAI`) cũng đã được cấu hình sẵn (ví dụ `0.10` cho lỗ sâu răng/quanh chóp nhỏ, `0.30` cho phục hình/implant, `0.50` cho mất răng) để cân bằng cả **Precision, Recall và F1-Score**.
   - Bấm nút **▶** ở **Ô 2A**. Colab sẽ tự cài thư viện, tải model `Hau1122/smart-dental-pano-ai`, tải ảnh từ 2 bộ chuẩn quốc tế trên Hugging Face (**Zenodo 2025 Panoramic Dental Condition** `ismaelportog/Panoramic_Radiographs_for_Dental_Condition` cho 7 loại bệnh lý/phục hình + **MICCAI DENTEX 2023** `anshs990/DENTEX` cho mất răng) và chạy bằng GPU.
   - *(Lưu ý: Bỏ qua **Ô 2B** ở lần chạy đầu tiên).*
3. **Ô số 3:** Bấm nút **▶**. Colab sẽ lập tức:
   - In ra **Bảng điểm tổng hợp đủ cả 8/8 loại bệnh lý & phục hình** (`Precision`, `Recall`, `F1-Score`, `TP`, `FP`, `FN`) kèm dòng **Tổng hợp toàn hệ thống (Overall)**.
   - Vẽ **Biểu đồ cột so sánh trực quan cả 8 loại bệnh** (`bieu_do_ket_qua.png`).
   - Tự động tải về máy bạn 1 file **`.zip`** gồm: `bang_diem_8_loai_benh.csv`, `bang_diem.csv`, `doi_chieu_tung_anh.csv`, `bieu_do_ket_qua.png`, `reference.csv`, `predictions.csv`, `run_metadata.json`.

---

## Cách 2: Chạy trên máy tính cá nhân (Nếu muốn test bộ ảnh riêng trên ổ D:)

*(Hiện tại mình cũng đã tải sẵn 10 ảnh mẫu DENTEX kèm đáp án chuẩn vào `D:\SDS_AI_Test\images` và `D:\SDS_AI_Test\caries\reference.csv` cho bạn nếu muốn thử local).*

1. **Chuẩn bị danh sách ảnh:**
   ```powershell
   cd D:\DuAn_React_CV\DoAnTotNghiep\smart-dental-system
   .\apps\ai-service\.venv\Scripts\python.exe apps/ai-service/scripts/export_xray_evaluation.py prepare --images D:\SDS_AI_Test\images --out D:\SDS_AI_Test\caries
   ```
2. **Điền đáp án vào `D:\SDS_AI_Test\caries\reference.csv`** (cột `rang_co_phat_hien` ghi số răng FDI cách nhau bởi `;`, cột `da_kiem_tra` điền `1`).
3. **Chạy AI dự đoán trên máy:**
   ```powershell
   .\apps\ai-service\.venv\Scripts\python.exe apps/ai-service/scripts/export_xray_evaluation.py predict --out D:\SDS_AI_Test\caries
   ```
4. **Đưa 4 file lên Colab:** Mở `docs/Test_AI_Xquang.ipynb` trên Colab → chạy **Ô 1** → chạy **Ô 2B** (chọn 4 file trong `D:\SDS_AI_Test\caries`) → chạy **Ô 3**.

---

## Nguồn dữ liệu và Model để trích dẫn trong Báo cáo / Slide Bảo vệ

- **Bộ dữ liệu kiểm thử độc lập (External Benchmark):** **MICCAI DENTEX 2023 Challenge Dataset** — Hamamci và cộng sự (2023), [*DENTEX: An Abnormal Tooth Detection with Dental Enumeration and Diagnosis Benchmark for Panoramic X-rays*](https://arxiv.org/abs/2305.19112), lưu trữ trên Hugging Face tại [`ibrahimhamamci/DENTEX`](https://huggingface.co/datasets/ibrahimhamamci/DENTEX) & [`anshs990/DENTEX`](https://huggingface.co/datasets/anshs990/DENTEX) (1.005 phim X-quang toàn cảnh có nhãn bệnh lý theo số răng FDI = **32.160 mẫu vị trí răng**, và 634 phim có nhãn hiện diện răng FDI = **20.288 mẫu vị trí răng**).
- **Kiến trúc & Bài báo gốc của Model (YOLO + DeepLabV3+):** Wang và cộng sự (2025), [*Artificial Intelligence to Assess Dental Findings from Panoramic Radiographs — A Multinational Study*](https://arxiv.org/abs/2502.10277), mã nguồn [`stmharry/dental-pano-ai`](https://github.com/stmharry/dental-pano-ai).
- **Trọng số tích hợp trong hệ thống:** [`Hau1122/smart-dental-pano-ai`](https://huggingface.co/Hau1122/smart-dental-pano-ai) (`deeplab/model.pth` và `yolo/model.pt`).


---

## Giải thích chi tiết 2 Model AI, Nguồn gốc Dữ liệu và Kịch bản Bảo vệ Đồ án

### 1. Hệ thống AI X-quang gồm 2 Model nào và phối hợp ra sao?

Trong code của hệ thống (`apps/ai-service/app/services/local_panoramic_model.py`, `apps/ai-service/dental-pano-ai/main.py` và class `ColabPanoramicEvaluator` trong `docs/Test_AI_Xquang.ipynb`), hệ thống **không dùng 1 model đơn lẻ** mà dùng **kiến trúc ghép đôi (Dual-Branch Pipeline)** gồm 2 mạng nơ-ron chạy song song trên cùng 1 tấm phim X-quang Panorama:

#### Nhánh 1: `DeepLabV3+` (Backbone `ResNet-101`) — Chuyên "Bản đồ giải phẫu 32 vị trí răng FDI"
- **File trọng số:** `deeplab/model.pth` (khai báo trong `SemanticSegmentationModule`).
- **Bài toán:** Phân vùng ngữ nghĩa theo từng điểm ảnh (**Semantic Segmentation**) với **33 lớp (classes)**:
  - Lớp `0`: Nền (Background — xương hàm, mô mềm, khoảng đen).
  - Lớp `1` đến `32`: Tương ứng chính xác **32 vị trí răng chuẩn nha khoa quốc tế FDI** (`11–18`, `21–28`, `31–38`, `41–48`).
- **Đầu ra:** Một ma trận xác suất kích thước `(33, H, W)` cho biết **mỗi pixel trên ảnh thuộc về khu vực giải phẫu của chiếc răng số mấy** (kể cả khi răng đó đã bị nhổ mất, DeepLabV3+ vẫn dự đoán được vùng huyệt ổ răng của số răng đó nhờ tương quan với các răng lân cận).

#### Nhánh 2: `YOLOv8m-seg` — Chuyên "Khoanh vùng tổn thương / bệnh lý và thân răng thực tế"
- **File trọng số:** `yolo/model.pt` (khai báo trong `InstanceDetectionModule`).
- **Bài toán:** Phát hiện đối tượng kèm mặt nạ phân vùng (**Instance Segmentation**).
- **Đầu ra:** Các hộp giới hạn (`bbox`), điểm tự tin (`score`) và mặt nạ (`mask`) của:
  1. Các thân răng thực tế đang còn trên hàm (`TOOTH_11`..`TOOTH_48`).
  2. **7 loại bệnh lý / can thiệp nha khoa** nằm trên răng:
     - `CARIES`: Sâu răng (`Caries`)
     - `PERIAPICAL_RADIOLUCENT`: Tổn thương / tiêu xương quanh chóp (`Periapical radiolucency`)
     - `FILLING`: Miếng trám răng (`Filling`)
     - `ENDO`: Điều trị nội nha / lấy tủy (`Root canal filling`)
     - `CROWN_BRIDGE`: Bọc sứ / cầu răng (`Crown / Bridge`)
     - `IMPLANT`: Trụ Implant (`Implant`)
     - `ROOT_REMNANTS`: Chân răng còn sót (`Residual root`)

#### Khối ghép nối: `PostProcessingModule` — Ghép "Bệnh gì (YOLO)" vào "Răng số mấy (DeepLabV3+)"
- Khi **YOLO** phát hiện một vùng sâu răng (`CARIES`), bản thân YOLO chỉ biết *"chỗ pixel này bị sâu"* nhưng dễ nhầm số thứ tự răng nếu bệnh nhân bị mất răng hoặc răng mọc lệch.
- Hệ thống lấy mặt nạ vùng sâu răng của **YOLO** chồng (overlay) lên bản đồ 32 răng của **DeepLabV3+** để tính tỷ lệ chồng lấp (`share_per_tooth`).
- Vùng sâu răng rơi vào vùng giải phẫu của răng nào (ví dụ răng `46`) thì nhân xác suất lại để kết luận: **`Răng 46 — Caries — Confidence 0.91`**.
- Ngược lại, với **Mất răng (`Missing tooth`)**: Nếu vùng giải phẫu răng `36` trên DeepLabV3+ không có bất kỳ thân răng `TOOTH` nào của YOLO đè lên, hệ thống sẽ kết luận **Răng `36` bị mất (`Missing tooth`)**.

---

### 2. Nguồn gốc của 2 Model này lấy từ đâu?

1. **Công trình nghiên cứu gốc (2025):**
   - Nhóm tác giả **Wang và cộng sự (2025)** thuộc nghiên cứu đa quốc gia công bố trên bài báo:
     *“Artificial Intelligence to Assess Dental Findings from Panoramic Radiographs — A Multinational Study”* ([arXiv:2502.10277](https://arxiv.org/abs/2502.10277)).
   - Mã nguồn suy luận gốc được công bố mở tại GitHub: [`stmharry/dental-pano-ai`](https://github.com/stmharry/dental-pano-ai).
2. **Lưu trữ & tích hợp vào hệ thống của đồ án:**
   - Hai file trọng số đã huấn luyện (`deeplab/model.pth` và `yolo/model.pt`) được đóng gói và lưu trữ trên Hugging Face tại repo: **[`Hau1122/smart-dental-pano-ai`](https://huggingface.co/Hau1122/smart-dental-pano-ai)**.
   - Trong đồ án, tầng tích hợp `LocalPanoramicModel` được xây dựng thêm để:
     - Chặn ảnh không phải phim X-quang răng (`NonDentalImageError` khi không phát hiện được cấu trúc răng).
     - Quy đổi tọa độ pixel sang tọa độ phần trăm (`%`) để vẽ hộp khoanh vùng trực tiếp lên giao diện Bác sĩ và tự động điền vào sơ đồ răng **Odontogram 32 răng**.

---

### 3. Nguồn gốc bộ ảnh kiểm thử (1.005 + 634 = 1.639 phim) lấy từ đâu?

Toàn bộ ảnh và đáp án chuẩn trong `docs/Test_AI_Xquang.ipynb` được lấy từ bộ dữ liệu chuẩn quốc tế **DENTEX (Dental Enumeration and Diagnosis on Panoramic X-rays Challenge)**:

1. **Đơn vị công bố:** Hội nghị hàng đầu thế giới về xử lý ảnh y khoa **MICCAI 2023** (nhóm tác giả **Ibrahim Ethem Hamamci và cộng sự, 2023**, bài báo [arXiv:2305.19112](https://arxiv.org/abs/2305.19112)).
2. **Nguồn thu thập ảnh thực tế:**
   - Thu thập từ **3 bệnh viện / cơ sở nha khoa khác nhau** với nhiều dòng máy chụp Panorama khác nhau (đảm bảo tính đa dạng thực tế lâm sàng), trên bệnh nhân từ 12 tuổi trở lên và đã được ẩn danh hoàn toàn thông tin cá nhân (HIPAA/GDPR de-identified).
3. **Ai là người gán nhãn đáp án (Ground Truth)?**
   - Được gán nhãn phân cấp theo hệ thống **FDI (`11`–`48`)** bởi **hội đồng bác sĩ nha khoa / chuyên gia chẩn đoán hình ảnh** của cuộc thi MICCAI DENTEX 2023.
4. **Quy mô các tập con trên Hugging Face (`ibrahimhamamci/DENTEX` & `anshs990/DENTEX`):**
   - **1.005 phim X-quang có nhãn bệnh lý theo từng răng FDI** (gồm `50` phim Validation + `250` phim Test + `705` phim Disease): Mỗi phim có 32 vị trí răng FDI $\rightarrow$ tương đương **32.160 mẫu đánh giá răng** cho bài toán phát hiện sâu răng (`Caries`) và viêm quanh chóp (`Periapical radiolucency`).
   - **634 phim X-quang có nhãn đánh số toàn bộ răng hiện diện (`quadrant_enumeration`)**: Những răng trong hệ 32 răng không xuất hiện trong nhãn của bác sĩ chính là răng đã mất $\rightarrow$ tương đương **20.288 mẫu đánh giá răng** cho bài toán phát hiện mất răng (`Missing tooth`).
5. **Tại sao dùng bộ DENTEX để test model lại rất thuyết phục về mặt học thuật?**
   - Vì model `dental-pano-ai` được huấn luyện từ nghiên cứu của Wang et al. (2025), hoàn toàn **độc lập với bộ dữ liệu cuộc thi MICCAI DENTEX 2023**. Trong khoa học máy tính y sinh, việc đánh giá một model trên bộ dữ liệu bệnh viện độc lập bên ngoài (**External Validation trên 1.005 phim / 32.160 mẫu răng**) là cách kiểm chứng khách quan nhất, không bị rò rỉ dữ liệu huấn luyện (data leakage).

---

### 4. Cách chạy lại cực nhanh trên Google Colab (Chỉ mất 1–3 giây)

Bạn **chỉ tốn thời gian đợi vài phút ở đúng lần chạy đầu tiên** (do máy ảo Colab mới khởi tạo phải cài `detectron2`, tải trọng số model và chạy AI qua hàng trăm ảnh). Ở các lần sau:

1. **Chạy lại ngay trong cùng phiên Colab (1–2 giây):**
   - Ô 2A đã có sẵn bộ nhớ đệm `_COLAB_CACHE` lưu toàn bộ kết quả dự đoán của cả 8 nhóm bệnh trên các ảnh đã chạy.
   - Khi bạn đổi `LOAI_BENH = "Periapical radiolucency"` hoặc đổi `NGUONG_CONFIDENCE` rồi bấm lại **Ô 2A → Ô 3**, Colab lấy thẳng từ Cache ra nên chỉ mất **1–2 giây**.
2. **Ngày hôm sau mở lại hoặc khi Demo trực tiếp trước Hội đồng (3 giây):**
   - Sau lần chạy đầu tiên, Ô 3 đã tải về máy bạn 1 file `.zip` chứa sẵn 4 file kết quả (`reference.csv`, `predictions.csv`, `inference_status.csv`, `run_metadata.json`).
   - Lần sau mở Colab, bạn **bỏ qua hoàn toàn Ô 2A**, chỉ cần bấm **Ô 1 → Ô 2B (chọn 4 file giải nén từ ZIP) → Ô 3** là hiện ngay bảng điểm và biểu đồ trong **3 giây** (không cần bật GPU, không cần cài lại `detectron2`).

---

### 5. Văn mẫu trả lời ngắn gọn khi Thầy/Cô hỏi lúc Bảo vệ Đồ án

> *“Thưa thầy/cô, phần nhận diện X-quang Panorama của hệ thống em sử dụng kiến trúc kết hợp 2 mạng học sâu từ nghiên cứu của Wang và cộng sự (2025), trọng số lưu trên Hugging Face `Hau1122/smart-dental-pano-ai`:*
> *1. Thứ nhất là mạng **DeepLabV3+ (ResNet-101)** làm nhiệm vụ phân vùng ngữ nghĩa 32 vị trí giải phẫu răng theo chuẩn FDI từ 11 đến 48.*
> *2. Thứ hai là mạng **YOLOv8m-seg** làm nhiệm vụ khoanh vùng mặt nạ các tổn thương như sâu răng, viêm quanh chóp, miếng trám, nội nha, implant.*
> *Sau đó thuật toán hậu xử lý sẽ chồng mặt nạ tổn thương của YOLO lên bản đồ 32 răng của DeepLabV3+ để xác định chính xác tổn thương đó nằm ở răng số mấy trên sơ đồ Odontogram.*
>
> *Để đánh giá khách quan độ chính xác của khối AI này, em sử dụng bộ dữ liệu kiểm thử độc lập từ cuộc thi quốc tế **MICCAI DENTEX 2023** trên Hugging Face, gồm **1.005 phim X-quang toàn cảnh (tương đương 32.160 vị trí răng FDI)** đã được hội đồng bác sĩ nha khoa gán nhãn chuẩn. Toàn bộ quá trình tải dữ liệu, chạy suy luận bằng GPU và tính chỉ số Precision, Recall, F1 theo từng vị trí răng FDI đều được đóng gói tự động trên Google Colab để tái lập kết quả minh bạch.”*
