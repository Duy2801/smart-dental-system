import asyncio
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from unittest.mock import AsyncMock, patch
from app.services.booking_agent import (
    BookingAgent,
    booking_intent,
    parse_new_patient_info,
)
from app.schemas.chatbot import ChatRequest


def test_parse_new_patient_info():
    info = parse_new_patient_info("bé 6 tuổi nhổ răng sữa 0987654321")
    assert info.get("age") == 6, f"Expected age 6, got {info.get('age')}"
    assert info.get("relationship") == "CHILD", f"Expected relationship CHILD, got {info.get('relationship')}"
    assert info.get("phone") == "0987654321", f"Expected phone 0987654321, got {info.get('phone')}"

    info_with_name = parse_new_patient_info("Tạo hồ sơ cho bé Nguyễn Văn An 8t nam")
    assert info_with_name.get("fullName") == "Nguyễn Văn An", f"Expected fullName 'Nguyễn Văn An', got {info_with_name.get('fullName')}"
    assert info_with_name.get("age") == 8, f"Expected age 8, got {info_with_name.get('age')}"
    assert info_with_name.get("gender") == "MALE", f"Expected gender MALE, got {info_with_name.get('gender')}"
    assert info_with_name.get("relationship") == "CHILD", f"Expected relationship CHILD, got {info_with_name.get('relationship')}"
    print("[PASS] test_parse_new_patient_info passed")


def test_booking_intent_detection():
    assert booking_intent("6 tuổi , nhổ răng sữa , thời gian chắc 8h30 ngày 1/9 , 0123456789") is True
    assert booking_intent("Tôi muốn đặt lịch khám") is True
    assert booking_intent("Đặt lịch cho con") is True
    assert booking_intent("Tạo hồ sơ người thân") is True
    assert booking_intent("Niềng răng giá bao nhiêu?") is False
    assert booking_intent("nay tôi có lịch khám chưa") is False
    assert booking_intent("lịch khám của tôi") is False
    assert booking_intent("xem lịch khám hôm nay") is False
    print("[PASS] test_booking_intent_detection passed")


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
        assert "Họ và tên đầy đủ" in res.reply, f"Expected prompt for full name, got: {res.reply}"
        assert res.metadata.get("bookingState", {}).get("creatingNewPatient") is True
        print("[PASS] test_booking_agent_asks_name_for_new_patient passed")


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
        print("[PASS] test_booking_agent_creates_patient_when_name_provided passed")


async def test_booking_agent_answers_appointment_inquiry():
    agent = BookingAgent()

    req = ChatRequest(
        message="nay tôi có lịch khám chưa",
        created_by_user_id="user-123",
        history=[],
        metadata={},
    )

    with patch("app.services.booking_agent.fetch_available_services", new_callable=AsyncMock) as mock_services, \
         patch("app.services.booking_agent.fetch_available_doctors", new_callable=AsyncMock) as mock_doctors, \
         patch("app.services.booking_agent.fetch_patient_profiles", new_callable=AsyncMock) as mock_patients, \
         patch("app.services.booking_agent.fetch_user_appointments", new_callable=AsyncMock) as mock_user_appts, \
         patch("app.services.booking_agent.llm.complete", new_callable=AsyncMock) as mock_llm:

        mock_services.return_value = []
        mock_doctors.return_value = []
        mock_patients.return_value = []
        mock_user_appts.return_value = [{
            "appointmentCode": "APT12345",
            "patientName": "Đỗ Thị Lan",
            "doctorName": "Bác sĩ Nguyễn Văn A",
            "serviceName": "Khám tổng quát",
            "scheduledAt": "2026-08-29T11:00:00.000Z",
            "status": "CONFIRMED"
        }]
        mock_llm.return_value = "Dạ hôm nay quý khách Đỗ Thị Lan có 1 lịch khám tổng quát lúc 11:00 với Bác sĩ Nguyễn Văn A ạ."

        res = await agent.process_chat(req)

        assert res.should_book is False, f"Expected should_book=False, got {res.should_book}"
        assert "Đỗ Thị Lan" in res.reply, f"Expected 'Đỗ Thị Lan' in reply, got '{res.reply}'"
        mock_user_appts.assert_called_once_with("user-123")
        print("[PASS] test_booking_agent_answers_appointment_inquiry passed")


async def test_general_doctor_inquiry_does_not_trigger_booking_error():
    agent = BookingAgent()
    req = ChatRequest(
        created_by_user_id="user-123",
        patient_id="patient-999",
        message="cho tôi biết thông tin về bác sĩ chuyên nhổ răng khôn",
        history=[],
        metadata={},
    )

    with patch("app.services.booking_agent.fetch_available_services", new_callable=AsyncMock) as mock_services, \
         patch("app.services.booking_agent.fetch_available_doctors", new_callable=AsyncMock) as mock_doctors, \
         patch("app.services.booking_agent.fetch_patient_profiles", new_callable=AsyncMock) as mock_patients, \
         patch("app.services.booking_agent.fetch_user_appointments", new_callable=AsyncMock) as mock_user_appts, \
         patch("app.services.booking_agent.llm.complete", new_callable=AsyncMock) as mock_llm:

        mock_services.return_value = [{"id": "s1", "name": "Nhổ răng khôn", "price": 1500000}]
        mock_doctors.return_value = [{"id": "d1", "fullName": "BS. Phạm Bảo Long", "specialization": "Tiểu phẫu"}]
        mock_patients.return_value = []
        mock_user_appts.return_value = []
        mock_llm.return_value = "Tại Nha khoa Smart Dental, bác sĩ chuyên khoa tiểu phẫu nhổ răng khôn là BS. Phạm Bảo Long."

        res = await agent.process_chat(req)

        assert res.should_book is False, f"Expected should_book=False, got {res.should_book}"
        assert "Phạm Bảo Long" in res.reply, f"Expected 'Phạm Bảo Long' in reply, got '{res.reply}'"
        assert "không còn khả dụng" not in res.reply, "Should NOT trigger booking doctor error!"
        print("[PASS] test_general_doctor_inquiry_does_not_trigger_booking_error passed")


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
        assert "người thân" not in res.reply.lower(), f"Did not expect relative request, got: {res.reply}"
        assert "dịch vụ" in res.reply.lower(), f"Expected service prompt, got: {res.reply}"
        state = res.metadata.get("bookingState", {})
        assert state.get("patientId") == "pat-self", f"Expected patientId pat-self, got {state.get('patientId')}"
        assert state.get("doctorId") == "doc-tam", f"Expected doctorId doc-tam, got {state.get('doctorId')}"
        print("[PASS] test_booking_agent_self_booking_with_doctor passed")


async def main():
    test_parse_new_patient_info()
    test_booking_intent_detection()
    await test_booking_agent_asks_name_for_new_patient()
    await test_booking_agent_creates_patient_when_name_provided()
    await test_booking_agent_answers_appointment_inquiry()
    await test_general_doctor_inquiry_does_not_trigger_booking_error()
    await test_booking_agent_self_booking_with_doctor()
    print("\nALL TESTS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    asyncio.run(main())

