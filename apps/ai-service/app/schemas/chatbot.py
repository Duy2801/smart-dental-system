from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(description="user | assistant | system")
    content: str
    metadata: dict = Field(default_factory=dict)


class ChatRequest(BaseModel):
    created_by_user_id: str | None = None
    patient_id: str | None = None
    patient_name: str | None = None
    patient_phone: str | None = None
    message: str
    metadata: dict = Field(default_factory=dict)
    history: list[ChatMessage] = Field(default_factory=list)
    locale: str = "vi"


class ChatSuggestion(BaseModel):
    type: str = Field(description="quick_reply | service | time_slot | date")
    label: str
    value: str
    metadata: dict = Field(default_factory=dict)


class ChatResponse(BaseModel):
    reply: str
    suggested_service_slugs: list[str] = Field(default_factory=list)
    suggestions: list[ChatSuggestion] = Field(default_factory=list)
    should_book: bool = False
    metadata: dict = Field(default_factory=dict)
    disclaimer: str = (
        "Thông tin hỗ trợ tự động bởi Trợ lý AI Smart Dental."
    )
