import json
import re

from app.core import llm
from app.core.prompts import (
    DRAFT_PRESCRIPTION_SYSTEM,
    DRAFT_RECORD_SYSTEM,
    DRAFT_TREATMENT_PLAN_SYSTEM,
    SUMMARIZE_PATIENT_SYSTEM,
)
from app.core.rag import build_rag_block
from app.schemas.doctor_assist import (
    MedicalRecordDraftRequest,
    MedicalRecordDraftResponse,
    PrescriptionDraftRequest,
    PrescriptionDraftResponse,
    PrescriptionItemDraft,
    SummarizePatientRequest,
    SummarizePatientResponse,
    TreatmentPlanDraftRequest,
    TreatmentPlanDraftResponse,
    TreatmentPlanStepDraft,
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
        query = " ".join(
            filter(
                None,
                [
                    body.medical_history,
                    " ".join(body.recent_diagnoses),
                    body.upcoming_service,
                    chat,
                ],
            )
        )
        rag = build_rag_block(query or "protocol khám gấp dị ứng", top_k=3)
        parts = []
        if rag:
            parts.append(rag)
        parts.append(
            f"BN: {body.patient_name or 'N/A'}\n"
            f"Tiền sử: {body.medical_history or 'Không có'}\n"
            f"Chẩn đoán gần đây: {', '.join(body.recent_diagnoses) or 'Không có'}\n"
            f"Dịch vụ sắp tới: {body.upcoming_service or 'N/A'}\n"
            f"Chatbot:\n{chat or '(trống)'}\n\n"
            'Trả JSON: {"bullet_points":[],"questions_to_ask":[],"risk_flags":[]}'
        )
        raw = await llm.complete(SUMMARIZE_PATIENT_SYSTEM, "\n\n".join(parts))
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
        query = " ".join(
            filter(
                None,
                [
                    body.chief_complaint,
                    body.chatbot_summary,
                    body.service_name,
                    body.doctor_notes_hint,
                ],
            )
        )
        rag = build_rag_block(query or "hsba", top_k=3)
        parts = []
        if rag:
            parts.append(rag)
        parts.append(
            f"Lý do khám: {body.chief_complaint or ''}\n"
            f"Tóm tắt chatbot: {body.chatbot_summary or ''}\n"
            f"Dịch vụ: {body.service_name or ''}\n"
            f"Gợi ý BS: {body.doctor_notes_hint or ''}\n\n"
            'Trả JSON: {"chief_complaint":"","diagnosis_draft":"","treatment_notes_draft":""}'
        )
        raw = await llm.complete(DRAFT_RECORD_SYSTEM, "\n\n".join(parts))
        data = _extract_json(raw)
        if data:
            return MedicalRecordDraftResponse(
                chief_complaint=data.get("chief_complaint"),
                diagnosis_draft=data.get("diagnosis_draft"),
                treatment_notes_draft=data.get("treatment_notes_draft"),
            )
        return MedicalRecordDraftResponse(treatment_notes_draft=raw)

    async def draft_prescription(
        self, body: PrescriptionDraftRequest
    ) -> PrescriptionDraftResponse:
        query = " ".join(
            filter(
                None,
                [
                    body.diagnosis,
                    body.chief_complaint,
                    body.treatment_notes,
                    body.medical_history,
                    body.service_name,
                    "đơn thuốc dị ứng",
                ],
            )
        )
        rag = build_rag_block(query, top_k=3)
        parts = []
        if rag:
            parts.append(rag)
        parts.append(
            f"Chẩn đoán: {body.diagnosis or ''}\n"
            f"Lý do khám: {body.chief_complaint or ''}\n"
            f"Ghi chú ĐT: {body.treatment_notes or ''}\n"
            f"Tiền sử / dị ứng: {body.medical_history or 'Không có'}\n"
            f"Dịch vụ: {body.service_name or ''}\n"
            f"Gợi ý BS: {body.doctor_notes_hint or ''}\n\n"
            'Trả JSON: {"notes":"","items":[{"medicine_name":"","dosage":"","frequency":"","duration":"","instruction":""}],"allergy_warnings":[]}'
        )
        raw = await llm.complete(DRAFT_PRESCRIPTION_SYSTEM, "\n\n".join(parts))
        data = _extract_json(raw)
        if not data:
            return PrescriptionDraftResponse(notes=raw)
        items: list[PrescriptionItemDraft] = []
        for row in data.get("items") or []:
            if not isinstance(row, dict):
                continue
            name = (row.get("medicine_name") or "").strip()
            dosage = (row.get("dosage") or "").strip()
            if not name and not dosage:
                continue
            items.append(
                PrescriptionItemDraft(
                    medicine_name=name,
                    dosage=dosage,
                    frequency=row.get("frequency"),
                    duration=row.get("duration"),
                    instruction=row.get("instruction"),
                )
            )
        return PrescriptionDraftResponse(
            notes=data.get("notes"),
            items=items,
            allergy_warnings=[
                w for w in (data.get("allergy_warnings") or []) if isinstance(w, str) and w.strip()
            ],
        )

    async def draft_treatment_plan(
        self, body: TreatmentPlanDraftRequest
    ) -> TreatmentPlanDraftResponse:
        query = " ".join(
            filter(
                None,
                [
                    body.diagnosis,
                    body.chief_complaint,
                    body.treatment_notes,
                    body.service_name,
                    body.catalog,
                    "kế hoạch điều trị bảng giá",
                ],
            )
        )
        rag = build_rag_block(query, top_k=4)
        parts = []
        if rag:
            parts.append(rag)
        if body.catalog:
            parts.append(f"Catalog dịch vụ phòng khám:\n{body.catalog}")
        parts.append(
            f"Chẩn đoán: {body.diagnosis or ''}\n"
            f"Lý do khám: {body.chief_complaint or ''}\n"
            f"Ghi chú ĐT: {body.treatment_notes or ''}\n"
            f"Tiền sử: {body.medical_history or 'Không có'}\n"
            f"Dịch vụ hướng tới: {body.service_name or ''}\n"
            f"Gợi ý BS: {body.doctor_notes_hint or ''}\n\n"
            'Trả JSON: {"title":"","description":"","start_date":null,"expected_end_date":null,"steps":[{"title":"","description":"","target_tooth":null,"estimated_cost":0,"expected_date":null,"duration_hint":""}]}'
        )
        raw = await llm.complete(DRAFT_TREATMENT_PLAN_SYSTEM, "\n\n".join(parts))
        data = _extract_json(raw)
        if not data:
            return TreatmentPlanDraftResponse(description=raw)
        steps: list[TreatmentPlanStepDraft] = []
        for row in data.get("steps") or []:
            if not isinstance(row, dict):
                continue
            title = (row.get("title") or "").strip()
            if not title:
                continue
            cost = row.get("estimated_cost")
            try:
                cost_num = int(float(cost)) if cost is not None and cost != "" else None
            except (TypeError, ValueError):
                cost_num = None
            steps.append(
                TreatmentPlanStepDraft(
                    title=title,
                    description=row.get("description"),
                    target_tooth=row.get("target_tooth"),
                    estimated_cost=cost_num,
                    expected_date=row.get("expected_date"),
                    duration_hint=row.get("duration_hint"),
                )
            )
        return TreatmentPlanDraftResponse(
            title=data.get("title"),
            description=data.get("description"),
            start_date=data.get("start_date"),
            expected_end_date=data.get("expected_end_date"),
            steps=steps,
        )
