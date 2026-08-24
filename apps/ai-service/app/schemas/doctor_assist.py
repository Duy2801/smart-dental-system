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
    latest_medical_record: str | None = None
    recent_prescriptions: list[str] = Field(default_factory=list)
    active_treatment_plan: str | None = None
    follow_up: str | None = None


class SummarizePatientResponse(BaseModel):
    bullet_points: list[str]
    questions_to_ask: list[str] = Field(default_factory=list)
    risk_flags: list[str] = Field(default_factory=list)
    disclaimer: str = "AI hỗ trợ chuẩn bị khám. Quyết định lâm sàng thuộc bác sĩ."


class MedicalRecordDraftRequest(BaseModel):
    chief_complaint: str | None = None
    chatbot_summary: str | None = None
    service_name: str | None = None
    doctor_notes_hint: str | None = None
    transcript: str | None = None


class MedicalRecordDraftResponse(BaseModel):
    chief_complaint: str | None = None
    diagnosis_draft: str | None = None
    treatment_notes_draft: str | None = None
    disclaimer: str = "Bản nháp AI. Bác sĩ chỉnh sửa và xác nhận trước khi lưu."


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
        "Bản nháp đơn thuốc AI. Bác sĩ kiểm tra dị ứng và xác nhận trước khi lưu."
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
        "Bản nháp kế hoạch AI. Bác sĩ chỉnh sửa trước khi lưu."
    )


class MedicalRecordContext(BaseModel):
    chief_complaint: str | None = None
    diagnosis: str | None = None
    treatment_notes: str | None = None


class AftercareTreatmentPlanContext(BaseModel):
    title: str
    description: str | None = None
    status: str
    current_step: str
    step_description: str | None = None
    target_tooth: str | None = None


class AftercarePrescriptionItem(BaseModel):
    medicine_name: str
    dosage: str
    frequency: str | None = None
    duration: str | None = None
    instruction: str | None = None


class AftercareRequest(BaseModel):
    medical_record: MedicalRecordContext
    service_name: str | None = None
    service_aftercare_notes: list[str] = Field(default_factory=list)
    treatment_plan: AftercareTreatmentPlanContext | None = None
    prescriptions: list[AftercarePrescriptionItem] = Field(default_factory=list)
    follow_up_date: str | None = None


class AftercareResponse(BaseModel):
    instructions: list[str] = Field(default_factory=list)
    warning_signs: list[str] = Field(default_factory=list)
    medication_schedule: list[str] = Field(default_factory=list)
    follow_up: str | None = None
    draft_text: str = ""
    disclaimer: str = (
        "Nội dung do AI soạn là bản nháp. "
        "Bác sĩ phải kiểm tra trước khi gửi cho bệnh nhân."
    )


class TreatmentPlanExplanationInputStep(BaseModel):
    title: str
    description: str | None = None
    target_tooth: str | None = None
    status: str
    estimated_cost: int | float | None = None
    expected_date: str | None = None
    duration_minutes: int | None = None
    service_name: str | None = None
    treatment_method_name: str | None = None


class TreatmentPlanExplanationRequest(BaseModel):
    plan_title: str
    plan_description: str | None = None
    status: str
    start_date: str | None = None
    expected_end_date: str | None = None
    steps: list[TreatmentPlanExplanationInputStep] = Field(default_factory=list)
    catalog: str | None = None


class TreatmentPlanExplanationStep(BaseModel):
    title: str
    explanation: str
    estimated_cost: int | float | None = None
    duration_hint: str | None = None


class TreatmentPlanExplanationResponse(BaseModel):
    overview: str = ""
    steps: list[TreatmentPlanExplanationStep] = Field(default_factory=list)
    important_notes: list[str] = Field(default_factory=list)
    total_estimated_cost: int | float | None = None
    timeline: str | None = None
    draft_text: str = ""
    disclaimer: str = (
        "Bản giải thích chỉ hỗ trợ trao đổi. "
        "Bác sĩ xác nhận nội dung trước khi gửi cho bệnh nhân."
    )


class DentalFinding(BaseModel):
    fdi_tooth_number: int  # e.g., 11..48
    finding_type: str  # e.g., "Missing tooth", "Implant", "Residual root", "Crown / Bridge", "Root canal filling", "Filling", "Caries", "Periapical radiolucency"
    confidence: float  # 0.0 - 1.0 (e.g. 0.962)
    bounding_box: dict[str, float]  # {"x": 12.5, "y": 30.0, "width": 8.0, "height": 15.0} (% normalized)
    severity: str = "MEDIUM"  # LOW, MEDIUM, HIGH


class AnalyzeXrayRequest(BaseModel):
    image_url: str | None = None
    image_base64: str | None = None
    patient_id: str | None = None
    clinical_note_hint: str | None = None


class AnalyzeXrayResponse(BaseModel):
    is_radiograph: bool = True
    status: str = "PATHOLOGY_DETECTED"  # INVALID_IMAGE | HEALTHY | PATHOLOGY_DETECTED
    findings: list[DentalFinding] = Field(default_factory=list)
    total_findings: int = 0
    summary: str = ""
    diagnosis_suggestion: str | None = None
    treatment_recommendations: list[str] = Field(default_factory=list)
    annotated_image_url: str | None = None
    disclaimer: str = (
        "Kết quả phân tích X-quang bởi Dental Vision AI (Hybrid Cloud Pipeline). "
        "Bác sĩ cần đối chiếu lâm sàng trước khi đưa vào bệnh án."
    )


