from secrets import compare_digest

from fastapi import APIRouter, Depends, Header, HTTPException

from app.config import get_settings
from app.schemas.doctor_assist import (
    AftercareRequest,
    AftercareResponse,
    AnalyzeXrayRequest,
    AnalyzeXrayResponse,
    MedicalRecordDraftRequest,
    MedicalRecordDraftResponse,
    PrescriptionDraftRequest,
    PrescriptionDraftResponse,
    SummarizePatientRequest,
    SummarizePatientResponse,
    TreatmentPlanDraftRequest,
    TreatmentPlanDraftResponse,
    TreatmentPlanExplanationRequest,
    TreatmentPlanExplanationResponse,
)
from app.services.doctor_assist_service import DoctorAssistService


def require_api_key(x_api_key: str | None = Header(default=None)):
    expected = get_settings().ai_service_api_key
    if not expected or not compare_digest(x_api_key or "", expected):
        raise HTTPException(status_code=401, detail="Invalid AI service API key")


router = APIRouter(dependencies=[Depends(require_api_key)])
service = DoctorAssistService()


@router.post("/summarize-patient", response_model=SummarizePatientResponse)
async def summarize_patient(body: SummarizePatientRequest):
    """Tóm tắt trước khám / trước tư vấn video cho bác sĩ."""
    return await service.summarize_patient(body)


@router.post("/draft-medical-record", response_model=MedicalRecordDraftResponse)
async def draft_medical_record(body: MedicalRecordDraftRequest):
    """Gợi ý điền HSBA để bác sĩ duyệt trước khi lưu."""
    return await service.draft_medical_record(body)


@router.post("/draft-prescription", response_model=PrescriptionDraftResponse)
async def draft_prescription(body: PrescriptionDraftRequest):
    """Gợi ý nháp đơn thuốc để bác sĩ duyệt trước khi lưu."""
    return await service.draft_prescription(body)


@router.post("/draft-treatment-plan", response_model=TreatmentPlanDraftResponse)
async def draft_treatment_plan(body: TreatmentPlanDraftRequest):
    """Gợi ý nháp kế hoạch điều trị để bác sĩ duyệt trước khi lưu."""
    return await service.draft_treatment_plan(body)


@router.post("/generate-aftercare", response_model=AftercareResponse)
async def generate_aftercare(body: AftercareRequest):
    """Soạn nháp hướng dẫn sau điều trị để bác sĩ duyệt."""
    return await service.generate_aftercare(body)


@router.post(
    "/explain-treatment-plan", response_model=TreatmentPlanExplanationResponse
)
async def explain_treatment_plan(body: TreatmentPlanExplanationRequest):
    """Giải thích kế hoạch đã lưu bằng dữ liệu giá và thời lượng thật."""
    return await service.explain_treatment_plan(body)


@router.post("/analyze-xray", response_model=AnalyzeXrayResponse)
async def analyze_xray(body: AnalyzeXrayRequest):
    """Phân tích ảnh X-Quang Panorama phát hiện 8 loại tổn thương & răng FDI."""
    return await service.analyze_xray(body)
