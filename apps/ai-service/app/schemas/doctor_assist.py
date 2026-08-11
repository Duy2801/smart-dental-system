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


class PrescriptionItemDraft(BaseModel):
    medicine_name: str = ""
    dosage: str = ""
    frequency: str | None = None
    duration: str | None = None
    instruction: str | None = None


class PrescriptionDraftRequest(BaseModel):
    diagnosis: str | None = None
    chief_complaint: str | None = None
    treatment_notes: str | None = None
    medical_history: str | None = None
    service_name: str | None = None
    doctor_notes_hint: str | None = None


class PrescriptionDraftResponse(BaseModel):
    notes: str | None = None
    items: list[PrescriptionItemDraft] = Field(default_factory=list)
    allergy_warnings: list[str] = Field(default_factory=list)
    disclaimer: str = (
        "Bản nháp đơn thuốc AI — bác sĩ kiểm tra dị ứng và xác nhận trước khi lưu."
    )


class TreatmentPlanStepDraft(BaseModel):
    title: str = ""
    description: str | None = None
    target_tooth: str | None = None
    estimated_cost: int | float | None = None
    expected_date: str | None = None
    duration_hint: str | None = None


class TreatmentPlanDraftRequest(BaseModel):
    diagnosis: str | None = None
    chief_complaint: str | None = None
    treatment_notes: str | None = None
    medical_history: str | None = None
    service_name: str | None = None
    doctor_notes_hint: str | None = None
    catalog: str | None = None


class TreatmentPlanDraftResponse(BaseModel):
    title: str | None = None
    description: str | None = None
    start_date: str | None = None
    expected_end_date: str | None = None
    steps: list[TreatmentPlanStepDraft] = Field(default_factory=list)
    disclaimer: str = (
        "Bản nháp kế hoạch AI — bác sĩ chỉnh sửa trước khi lưu."
    )
