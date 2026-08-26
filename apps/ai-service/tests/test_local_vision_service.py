import base64
import io
import unittest
from unittest.mock import AsyncMock, patch

from PIL import Image

from app.schemas.doctor_assist import AnalyzeXrayRequest
from app.services.local_panoramic_model import (
    LocalDentalFinding,
    LocalModelUnavailableError,
)
from app.services.vision_service import PanoramicVisionService


def make_grayscale_image_base64() -> str:
    image = Image.new("RGB", (120, 60), color=(80, 80, 80))
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


class LocalVisionServiceTest(unittest.IsolatedAsyncioTestCase):
    async def test_uses_local_findings_and_gemini_only_for_explanation(self) -> None:
        local_finding = LocalDentalFinding(
            fdi_tooth_number=46,
            finding_type="Caries",
            confidence=0.91,
            bounding_box={"x": 50.0, "y": 40.0, "width": 10.0, "height": 20.0},
            severity="HIGH",
        )
        gemini_response = (
            '{"summary":"Có một phát hiện cần kiểm tra.",'
            '"diagnosis_suggestion":"Đối chiếu lâm sàng răng 46.",'
            '"treatment_recommendations":["Khám trực tiếp."]}'
        )

        with (
            patch(
                "app.services.vision_service.local_panoramic_model.analyze",
                return_value=[local_finding],
            ) as analyze,
            patch(
                "app.services.vision_service.complete_gemini",
                new=AsyncMock(return_value=gemini_response),
            ) as explain,
        ):
            response = await PanoramicVisionService().analyze_xray_hybrid(
                AnalyzeXrayRequest(image_base64=make_grayscale_image_base64())
            )

        analyze.assert_called_once()
        explain.assert_awaited_once()
        self.assertEqual(response.status, "PATHOLOGY_DETECTED")
        self.assertEqual(response.findings[0].fdi_tooth_number, 46)
        self.assertEqual(response.total_findings, 1)
        self.assertEqual(response.summary, "Có một phát hiện cần kiểm tra.")

    async def test_does_not_generate_fake_findings_when_gemini_fails(self) -> None:
        with (
            patch(
                "app.services.vision_service.local_panoramic_model.analyze",
                return_value=[],
            ),
            patch(
                "app.services.vision_service.complete_gemini",
                new=AsyncMock(side_effect=RuntimeError("Gemini unavailable")),
            ),
        ):
            response = await PanoramicVisionService().analyze_xray_hybrid(
                AnalyzeXrayRequest(image_base64=make_grayscale_image_base64())
            )

        self.assertEqual(response.status, "HEALTHY")
        self.assertEqual(response.findings, [])
        self.assertIn("chưa phát hiện", response.summary)

    async def test_reports_when_local_model_is_unavailable(self) -> None:
        with patch(
            "app.services.vision_service.local_panoramic_model.analyze",
            side_effect=LocalModelUnavailableError("Thiếu model local"),
        ):
            response = await PanoramicVisionService().analyze_xray_hybrid(
                AnalyzeXrayRequest(image_base64=make_grayscale_image_base64())
            )

        self.assertEqual(response.status, "MODEL_UNAVAILABLE")
        self.assertEqual(response.findings, [])
        self.assertEqual(response.summary, "Thiếu model local")


if __name__ == "__main__":
    unittest.main()
