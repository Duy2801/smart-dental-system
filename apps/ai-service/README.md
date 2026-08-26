# AI Service — Smart Dental System

Microservice Python (FastAPI). NestJS backend gọi service này qua HTTP nội bộ.

## Chạy local

**Lần đầu (chỉ 1 lần):**

```bash
pnpm --filter ai-service setup
```

Lệnh setup tự tải hai model Dental Pano từ Hugging Face nếu máy chưa có. Model
được lưu tại `dental-pano-ai/models/` và không được commit lên Git. Bạn cũng có
thể chạy riêng từ thư mục gốc:

```bash
python download_models.py
```

Script kiểm tra SHA-256 và bỏ qua model đã tải đầy đủ, nên không tải lại trong
những lần chạy sau.

Phân tích phim Panorama dùng YOLO và DeepLab chạy local. Hai model được nạp vào
bộ nhớ ở lần phân tích đầu tiên rồi tái sử dụng cho các request tiếp theo.
Gemini `gemini-3.6-flash` chỉ diễn giải danh sách phát hiện do model local trả về;
Gemini không tự thêm phát hiện và hệ thống không dùng Roboflow.

> Pipeline model yêu cầu Python 3.11–3.13 (khuyến nghị 3.12) và các thư viện AI trong `requirements.txt`.
> Nếu model chưa được tải hoặc thiếu dependency, API trả trạng thái
> `MODEL_UNAVAILABLE` thay vì tạo dữ liệu phát hiện giả.

**Hàng ngày** — từ root monorepo:

```bash
pnpm dev
```

Turbo sẽ chạy luôn AI service tại http://127.0.0.1:8001 (cùng backend/frontend).

Docs: http://127.0.0.1:8001/docs

### API key LLM (mỗi người dùng key của mình)

1. Tạo file `apps/ai-service/.env` (xem mẫu biến bên dưới hoặc file `.env.example` local)
2. Mở `.env`, chọn provider và điền **một** key:

| Provider | Biến cần điền | Lấy key |
|----------|---------------|---------|
| OpenRouter (mặc định) | `LLM_PROVIDER=openrouter` + `OPENROUTER_API_KEY=` + `OPENROUTER_MODEL=` | https://openrouter.ai/keys |
| Groq | `LLM_PROVIDER=groq` + `GROQ_API_KEY=` | https://console.groq.com/keys |
| OpenAI | `LLM_PROVIDER=openai` + `OPENAI_API_KEY=` | https://platform.openai.com/api-keys |
| Gemini | `LLM_PROVIDER=gemini` + `GEMINI_API_KEY=` | https://aistudio.google.com/apikey |

3. Restart `pnpm dev` (đổi `.env` không luôn tự reload).

`.env` đã nằm trong `.gitignore` — **đừng commit key**.

## Luồng hệ thống

```
Patient / Doctor UI  →  NestJS (apps/backend)  →  AI Service (apps/ai-service)
                                                      ↓
                                                   LLM API
```

NestJS giữ auth, DB, nghiệp vụ. Python chỉ làm inference / sinh text.

## RAG (kiến thức phòng khám)

Trước khi gọi LLM, service tìm đoạn liên quan trong `data/knowledge.jsonl` (bảng giá, FAQ, quy trình, protocol, mẫu HSBA/chat) rồi nhét vào prompt.

- Sửa/bổ sung tri thức: thêm dòng JSON vào `knowledge.jsonl` (mỗi dòng = 1 chunk).
- Search hiện tại: token-overlap (không cần embedding API). Đổi sang embedding khi KB lớn.

## NestJS proxy (bác sĩ)

Backend gọi AI qua:

- `POST /api/v1/admin/ai/doctor/summarize-patient` `{ consultationId | patientId }`
- `POST /api/v1/admin/ai/doctor/draft-medical-record` `{ patientId?, chiefComplaint?, … }`
- `POST /api/v1/admin/ai/doctor/draft-prescription` `{ medicalRecordId | patientId }`
- `POST /api/v1/admin/ai/doctor/draft-treatment-plan` `{ patientId | medicalRecordId }`
- `POST /api/v1/admin/ai/doctor/review-prescription` `{ medicalRecordId | patientId, items }`
- `POST /api/v1/admin/ai/doctor/generate-aftercare` `{ medicalRecordId }`
- `POST /api/v1/admin/ai/doctor/send-aftercare` `{ medicalRecordId, content }`
- `POST /api/v1/admin/ai/doctor/explain-treatment-plan` `{ treatmentPlanId }`

Env Nest (`apps/backend/.env`) và AI service (`apps/ai-service/.env`) phải dùng
cùng `AI_SERVICE_API_KEY`:

```
AI_SERVICE_URL=http://127.0.0.1:8001
AI_SERVICE_API_KEY=dev-local-key
```

Khi chạy production, đặt một key riêng thay cho `dev-local-key`; service sẽ từ
chối khởi động nếu vẫn dùng key development. Có thể cấu hình danh sách origin
trình duyệt được phép gọi AI service trực tiếp bằng `CORS_ORIGINS`, phân tách bởi
dấu phẩy.
