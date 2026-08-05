from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(description="user | assistant | system")
    content: str


class ChatRequest(BaseModel):
    patient_id: str | None = None
    message: str
    history: list[ChatMessage] = Field(default_factory=list)
    locale: str = "vi"


class ChatResponse(BaseModel):
    reply: str
    suggested_service_slugs: list[str] = Field(default_factory=list)
    should_book: bool = False
    disclaimer: str = (
        "Thông tin chỉ mang tính tham khảo, không thay thế khám với bác sĩ."
    )
