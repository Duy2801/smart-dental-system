from app.core import llm
from app.core.prompts import CHATBOT_SYSTEM
from app.schemas.chatbot import ChatRequest, ChatResponse


class ChatbotService:
    async def reply(self, body: ChatRequest) -> ChatResponse:
        history_txt = "\n".join(
            f"{m.role}: {m.content}" for m in body.history[-10:]
        )
        user = (
            f"Lịch sử:\n{history_txt}\n\n"
            f"Tin nhắn mới của bệnh nhân:\n{body.message}"
        )
        text = await llm.complete(CHATBOT_SYSTEM, user)
        return ChatResponse(reply=text)
