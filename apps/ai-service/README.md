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

Điền key LLM trong `apps/ai-service/.env` (`OPENAI_API_KEY` hoặc `GEMINI_API_KEY`).

## Luồng hệ thống

```
Patient / Doctor UI  →  NestJS (apps/backend)  →  AI Service (apps/ai-service)
                                                      ↓
                                                   LLM API
```

NestJS giữ auth, DB, nghiệp vụ. Python chỉ làm inference / sinh text.
