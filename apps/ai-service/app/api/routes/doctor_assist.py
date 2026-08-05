from fastapi import APIRouter

from app.schemas.doctor_assist import (
    MedicalRecordDraftRequest,
    MedicalRecordDraftResponse,
    PrescriptionDraftRequest,
    PrescriptionDraftResponse,
    SummarizePatientRequest,
    SummarizePatientResponse,
    TreatmentPlanDraftRequest,
    TreatmentPlanDraftResponse,
)
from app.services.doctor_assist_service import DoctorAssistService

router = APIRouter()
service = DoctorAssistService()


@router.post("/summarize-patient", response_model=SummarizePatientResponse)
async def summarize_patient(body: SummarizePatientRequest):
    """Tóm tắt trước khám / trước tư vấn video cho bác sĩ."""
    return await service.summarize_patient(body)


@router.post("/draft-medical-record", response_model=MedicalRecordDraftResponse)
async def draft_medical_record(body: MedicalRecordDraftRequest):
    """Gợi ý điền HSBA — bác sĩ phải duyệt trước khi lưu."""
    return await service.draft_medical_record(body)


@router.post("/draft-prescription", response_model=PrescriptionDraftResponse)
async def draft_prescription(body: PrescriptionDraftRequest):
    """Gợi ý nháp đơn thuốc — bác sĩ phải duyệt trước khi lưu."""
    return await service.draft_prescription(body)


@router.post("/draft-treatment-plan", response_model=TreatmentPlanDraftResponse)
async def draft_treatment_plan(body: TreatmentPlanDraftRequest):
    """Gợi ý nháp kế hoạch điều trị — bác sĩ phải duyệt trước khi lưu."""
    return await service.draft_treatment_plan(body)
