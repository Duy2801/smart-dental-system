import unittest
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.config import get_settings
from app.main import app
from app.services.doctor_assist_service import _extract_json


class DoctorAssistTest(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.headers = {"x-api-key": get_settings().ai_service_api_key}

    def test_extract_json_accepts_fences_and_trailing_text(self):
        self.assertEqual(
            _extract_json('Kết quả:\n```json\n{"ok":true,"nested":{"x":1}}\n```\nxong'),
            {"ok": True, "nested": {"x": 1}},
        )

    def test_doctor_routes_require_key_but_chatbot_stays_compatible(self):
        self.assertEqual(
            self.client.post("/api/v1/doctor/summarize-patient", json={}).status_code,
            401,
        )
        self.assertNotEqual(
            self.client.post(
                "/api/v1/chatbot/receptionist-chat", json={"message": "test"}
            ).status_code,
            401,
        )

    def test_production_rejects_the_shared_development_key(self):
        with patch.dict("os.environ", {"NODE_ENV": "production"}):
            with self.assertRaises(RuntimeError):
                get_settings()

    @patch(
        "app.services.doctor_assist_service.llm.complete",
        new_callable=AsyncMock,
    )
    def test_aftercare_keeps_prescription_schedule_from_input(self, complete):
        complete.return_value = (
            '{"instructions":["Chườm lạnh theo hướng dẫn"],'
            '"warning_signs":["Sưng tăng nhanh"]}'
        )
        response = self.client.post(
            "/api/v1/doctor/generate-aftercare",
            headers=self.headers,
            json={
                "medical_record": {"diagnosis": "Sau nhổ răng"},
                "service_name": "Nhổ răng",
                "prescriptions": [
                    {
                        "medicine_name": "Paracetamol",
                        "dosage": "500 mg",
                        "frequency": "2 lần/ngày",
                        "duration": "3 ngày",
                    }
                ],
                "follow_up_date": "2026-08-20",
            },
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(
            data["medication_schedule"],
            ["Paracetamol: 500 mg, 2 lần/ngày, 3 ngày"],
        )
        self.assertIn("2026-08-20", data["follow_up"])

    @patch(
        "app.services.doctor_assist_service.llm.complete",
        new_callable=AsyncMock,
    )
    def test_treatment_plan_ignores_generated_price(self, complete):
        complete.return_value = (
            '{"overview":"Giải thích dễ hiểu",'
            '"steps":[{"title":"Trám răng","explanation":"Phục hồi mô răng",'
            '"estimated_cost":999999999}],"important_notes":[]}'
        )
        response = self.client.post(
            "/api/v1/doctor/explain-treatment-plan",
            headers=self.headers,
            json={
                "plan_title": "Điều trị sâu răng",
                "status": "IN_PROGRESS",
                "steps": [
                    {
                        "title": "Trám răng",
                        "status": "PLANNED",
                        "estimated_cost": 1200000,
                        "duration_minutes": 45,
                    }
                ],
            },
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["steps"][0]["estimated_cost"], 1200000)
        self.assertEqual(data["total_estimated_cost"], 1200000)
        self.assertEqual(data["steps"][0]["duration_hint"], "45 phút")


if __name__ == "__main__":
    unittest.main()
