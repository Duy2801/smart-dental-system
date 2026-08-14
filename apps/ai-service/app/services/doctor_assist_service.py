import json

from app.core import llm
from app.core.prompts import (
    AFTERCARE_SYSTEM,
    DRAFT_PRESCRIPTION_SYSTEM,
    DRAFT_RECORD_SYSTEM,
    DRAFT_TREATMENT_PLAN_SYSTEM,
    EXPLAIN_TREATMENT_PLAN_SYSTEM,
    SUMMARIZE_PATIENT_SYSTEM,
)
from app.core.rag import build_rag_block
from app.schemas.doctor_assist import (
    AftercareRequest,
    AftercareResponse,
    MedicalRecordDraftRequest,
    MedicalRecordDraftResponse,
    PrescriptionDraftRequest,
    PrescriptionDraftResponse,
    PrescriptionItemDraft,
    SummarizePatientRequest,
    SummarizePatientResponse,
    TreatmentPlanDraftRequest,
    TreatmentPlanDraftResponse,
    TreatmentPlanExplanationRequest,
    TreatmentPlanExplanationResponse,
    TreatmentPlanExplanationStep,
    TreatmentPlanStepDraft,
)


def _extract_json(text: str) -> dict:
    decoder = json.JSONDecoder()
    for index, char in enumerate(text):
        if char != "{":
            continue
        try:
            value, _ = decoder.raw_decode(text[index:])
        except json.JSONDecodeError:
            continue
        if isinstance(value, dict):
            return value
    return {}


def _string_list(value: object) -> list[str]:
    if not isinstance(value, list):
        return []
    return [item.strip() for item in value if isinstance(item, str) and item.strip()]


def _money(value: int | float) -> str:
    return f"{value:,.0f}".replace(",", ".") + " VND"


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
                    body.latest_medical_record,
                    " ".join(body.recent_prescriptions),
                    body.active_treatment_plan,
                    body.follow_up,
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
            f"Hồ sơ gần nhất:\n{body.latest_medical_record or 'Không có'}\n"
            f"Đơn thuốc gần đây: {', '.join(body.recent_prescriptions) or 'Không có'}\n"
            f"Kế hoạch đang thực hiện:\n{body.active_treatment_plan or 'Không có'}\n"
            f"Tái khám: {body.follow_up or 'Chưa có lịch'}\n"
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
                    body.transcript,
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
            f"Ghi chú hoặc transcript:\n{body.transcript or ''}\n\n"
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

    async def generate_aftercare(
        self, body: AftercareRequest
    ) -> AftercareResponse:
        raw = await llm.complete(
            AFTERCARE_SYSTEM,
            "Dữ liệu đã được bác sĩ lưu:\n"
            + body.model_dump_json(exclude_none=True)
            + '\nTrả JSON: {"instructions":[],"warning_signs":[]}',
        )
        data = _extract_json(raw)
        instructions = _string_list(data.get("instructions"))
        if not instructions:
            instructions = body.service_aftercare_notes
        warning_signs = _string_list(data.get("warning_signs"))
        medication_schedule = []
        for item in body.prescriptions:
            details = [item.dosage, item.frequency, item.duration, item.instruction]
            medication_schedule.append(
                f"{item.medicine_name}: "
                + ", ".join(part.strip() for part in details if part and part.strip())
            )
        follow_up = (
            f"Tái khám ngày {body.follow_up_date} theo lịch đã xác nhận."
            if body.follow_up_date
            else None
        )
        sections = []
        if instructions:
            sections.append(
                "Hướng dẫn chăm sóc:\n"
                + "\n".join(f"- {item}" for item in instructions)
            )
        if medication_schedule:
            sections.append(
                "Lịch dùng thuốc:\n"
                + "\n".join(f"- {item}" for item in medication_schedule)
            )
        if warning_signs:
            sections.append(
                "Dấu hiệu cần liên hệ phòng khám:\n"
                + "\n".join(f"- {item}" for item in warning_signs)
            )
        if follow_up:
            sections.append(follow_up)
        return AftercareResponse(
            instructions=instructions,
            warning_signs=warning_signs,
            medication_schedule=medication_schedule,
            follow_up=follow_up,
            draft_text="\n\n".join(sections),
        )

    async def explain_treatment_plan(
        self, body: TreatmentPlanExplanationRequest
    ) -> TreatmentPlanExplanationResponse:
        raw = await llm.complete(
            EXPLAIN_TREATMENT_PLAN_SYSTEM,
            "Kế hoạch và catalog từ cơ sở dữ liệu:\n"
            + body.model_dump_json(exclude_none=True)
            + '\nTrả JSON: {"overview":"","steps":[{"title":"","explanation":""}],"important_notes":[]}',
        )
        data = _extract_json(raw)
        generated_steps = [
            row for row in (data.get("steps") or []) if isinstance(row, dict)
        ]
        steps = []
        for index, source in enumerate(body.steps):
            generated = next(
                (
                    row
                    for row in generated_steps
                    if str(row.get("title") or "").strip().casefold()
                    == source.title.strip().casefold()
                ),
                generated_steps[index] if index < len(generated_steps) else {},
            )
            explanation = str(generated.get("explanation") or "").strip()
            steps.append(
                TreatmentPlanExplanationStep(
                    title=source.title,
                    explanation=explanation or source.description or source.title,
                    estimated_cost=source.estimated_cost,
                    duration_hint=(
                        f"{source.duration_minutes} phút"
                        if source.duration_minutes is not None
                        else None
                    ),
                )
            )
        overview = str(data.get("overview") or "").strip()
        overview = overview or body.plan_description or body.plan_title
        important_notes = _string_list(data.get("important_notes"))
        costs = [step.estimated_cost for step in steps if step.estimated_cost is not None]
        total_cost = sum(costs) if costs else None
        if body.start_date and body.expected_end_date:
            timeline = f"Dự kiến từ {body.start_date} đến {body.expected_end_date}."
        elif body.expected_end_date:
            timeline = f"Dự kiến hoàn tất vào {body.expected_end_date}."
        elif body.start_date:
            timeline = f"Dự kiến bắt đầu vào {body.start_date}."
        else:
            timeline = None
        lines = [overview]
        if timeline:
            lines.append(timeline)
        for index, step in enumerate(steps, 1):
            details = [step.explanation]
            if step.estimated_cost is not None:
                details.append(f"Chi phí ước tính: {_money(step.estimated_cost)}")
            if step.duration_hint:
                details.append(f"Thời lượng dự kiến: {step.duration_hint}")
            lines.append(f"Bước {index}. {step.title}\n" + "\n".join(details))
        if total_cost is not None:
            lines.append(f"Tổng chi phí ước tính: {_money(total_cost)}")
        if important_notes:
            lines.append(
                "Lưu ý:\n" + "\n".join(f"- {note}" for note in important_notes)
            )
        return TreatmentPlanExplanationResponse(
            overview=overview,
            steps=steps,
            important_notes=important_notes,
            total_estimated_cost=total_cost,
            timeline=timeline,
            draft_text="\n\n".join(lines),
        )
