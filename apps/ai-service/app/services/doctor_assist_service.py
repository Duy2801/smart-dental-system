import json
import re

from app.core import llm
from app.core.prompts import DRAFT_RECORD_SYSTEM, SUMMARIZE_PATIENT_SYSTEM
from app.schemas.doctor_assist import (
    MedicalRecordDraftRequest,
    MedicalRecordDraftResponse,
    SummarizePatientRequest,
    SummarizePatientResponse,
)


def _extract_json(text: str) -> dict:
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        return {}
    try:
        return json.loads(match.group())
    except json.JSONDecodeError:
        return {}


class DoctorAssistService:
    async def summarize_patient(
        self, body: SummarizePatientRequest
    ) -> SummarizePatientResponse:
        chat = "\n".join(
            f"{m.role}: {m.content}" for m in body.chatbot_messages[-20:]
        )
        user = (
            f"BN: {body.patient_name or 'N/A'}\n"
            f"Tiền sử: {body.medical_history or 'Không có'}\n"
            f"Chẩn đoán gần đây: {', '.join(body.recent_diagnoses) or 'Không có'}\n"
            f"Dịch vụ sắp tới: {body.upcoming_service or 'N/A'}\n"
            f"Chatbot:\n{chat or '(trống)'}\n\n"
            'Trả JSON: {"bullet_points":[],"questions_to_ask":[],"risk_flags":[]}'
        )
        raw = await llm.complete(SUMMARIZE_PATIENT_SYSTEM, user)
        data = _extract_json(raw)
        if data:
            return SummarizePatientResponse(
                bullet_points=data.get("bullet_points") or [raw],
                questions_to_ask=data.get("questions_to_ask") or [],
                risk_flags=data.get("risk_flags") or [],
            )
        return SummarizePatientResponse(bullet_points=[raw])

    async def draft_medical_record(
        self, body: MedicalRecordDraftRequest
    ) -> MedicalRecordDraftResponse:
        user = (
            f"Lý do khám: {body.chief_complaint or ''}\n"
            f"Tóm tắt chatbot: {body.chatbot_summary or ''}\n"
            f"Dịch vụ: {body.service_name or ''}\n"
            f"Gợi ý BS: {body.doctor_notes_hint or ''}\n\n"
            'Trả JSON: {"chief_complaint":"","diagnosis_draft":"","treatment_notes_draft":""}'
        )
        raw = await llm.complete(DRAFT_RECORD_SYSTEM, user)
        data = _extract_json(raw)
        if data:
            return MedicalRecordDraftResponse(
                chief_complaint=data.get("chief_complaint"),
                diagnosis_draft=data.get("diagnosis_draft"),
                treatment_notes_draft=data.get("treatment_notes_draft"),
            )
        return MedicalRecordDraftResponse(treatment_notes_draft=raw)
