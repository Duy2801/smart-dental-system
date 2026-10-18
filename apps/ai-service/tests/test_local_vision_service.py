import base64
import io
import socket
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import numpy as np
from PIL import Image, ImageDraw

from app.schemas.doctor_assist import AnalyzeXrayRequest
from app.services.local_panoramic_model import (
    LocalDentalFinding,
    LocalModelUnavailableError,
    LocalPanoramicModel,
    NonDentalImageError,
)
from app.services.vision_service import (
    MAX_IMAGE_BYTES,
    PanoramicVisionService,
    RemoteImageLoadError,
)


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
        self.assertEqual(response.findings[0].region_source, "DETECTED")
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

    def test_accepts_blue_tinted_panoramic_image(self) -> None:
        source = Image.open(io.BytesIO(base64.b64decode(make_radiograph_like_image_base64()))).convert("L")
        tinted = Image.merge(
            "RGB",
            (
                source.point(lambda value: int(value * 0.72)),
                source.point(lambda value: min(255, int(value * 0.86) + 8)),
                source.point(lambda value: min(255, value + 18)),
            ),
        )

        self.assertTrue(PanoramicVisionService().validate_radiograph(tinted)[0])

    def test_rejects_colored_interface_over_grayscale_image(self) -> None:
        source = Image.open(io.BytesIO(base64.b64decode(make_radiograph_like_image_base64()))).convert("RGB")
        ImageDraw.Draw(source).rectangle((0, 0, 120, 80), fill=(0, 120, 255))

        self.assertFalse(PanoramicVisionService().validate_radiograph(source)[0])

    async def test_reports_remote_load_failure_as_analysis_failed(self) -> None:
        with patch.object(
            PanoramicVisionService,
            "_download_remote_image",
            side_effect=RemoteImageLoadError("cloud storage timeout"),
        ):
            response = await PanoramicVisionService().analyze_xray_hybrid(
                AnalyzeXrayRequest(image_url="https://example.com/xray.jpg")
            )

        self.assertEqual(response.status, "ANALYSIS_FAILED")
        self.assertEqual(response.error_status, "ANALYSIS_FAILED")
        self.assertNotIn("không phải", response.summary.lower())

    async def test_reports_dns_failure_as_analysis_failed(self) -> None:
        with patch(
            "app.services.vision_service._validate_remote_image_url",
            side_effect=socket.gaierror("DNS lookup failed"),
        ):
            response = await PanoramicVisionService().analyze_xray_hybrid(
                AnalyzeXrayRequest(image_url="https://example.com/xray.jpg")
            )

        self.assertEqual(response.status, "ANALYSIS_FAILED")
        self.assertEqual(response.error_status, "ANALYSIS_FAILED")

    async def test_reports_corrupt_remote_image_as_invalid_image(self) -> None:
        with patch.object(
            PanoramicVisionService,
            "_download_remote_image",
            side_effect=OSError("cannot identify image file"),
        ):
            response = await PanoramicVisionService().analyze_xray_hybrid(
                AnalyzeXrayRequest(image_url="https://example.com/xray.jpg")
            )

        self.assertEqual(response.status, "INVALID_IMAGE")
        self.assertEqual(response.error_status, "INVALID_IMAGE")

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

    def test_local_model_uses_matching_lesion_region_when_tooth_box_is_missing(self) -> None:
        model = LocalPanoramicModel()
        model._module = SimpleNamespace()
        probabilities = np.zeros((33, 4), dtype=np.float32)
        probabilities[30] = 0.9  # FDI 46
        probabilities[29] = 0.1
        model._semantic_model = MagicMock(
            return_value=SimpleNamespace(prob=probabilities)
        )
        tooth = SimpleNamespace(
            category_name="TOOTH_36",
            score=0.99,
            bbox_xyxy=[200, 120, 260, 250],
        )
        lesion = SimpleNamespace(
            category_name="CARIES",
            score=0.9,
            bbox_xyxy=[320, 140, 400, 220],
            mask_array=lambda prob: prob,
        )
        other_probabilities = probabilities.copy()
        other_probabilities[30] = 0.1
        other_probabilities[29] = 0.9
        other_lesion = SimpleNamespace(
            category_name="CARIES",
            score=0.99,
            bbox_xyxy=[100, 140, 180, 220],
            mask_array=lambda prob: other_probabilities,
        )
        model._instance_model = MagicMock(
            return_value=SimpleNamespace(instances=[tooth, other_lesion, lesion])
        )
        model._postprocessor = MagicMock(
            return_value=[
                SimpleNamespace(
                    fdi=46,
                    finding=SimpleNamespace(value="CARIES"),
                    score=0.81,
                ),
                SimpleNamespace(
                    fdi=38,
                    finding=SimpleNamespace(value="MISSING"),
                    score=0.96,
                ),
            ]
        )

        findings = model.analyze(Image.new("RGB", (640, 320)))

        self.assertEqual(
            findings[0].bounding_box,
            {"x": 50.0, "y": 43.75, "width": 12.5, "height": 25.0},
        )
        self.assertEqual(findings[0].region_source, "DETECTED")
        self.assertEqual(
            findings[1].bounding_box,
            {"x": 0.0, "y": 0.0, "width": 0.0, "height": 0.0},
        )
        self.assertEqual(findings[1].region_source, "UNLOCATED")

    def test_local_model_prefers_finding_region_over_whole_tooth_region(self) -> None:
        model = LocalPanoramicModel()
        probabilities = np.zeros((33, 4), dtype=np.float32)
        probabilities[22] = 0.9  # FDI 36
        probabilities[21] = 0.1
        tooth = SimpleNamespace(
            category_name="TOOTH_36",
            score=0.9,
            bbox_xyxy=[400, 120, 480, 260],
        )
        lesion = SimpleNamespace(
            category_name="CARIES",
            score=0.9,
            bbox_xyxy=[420, 160, 450, 190],
            mask_array=lambda prob: prob,
        )

        finding = model._convert_entry(
            SimpleNamespace(
                fdi=36,
                finding=SimpleNamespace(value="CARIES"),
                score=0.81,
            ),
            [tooth, lesion],
            SimpleNamespace(prob=probabilities),
            640,
            320,
        )

        self.assertEqual(
            finding.bounding_box,
            {"x": 65.62, "y": 50.0, "width": 4.69, "height": 9.38},
        )

    def test_local_model_estimates_missing_tooth_slots_from_model_evidence(self) -> None:
        model = LocalPanoramicModel()
        model._module = SimpleNamespace()
        probabilities = np.zeros((33, 100, 200), dtype=np.float32)
        probabilities[0] = 0.1
        probabilities[24, 20:40, 150:180] = 0.9  # FDI 38
        model._semantic_model = MagicMock(
            return_value=SimpleNamespace(prob=probabilities)
        )
        teeth = [
            SimpleNamespace(category_name="TOOTH_34", score=0.9, bbox_xyxy=[90, 40, 110, 80]),
            SimpleNamespace(category_name="TOOTH_36", score=0.9, bbox_xyxy=[130, 38, 160, 82]),
            SimpleNamespace(category_name="TOOTH_37", score=0.9, bbox_xyxy=[120, 20, 150, 50]),
        ]
        model._instance_model = MagicMock(
            return_value=SimpleNamespace(instances=teeth)
        )
        model._postprocessor = MagicMock(
            return_value=[
                SimpleNamespace(fdi=fdi, finding=SimpleNamespace(value="MISSING"), score=0.9)
                for fdi in (35, 38)
            ]
        )

        findings = model.analyze(Image.new("RGB", (200, 100)))

        self.assertEqual(
            findings[0].bounding_box,
            {"x": 55.0, "y": 39.0, "width": 10.0, "height": 42.0},
        )
        self.assertEqual(
            findings[1].bounding_box,
            {"x": 75.0, "y": 20.0, "width": 15.0, "height": 20.0},
        )
        self.assertEqual([item.region_source for item in findings], ["ESTIMATED", "ESTIMATED"])


if __name__ == "__main__":
    unittest.main()
