from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.config import get_settings

app = FastAPI(
    title="Smart Dental AI Service",
    version="0.1.0",
    description="AI hỗ trợ chatbot bệnh nhân và trợ lý bác sĩ.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health")
def health():
    s = get_settings()
    return {
        "status": "ok",
        "service": s.ai_service_name,
        "provider": s.llm_provider,
        "hasKey": bool(
            (s.llm_provider == "groq" and s.groq_api_key)
            or (s.llm_provider == "openai" and s.openai_api_key)
            or (s.llm_provider == "gemini" and s.gemini_api_key)
        ),
    }
