import unittest
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.config import get_settings
from app.main import app


class AdminAssistTest(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.headers = {"x-api-key": get_settings().ai_service_api_key}

    def test_requires_api_key(self):
        res = self.client.post(
            "/api/v1/admin/suggest-content",
            json={"kind": "service", "name": "Trồng răng Implant"},
        )
        self.assertEqual(res.status_code, 401)

    @patch("app.services.admin_assist_service.llm.complete", new_callable=AsyncMock)
    def test_service_suggestion_is_sanitized(self, complete):
        complete.return_value = (
            '```json\n{"short_description":"Phục hồi răng mất",'
            '"description":"Mô tả chi tiết",'
            '"pricing_note":"Giá khởi điểm",'
            '"highlights":[{"title":"Bền chắc","description":"x","icon":"rocket"},'
            '{"title":"","description":"bỏ qua"}],'
            '"duration_minutes":"62"}\n```'
        )
        res = self.client.post(
            "/api/v1/admin/suggest-content",
            headers=self.headers,
            json={"kind": "service", "name": "Trồng răng Implant", "category": "Implant"},
        )
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(body["short_description"], "Phục hồi răng mất")
        self.assertEqual(len(body["highlights"]), 1)
        self.assertEqual(body["highlights"][0]["icon"], "shield")
        self.assertEqual(body["duration_minutes"], 60)

    @patch("app.services.admin_assist_service.llm.complete", new_callable=AsyncMock)
    def test_promotion_only_returns_description(self, complete):
        complete.return_value = (
            '{"description":"Ưu đãi niềng răng mùa hè","duration_minutes":30}'
        )
        res = self.client.post(
            "/api/v1/admin/suggest-content",
            headers=self.headers,
            json={"kind": "promotion", "name": "Chào hè 2026"},
        )
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(body["description"], "Ưu đãi niềng răng mùa hè")
        self.assertIsNone(body["duration_minutes"])
        self.assertEqual(body["highlights"], [])

    @patch("app.services.admin_assist_service.llm.complete", new_callable=AsyncMock)
    def test_invalid_llm_output_returns_502(self, complete):
        complete.return_value = "xin lỗi, tôi không thể"
        res = self.client.post(
            "/api/v1/admin/suggest-content",
            headers=self.headers,
            json={"kind": "treatment_method", "name": "Implant Straumann"},
        )
        self.assertEqual(res.status_code, 502)


if __name__ == "__main__":
    unittest.main()
