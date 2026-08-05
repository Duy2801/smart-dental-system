from pydantic import BaseModel, Field


class ChatSnippet(BaseModel):
    role: str
    content: str


class SummarizePatientRequest(BaseModel):
    patient_name: str | None = None
    medical_history: str | None = None
    chatbot_messages: list[ChatSnippet] = Field(default_factory=list)
    recent_diagnoses: list[str] = Field(default_factory=list)
    upcoming_service: str | None = None


class SummarizePatientResponse(BaseModel):
    bullet_points: list[str]
    questions_to_ask: list[str] = Field(default_factory=list)
    risk_flags: list[str] = Field(default_factory=list)
    disclaimer: str = "AI hỗ trợ chuẩn bị khám — quyết định lâm sàng thuộc bác sĩ."


class MedicalRecordDraftRequest(BaseModel):
    chief_complaint: str | None = None
    chatbot_summary: str | None = None
    service_name: str | None = None
    doctor_notes_hint: str | None = None


class MedicalRecordDraftResponse(BaseModel):
    chief_complaint: str | None = None
    diagnosis_draft: str | None = None
    treatment_notes_draft: str | None = None
    disclaimer: str = "Bản nháp AI — bác sĩ chỉnh sửa và xác nhận trước khi lưu."
