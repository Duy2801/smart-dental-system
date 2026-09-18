import pytest
from unittest.mock import AsyncMock, patch
from app.services.booking_agent import (
    BookingAgent,
    booking_intent,
    date_suggestions,
    method_suggestions,
    normalize_text,
    parse_new_patient_info,
    service_suggestions,
    slot_suggestions,
)
from app.schemas.chatbot import ChatMessage, ChatRequest, ChatResponse


def test_parse_new_patient_info():
    info = parse_new_patient_info("bé 6 tuổi nhổ răng sữa 0987654321")
    assert info.get("age") == 6
    assert info.get("relationship") == "CHILD"
    assert info.get("phone") == "0987654321"

    info_with_name = parse_new_patient_info("Tạo hồ sơ cho bé Nguyễn Văn An 8t nam")
    assert info_with_name.get("fullName") == "Nguyễn Văn An"
    assert info_with_name.get("age") == 8
    assert info_with_name.get("gender") == "MALE"
    assert info_with_name.get("relationship") == "CHILD"


def test_booking_intent_detection():
    assert booking_intent("6 tuổi , nhổ răng sữa , thời gian chắc 8h30 ngày 1/9 , 0123456789") is True
    assert booking_intent("Tôi muốn đặt lịch khám") is True
    assert booking_intent("Đặt lịch cho con") is True
    assert booking_intent("Tạo hồ sơ người thân") is True
    assert booking_intent("Niềng răng giá bao nhiêu?") is False


@pytest.mark.asyncio
async def test_booking_agent_asks_name_for_new_patient():
    agent = BookingAgent()

    req = ChatRequest(
        message="6 tuổi, nhổ răng sữa, 8h30 ngày 1/9",
        created_by_user_id="user-123",
        history=[],
        metadata={},
    )

    with patch("app.services.booking_agent.fetch_available_services", new_callable=AsyncMock) as mock_services, \
         patch("app.services.booking_agent.fetch_available_doctors", new_callable=AsyncMock) as mock_doctors, \
         patch("app.services.booking_agent.fetch_patient_profiles", new_callable=AsyncMock) as mock_patients:

        mock_services.return_value = [{"id": "srv-1", "name": "Nhổ răng sữa", "treatmentMethods": [{"id": "tm-1", "name": "Nhổ răng sữa"}]}]
        mock_doctors.return_value = []
        mock_patients.return_value = [{"id": "pat-self", "fullName": "Bố", "relationship": "SELF", "canBook": True}]

        res = await agent.process_chat(req)

        assert res.should_book is True
        assert "Họ và tên đầy đủ" in res.reply
        assert res.metadata.get("bookingState", {}).get("creatingNewPatient") is True


@pytest.mark.asyncio
async def test_booking_agent_creates_patient_when_name_provided():
    agent = BookingAgent()

    req = ChatRequest(
        message="Bé Su",
        created_by_user_id="user-123",
        history=[],
        metadata={
            "bookingState": {
                "creatingNewPatient": True,
                "newPatientRelationship": "CHILD",
                "newPatientDob": "2020-01-01",
                "serviceId": "srv-1",
                "serviceName": "Nhổ răng sữa",
                "date": "2026-09-01",
                "time": "08:30",
            }
        },
    )

    with patch("app.services.booking_agent.fetch_available_services", new_callable=AsyncMock) as mock_services, \
         patch("app.services.booking_agent.fetch_available_doctors", new_callable=AsyncMock) as mock_doctors, \
         patch("app.services.booking_agent.fetch_patient_profiles", new_callable=AsyncMock) as mock_patients, \
         patch("app.services.booking_agent.create_patient_profile", new_callable=AsyncMock) as mock_create_patient:

        mock_services.return_value = [{"id": "srv-1", "name": "Nhổ răng sữa", "treatmentMethods": [{"id": "tm-1", "name": "Nhổ răng sữa"}]}]
        mock_doctors.return_value = [{"id": "doc-1", "fullName": "Bác sĩ A"}]
        mock_patients.return_value = []
        mock_create_patient.return_value = {"id": "pat-new-su", "fullName": "Bé Su", "relationship": "CHILD"}

        res = await agent.process_chat(req)

        mock_create_patient.assert_called_once_with(
            user_id="user-123",
            full_name="Bé Su",
            date_of_birth="2020-01-01",
            gender=None,
            phone=None,
            relationship="CHILD",
        )
        assert res.metadata.get("bookingState", {}).get("patientId") == "pat-new-su"
        assert res.metadata.get("bookingState", {}).get("patientName") == "Bé Su"


@pytest.mark.asyncio
async def test_booking_agent_self_booking_with_doctor():
    agent = BookingAgent()

    req = ChatRequest(
        message="tôi muốn đặt lichj với bác sĩ Bùi Đức Tâm",
        created_by_user_id="user-123",
        history=[],
        metadata={},
    )

    with patch("app.services.booking_agent.fetch_available_services", new_callable=AsyncMock) as mock_services, \
         patch("app.services.booking_agent.fetch_available_doctors", new_callable=AsyncMock) as mock_doctors, \
         patch("app.services.booking_agent.fetch_patient_profiles", new_callable=AsyncMock) as mock_patients:

        mock_services.return_value = [{"id": "srv-1", "name": "Khám tổng quát", "treatmentMethods": [{"id": "tm-1", "name": "Khám tổng quát"}]}]
        mock_doctors.return_value = [{"id": "doc-tam", "fullName": "BS. Bùi Đức Tâm"}]
        mock_patients.return_value = [{"id": "pat-self", "fullName": "Nguyễn Văn Nam", "relationship": "SELF", "isPrimary": True, "canBook": True}]

        res = await agent.process_chat(req)

        assert res.should_book is True
        # Should auto-select self patient and NOT ask for relative info
        assert "người thân" not in res.reply.lower()
        # Should ask for service
        assert "dịch vụ nha khoa" in res.reply.lower() or "dịch vụ" in res.reply.lower()
        state = res.metadata.get("bookingState", {})
        assert state.get("patientId") == "pat-self"
        assert state.get("doctorId") == "doc-tam"


@pytest.mark.asyncio
async def test_general_question_after_completed_booking_starts_a_clean_conversation():
    agent = BookingAgent()
    completed_state = {
        "patientId": "patient-1",
        "serviceId": "service-1",
        "treatmentMethodId": "method-1",
        "date": "2026-09-20",
        "time": "08:00",
        "doctorId": "doctor-1",
        "confirmBooking": True,
    }
    req = ChatRequest(
        message="Răng đau là bị gì?",
        created_by_user_id="user-123",
        history=[
            ChatMessage(
                role="user",
                content="Tôi xác nhận đặt lịch",
                metadata={"bookingState": completed_state},
            ),
            ChatMessage(
                role="assistant",
                content="Xác nhận đặt lịch thành công",
                metadata={"bookingCompleted": True},
            ),
        ],
        metadata={},
    )

    with patch("app.services.booking_agent.fetch_available_services", new_callable=AsyncMock) as mock_services, \
         patch("app.services.booking_agent.fetch_available_doctors", new_callable=AsyncMock) as mock_doctors, \
         patch("app.services.booking_agent.fetch_patient_profiles", new_callable=AsyncMock) as mock_patients, \
         patch.object(agent, "answer_general_question", new_callable=AsyncMock) as mock_general:
        mock_services.return_value = []
        mock_doctors.return_value = []
        mock_patients.return_value = []
        mock_general.return_value = ChatResponse(
            reply="Đau răng có thể xuất phát từ sâu răng hoặc viêm tủy.",
            should_book=False,
        )

        res = await agent.process_chat(req)

        assert res.should_book is False
        assert "Đau răng" in res.reply
        mock_general.assert_awaited_once()


@pytest.mark.asyncio
async def test_new_booking_after_completed_booking_does_not_reuse_old_details():
    agent = BookingAgent()
    completed_state = {
        "patientId": "patient-1",
        "serviceId": "old-service",
        "treatmentMethodId": "old-method",
        "date": "2026-09-20",
        "time": "08:00",
        "doctorId": "old-doctor",
        "confirmBooking": True,
    }
    req = ChatRequest(
        message="Tôi muốn đặt thêm lịch",
        created_by_user_id="user-123",
        history=[
            ChatMessage(
                role="user",
                content="Tôi xác nhận đặt lịch",
                metadata={"bookingState": completed_state},
            ),
            ChatMessage(
                role="assistant",
                content="Xác nhận đặt lịch thành công",
                metadata={"bookingCompleted": True},
            ),
        ],
        metadata={},
    )

    with patch("app.services.booking_agent.fetch_available_services", new_callable=AsyncMock) as mock_services, \
         patch("app.services.booking_agent.fetch_available_doctors", new_callable=AsyncMock) as mock_doctors, \
         patch("app.services.booking_agent.fetch_patient_profiles", new_callable=AsyncMock) as mock_patients:
        mock_services.return_value = [
            {"id": "service-1", "name": "Khám tổng quát", "treatmentMethods": []}
        ]
        mock_doctors.return_value = []
        mock_patients.return_value = [
            {
                "id": "patient-1",
                "fullName": "Nguyễn Văn An",
                "isPrimary": True,
                "canBook": True,
            }
        ]

        res = await agent.process_chat(req)

        state = res.metadata.get("bookingState", {})
        assert res.should_book is True
        assert state.get("patientId") == "patient-1"
        assert state.get("serviceId") is None
        assert state.get("treatmentMethodId") is None
        assert state.get("doctorId") is None


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "question",
    [
        "Nha khoa có nuôi chó không?",
        "Nha khoa có bao nhiêu bác sĩ?",
        "Răng đau là bị gì?",
    ],
)
async def test_question_interrupts_active_booking_without_losing_progress(question):
    agent = BookingAgent()
    active_state = {
        "patientId": "patient-1",
        "patientName": "Nguyen Van An",
        "serviceId": "service-1",
        "serviceName": "Kham tong quat",
        "treatmentMethodId": "method-1",
        "treatmentMethodName": "Kham tong quat",
        "date": "2026-09-21",
    }
    req = ChatRequest(
        message=question,
        created_by_user_id="user-123",
        metadata={"bookingState": active_state},
    )

    with patch("app.services.booking_agent.fetch_available_services", new_callable=AsyncMock) as mock_services, \
         patch("app.services.booking_agent.fetch_available_doctors", new_callable=AsyncMock) as mock_doctors, \
         patch("app.services.booking_agent.fetch_patient_profiles", new_callable=AsyncMock) as mock_patients, \
         patch.object(agent, "answer_general_question", new_callable=AsyncMock) as mock_general:
        mock_services.return_value = []
        mock_doctors.return_value = []
        mock_patients.return_value = []
        mock_general.return_value = ChatResponse(
            reply="Cau tra loi tu van",
            should_book=False,
        )

        res = await agent.process_chat(req)

    assert res.should_book is False
    assert res.reply == "Cau tra loi tu van"
    assert res.metadata.get("bookingState") == active_state


def test_booking_suggestions_preserve_a_preselected_doctor():
    state = {
        "patientId": "patient-1",
        "doctorId": "doctor-1",
        "doctorName": "BS Nguyen Van A",
    }
    service = {
        "id": "service-1",
        "name": "Kham tong quat",
        "treatmentMethods": [
            {"id": "method-1", "name": "Kham tong quat"},
        ],
    }
    dates = [
        {
            "id": "2026-09-21",
            "weekday": "T2",
            "day": "21",
            "month": "Thg 9",
            "isOpen": True,
        }
    ]

    service_state = service_suggestions([service], state)[0]["metadata"]["bookingState"]
    method_state = method_suggestions(service, {**state, "serviceId": "service-1"})[0]["metadata"]["bookingState"]
    date_state = date_suggestions(dates, {**state, "serviceId": "service-1", "treatmentMethodId": "method-1"})[0]["metadata"]["bookingState"]
    slot_state = slot_suggestions(
        ["08:00"],
        {
            **state,
            "serviceId": "service-1",
            "treatmentMethodId": "method-1",
            "date": "2026-09-21",
        },
    )[0]["metadata"]["bookingState"]

    assert service_state["doctorId"] == "doctor-1"
    assert method_state["doctorId"] == "doctor-1"
    assert date_state["doctorId"] == "doctor-1"
    assert slot_state["doctorId"] == "doctor-1"


@pytest.mark.asyncio
async def test_preselected_doctor_without_schedule_never_receives_other_doctors_dates():
    agent = BookingAgent()
    req = ChatRequest(
        message="Toi chon dich vu Kham tong quat",
        created_by_user_id="user-123",
        metadata={
            "bookingState": {
                "patientId": "patient-1",
                "patientName": "Nguyen Van An",
                "serviceId": "service-1",
                "serviceName": "Kham tong quat",
                "treatmentMethodId": "method-1",
                "treatmentMethodName": "Kham tong quat",
                "doctorId": "doctor-no-schedule",
                "doctorName": "BS Khong Co Lich",
            }
        },
    )

    async def booking_options(**kwargs):
        if kwargs.get("doctor_id") == "doctor-no-schedule":
            return {
                "selectedServiceId": "service-1",
                "dates": [
                    {
                        "id": "2026-09-21",
                        "weekday": "T2",
                        "day": "21",
                        "month": "Thg 9",
                        "isOpen": False,
                    }
                ],
                "timeSlots": [],
                "doctors": [],
            }
        return {
            "selectedServiceId": "service-1",
            "dates": [
                {
                    "id": "2026-09-21",
                    "weekday": "T2",
                    "day": "21",
                    "month": "Thg 9",
                    "isOpen": True,
                }
            ],
            "timeSlots": ["08:00"],
            "doctors": [{"id": "doctor-other", "name": "BS Co Lich"}],
        }

    with patch("app.services.booking_agent.fetch_available_services", new_callable=AsyncMock) as mock_services, \
         patch("app.services.booking_agent.fetch_available_doctors", new_callable=AsyncMock) as mock_doctors, \
         patch("app.services.booking_agent.fetch_patient_profiles", new_callable=AsyncMock) as mock_patients, \
         patch("app.services.booking_agent.fetch_booking_options", new=AsyncMock(side_effect=booking_options)):
        mock_services.return_value = [
            {
                "id": "service-1",
                "name": "Kham tong quat",
                "treatmentMethods": [
                    {"id": "method-1", "name": "Kham tong quat"},
                ],
            }
        ]
        mock_doctors.return_value = [
            {"id": "doctor-no-schedule", "fullName": "BS Khong Co Lich"},
            {"id": "doctor-other", "fullName": "BS Co Lich"},
        ]
        mock_patients.return_value = [
            {"id": "patient-1", "fullName": "Nguyen Van An", "isPrimary": True},
        ]

        res = await agent.process_chat(req)

    assert "khong co lich" in normalize_text(res.reply)
    assert not any(item.type in {"date", "time_slot"} for item in res.suggestions)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("message", "state_overrides"),
    [
        ("Tôi muốn đổi ngày", {"date": "2026-09-21", "time": "08:00"}),
        ("Tôi muốn đổi giờ", {"date": "2026-09-21", "time": "08:00"}),
    ],
)
async def test_changing_date_or_time_keeps_the_preselected_doctor(
    message,
    state_overrides,
):
    agent = BookingAgent()
    state = {
        "patientId": "patient-1",
        "patientName": "Nguyen Van An",
        "serviceId": "service-1",
        "serviceName": "Kham tong quat",
        "treatmentMethodId": "method-1",
        "treatmentMethodName": "Kham tong quat",
        "doctorId": "doctor-1",
        "doctorName": "BS Nguyen Van A",
        **state_overrides,
    }
    req = ChatRequest(
        message=message,
        created_by_user_id="user-123",
        metadata={"bookingState": state},
    )

    with patch("app.services.booking_agent.fetch_available_services", new_callable=AsyncMock) as mock_services, \
         patch("app.services.booking_agent.fetch_available_doctors", new_callable=AsyncMock) as mock_doctors, \
         patch("app.services.booking_agent.fetch_patient_profiles", new_callable=AsyncMock) as mock_patients, \
         patch("app.services.booking_agent.fetch_booking_options", new_callable=AsyncMock) as mock_options:
        mock_services.return_value = [
            {
                "id": "service-1",
                "name": "Kham tong quat",
                "treatmentMethods": [
                    {"id": "method-1", "name": "Kham tong quat"},
                ],
            }
        ]
        mock_doctors.return_value = [
            {"id": "doctor-1", "fullName": "BS Nguyen Van A"},
        ]
        mock_patients.return_value = [
            {"id": "patient-1", "fullName": "Nguyen Van An", "isPrimary": True},
        ]
        mock_options.return_value = {
            "selectedServiceId": "service-1",
            "dates": [
                {
                    "id": "2026-09-22",
                    "weekday": "T3",
                    "day": "22",
                    "month": "Thg 9",
                    "isOpen": True,
                }
            ],
            "timeSlots": ["09:00"],
            "doctors": [
                {"id": "doctor-1", "name": "BS Nguyen Van A"},
            ],
        }

        res = await agent.process_chat(req)

    assert res.metadata["bookingState"]["doctorId"] == "doctor-1"


@pytest.mark.asyncio
async def test_preselected_doctor_without_slots_on_selected_date_does_not_show_other_slots():
    agent = BookingAgent()
    req = ChatRequest(
        message="Toi muon kham ngay 2026-09-21",
        created_by_user_id="user-123",
        metadata={
            "bookingState": {
                "patientId": "patient-1",
                "patientName": "Nguyen Van An",
                "serviceId": "service-1",
                "serviceName": "Kham tong quat",
                "treatmentMethodId": "method-1",
                "treatmentMethodName": "Kham tong quat",
                "doctorId": "doctor-no-schedule",
                "doctorName": "BS Khong Co Lich",
                "date": "2026-09-21",
            }
        },
    )

    with patch("app.services.booking_agent.fetch_available_services", new_callable=AsyncMock) as mock_services, \
         patch("app.services.booking_agent.fetch_available_doctors", new_callable=AsyncMock) as mock_doctors, \
         patch("app.services.booking_agent.fetch_patient_profiles", new_callable=AsyncMock) as mock_patients, \
         patch("app.services.booking_agent.fetch_booking_options", new_callable=AsyncMock) as mock_options:
        mock_services.return_value = [
            {
                "id": "service-1",
                "name": "Kham tong quat",
                "treatmentMethods": [
                    {"id": "method-1", "name": "Kham tong quat"},
                ],
            }
        ]
        mock_doctors.return_value = [
            {"id": "doctor-no-schedule", "fullName": "BS Khong Co Lich"},
        ]
        mock_patients.return_value = [
            {"id": "patient-1", "fullName": "Nguyen Van An", "isPrimary": True},
        ]
        mock_options.return_value = {
            "selectedServiceId": "service-1",
            "dates": [],
            "timeSlots": [],
            "doctors": [],
        }

        res = await agent.process_chat(req)

    assert "bac si" in normalize_text(res.reply)
    assert "khong co lich" in normalize_text(res.reply)
    assert not any(item.type == "time_slot" for item in res.suggestions)
    assert any(item.label == "Chọn bác sĩ khác" for item in res.suggestions)

