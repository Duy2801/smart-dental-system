from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.config import settings

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
    return {
        "status": "ok",
        "service": settings.ai_service_name,
        "provider": settings.llm_provider,
    }
