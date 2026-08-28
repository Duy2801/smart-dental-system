import base64
import io
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

from PIL import Image, ImageDraw

from app.schemas.doctor_assist import AnalyzeXrayRequest
from app.services.local_panoramic_model import (
    LocalDentalFinding,
    LocalModelUnavailableError,
    LocalPanoramicModel,
    NonDentalImageError,
)
from app.services.vision_service import MAX_IMAGE_BYTES, PanoramicVisionService


def make_grayscale_image_base64() -> str:
    image = Image.new("RGB", (120, 60), color=(80, 80, 80))
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def make_radiograph_like_image_base64() -> str:
    image = Image.new("L", (640, 320), color=35)
    draw = ImageDraw.Draw(image)
    for index in range(12):
        x = 45 + index * 48
        draw.ellipse((x, 90, x + 34, 230), fill=145 + index % 3 * 20)
        draw.line((x + 17, 210, x + 17, 280), fill=100, width=7)
    buffer = io.BytesIO()
    image.convert("RGB").save(buffer, format="JPEG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


class LocalVisionServiceTest(unittest.IsolatedAsyncioTestCase):
    async def test_uses_local_findings_and_gemini_only_for_explanation(self) -> None:
        local_finding = LocalDentalFinding(
            fdi_tooth_number=46,
            finding_type="Caries",
            confidence=0.91,
            bounding_box={"x": 50.0, "y": 40.0, "width": 10.0, "height": 20.0},
            severity="UNASSESSED",
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
                AnalyzeXrayRequest(image_base64=make_radiograph_like_image_base64())
            )

        analyze.assert_called_once()
        explain.assert_awaited_once()
        self.assertEqual(response.status, "PATHOLOGY_DETECTED")
        self.assertEqual(response.findings[0].fdi_tooth_number, 46)
        self.assertEqual(response.findings[0].severity, "UNASSESSED")
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
                AnalyzeXrayRequest(image_base64=make_radiograph_like_image_base64())
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
                AnalyzeXrayRequest(image_base64=make_radiograph_like_image_base64())
            )

        self.assertEqual(response.status, "MODEL_UNAVAILABLE")
        self.assertEqual(response.findings, [])
        self.assertEqual(response.summary, "Thiếu model local")

    async def test_rejects_image_when_model_detects_no_dental_anatomy(self) -> None:
        with patch(
            "app.services.vision_service.local_panoramic_model.analyze",
            side_effect=NonDentalImageError("Không nhận diện được cấu trúc răng."),
        ):
            response = await PanoramicVisionService().analyze_xray_hybrid(
                AnalyzeXrayRequest(
                    image_base64=make_radiograph_like_image_base64()
                )
            )

        self.assertEqual(response.status, "INVALID_IMAGE")
        self.assertFalse(response.is_radiograph)
        self.assertEqual(response.findings, [])

    async def test_rejects_flat_grayscale_image_before_inference(self) -> None:
        with patch(
            "app.services.vision_service.local_panoramic_model.analyze"
        ) as analyze:
            response = await PanoramicVisionService().analyze_xray_hybrid(
                AnalyzeXrayRequest(image_base64=make_grayscale_image_base64())
            )

        analyze.assert_not_called()
        self.assertEqual(response.status, "INVALID_IMAGE")
        self.assertFalse(response.is_radiograph)

    def test_rejects_private_url_before_network_request(self) -> None:
        request = AnalyzeXrayRequest(image_url="http://127.0.0.1/private-xray")

        with patch("app.services.vision_service.build_opener") as build_opener:
            image = PanoramicVisionService()._load_image(request)

        build_opener.assert_not_called()
        self.assertIsNone(image)

    def test_rejects_oversized_base64_before_decode(self) -> None:
        request = AnalyzeXrayRequest(image_base64="A" * (14 * 1024 * 1024))

        with patch("app.services.vision_service.base64.b64decode") as decode:
            image = PanoramicVisionService()._load_image(request)

        decode.assert_not_called()
        self.assertIsNone(image)

    def test_rejects_remote_image_from_content_length_before_read(self) -> None:
        response = MagicMock()
        response.geturl.return_value = "https://example.com/xray.jpg"
        response.headers.get_content_type.return_value = "image/jpeg"
        response.headers.get.return_value = str(MAX_IMAGE_BYTES + 1)
        opener = MagicMock()
        opener.open.return_value.__enter__.return_value = response

        with (
            patch(
                "app.services.vision_service._validate_remote_image_url"
            ),
            patch(
                "app.services.vision_service.build_opener", return_value=opener
            ),
            self.assertRaises(ValueError),
        ):
            PanoramicVisionService._download_remote_image(
                "https://example.com/xray.jpg"
            )

        response.read.assert_not_called()

    def test_local_model_requires_detected_tooth_anatomy(self) -> None:
        model = LocalPanoramicModel()
        model._module = SimpleNamespace()
        model._semantic_model = MagicMock(return_value=SimpleNamespace())
        model._instance_model = MagicMock(
            return_value=SimpleNamespace(
                instances=[
                    SimpleNamespace(
                        category_name="CARIES",
                        score=0.99,
                    )
                ]
            )
        )
        model._postprocessor = MagicMock(return_value=[])

        with self.assertRaises(NonDentalImageError):
            model.analyze(Image.new("RGB", (640, 320), color=(80, 80, 80)))

        model._postprocessor.assert_not_called()

    def test_local_model_does_not_infer_clinical_severity_from_confidence(self) -> None:
        model = LocalPanoramicModel()
        model._module = SimpleNamespace()
        model._semantic_model = MagicMock(return_value=SimpleNamespace())
        tooth = SimpleNamespace(
            category_name="TOOTH_46",
            score=0.99,
            bbox_xyxy=[320, 120, 420, 260],
        )
        model._instance_model = MagicMock(
            return_value=SimpleNamespace(instances=[tooth])
        )
        model._postprocessor = MagicMock(
            return_value=[
                SimpleNamespace(
                    fdi=46,
                    finding=SimpleNamespace(value="CARIES"),
                    score=0.99,
                )
            ]
        )

        findings = model.analyze(Image.new("RGB", (640, 320), color=(80, 80, 80)))

        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0].confidence, 0.99)
        self.assertEqual(findings[0].severity, "UNASSESSED")


if __name__ == "__main__":
    unittest.main()
