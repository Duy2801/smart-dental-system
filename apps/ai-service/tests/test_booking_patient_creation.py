import pytest
from unittest.mock import AsyncMock, patch
from app.services.booking_agent import (
    BookingAgent,
    booking_intent,
    parse_new_patient_info,
)
from app.schemas import ChatRequest, ChatMessage


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

