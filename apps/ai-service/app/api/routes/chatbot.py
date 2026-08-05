from fastapi import APIRouter

from app.schemas.chatbot import ChatRequest, ChatResponse
from app.services.chatbot_service import ChatbotService

router = APIRouter()
service = ChatbotService()


@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest):
    """Chatbot bệnh nhân: FAQ / triệu chứng / gợi ý đặt lịch."""
    return await service.reply(body)
