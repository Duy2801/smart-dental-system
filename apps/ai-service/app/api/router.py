from fastapi import APIRouter

from app.api.routes import chatbot, doctor_assist, health

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router, tags=["health"])
api_router.include_router(chatbot.router, prefix="/chatbot", tags=["chatbot"])
api_router.include_router(
    doctor_assist.router, prefix="/doctor", tags=["doctor-assist"]
)
