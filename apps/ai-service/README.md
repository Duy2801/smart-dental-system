# AI Service — Smart Dental System

Microservice Python (FastAPI). NestJS backend gọi service này qua HTTP nội bộ.

## Chạy local

**Lần đầu (chỉ 1 lần):**

```bash
pnpm --filter ai-service setup
```

**Hàng ngày** — từ root monorepo:

```bash
pnpm dev
```

Turbo sẽ chạy luôn AI service tại http://127.0.0.1:8000 (cùng backend/frontend).

Docs: http://127.0.0.1:8000/docs

### API key LLM (mỗi người dùng key của mình)

1. Tạo file `apps/ai-service/.env` (xem mẫu biến bên dưới hoặc file `.env.example` local)
2. Mở `.env`, chọn provider và điền **một** key:

| Provider | Biến cần điền | Lấy key |
|----------|---------------|---------|
| Groq (mặc định) | `LLM_PROVIDER=groq` + `GROQ_API_KEY=` | https://console.groq.com/keys |
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

## NestJS proxy (bác sĩ)

Backend gọi AI qua:

- `POST /api/v1/admin/ai/doctor/summarize-patient` `{ consultationId | patientId }`
- `POST /api/v1/admin/ai/doctor/draft-medical-record` `{ patientId?, chiefComplaint?, … }`

Env Nest (`apps/backend/.env`):

```
AI_SERVICE_URL=http://127.0.0.1:8000
```
