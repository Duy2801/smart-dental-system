from fastapi import APIRouter

from app.schemas.chatbot import ChatRequest, ChatResponse
from app.services.chatbot_service import ChatbotService
from app.core import llm
from app.core.prompts import RECEPTIONIST_SYSTEM

router = APIRouter()
service = ChatbotService()


@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest):
    """Chatbot bệnh nhân: FAQ / triệu chứng / gợi ý đặt lịch."""
    return await service.reply(body)


@router.post("/receptionist-chat", response_model=ChatResponse)
async def receptionist_chat(body: ChatRequest):
    """Trợ lý lễ tân nội bộ: nghiệp vụ, lịch hẹn, check-in, thanh toán."""
    history_txt = "\n".join(
        f"{m.role}: {m.content}" for m in body.history[-10:]
    )
    parts = []
    if history_txt:
        parts.append(f"Lịch sử cuộc hội thoại:\n{history_txt}")
    parts.append(f"Câu hỏi của lễ tân:\n{body.message}")
    reply = await llm.complete(RECEPTIONIST_SYSTEM, "\n\n".join(parts))
    return ChatResponse(reply=reply, disclaimer="")
