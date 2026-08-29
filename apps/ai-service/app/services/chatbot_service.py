from app.core import llm
from app.core.prompts import CHATBOT_SYSTEM
from app.core.rag import build_rag_block
from app.schemas.chatbot import ChatRequest, ChatResponse


class ChatbotService:
    """
    Chatbot bệnh nhân gốc: RAG + LLM thuần.
    Được gọi tại POST /api/v1/chatbot/chat
    """

    async def reply(self, body: ChatRequest) -> ChatResponse:
        history_txt = "\n".join(
            f"{m.role}: {m.content}" for m in body.history[-10:]
        )
        rag = build_rag_block(body.message)
        parts = []
        if rag:
            parts.append(rag)
        if history_txt:
            parts.append(f"Lịch sử:\n{history_txt}")
        parts.append(f"Tin nhắn mới của bệnh nhân:\n{body.message}")
        text = await llm.complete(CHATBOT_SYSTEM, "\n\n".join(parts))
        return ChatResponse(reply=text)
