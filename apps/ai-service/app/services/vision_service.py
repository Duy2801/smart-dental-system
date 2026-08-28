from __future__ import annotations

import asyncio
import base64
import ipaddress
import io
import json
import logging
import os
import re
import socket
from typing import Any
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

try:
    from PIL import Image, ImageDraw, ImageFont, ImageStat
except ImportError:
    Image = None
    ImageDraw = None
    ImageFont = None
    ImageStat = None

from app.core.llm import complete_gemini
from app.schemas.doctor_assist import (
    AnalyzeXrayRequest,
    AnalyzeXrayResponse,
    DentalFinding,
)
from app.schemas.vision import (
    PanoramicAnalysisRequest,
    PanoramicAnalysisResponse,
    PathologyFinding,
    ToothFinding,
    ToothStatusType,
)
from app.services.local_panoramic_model import (
    LocalModelUnavailableError,
    NonDentalImageError,
    local_panoramic_model,
)

logger = logging.getLogger(__name__)

MAX_IMAGE_BYTES = 10 * 1024 * 1024
MAX_BASE64_LENGTH = ((MAX_IMAGE_BYTES + 2) // 3) * 4 + 128
MAX_IMAGE_PIXELS = 25_000_000
MIN_IMAGE_WIDTH = 256
MIN_IMAGE_HEIGHT = 128
ALLOWED_IMAGE_HOSTS = {
    host.strip().lower()
    for host in os.getenv("VISION_ALLOWED_IMAGE_HOSTS", "res.cloudinary.com").split(",")
    if host.strip()
}
XRAY_MODEL_VERSION = os.getenv(
    "XRAY_MODEL_VERSION", "Hau1122/smart-dental-pano-ai@unversioned"
)


def _is_public_ip(address: str) -> bool:
    return ipaddress.ip_address(address).is_global


def _validate_remote_image_url(url: str) -> None:
    parsed = urlsplit(url)
    if parsed.scheme not in {"http", "https"}:
        raise ValueError("Chỉ hỗ trợ URL ảnh HTTP hoặc HTTPS.")
    if not parsed.hostname or parsed.username or parsed.password:
        raise ValueError("URL ảnh không hợp lệ.")
    hostname = parsed.hostname.lower().rstrip(".")
    if not any(
        hostname == allowed or hostname.endswith(f".{allowed}")
        for allowed in ALLOWED_IMAGE_HOSTS
    ):
        raise ValueError("Máy chủ ảnh không nằm trong danh sách được phép.")

    try:
        addresses = [str(ipaddress.ip_address(hostname))]
    except ValueError:
        port = parsed.port or (443 if parsed.scheme == "https" else 80)
        addresses = list(
            {
                item[4][0]
                for item in socket.getaddrinfo(
                    hostname, port, type=socket.SOCK_STREAM
                )
            }
        )

    if not addresses or any(not _is_public_ip(address) for address in addresses):
        raise ValueError("URL ảnh trỏ đến địa chỉ mạng không được phép.")


class _SafeImageRedirectHandler(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        _validate_remote_image_url(newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)

# Tên giải phẫu của 32 răng vĩnh viễn theo hệ FDI quốc tế
FDI_TOOTH_NAMES: dict[int, str] = {
    18: "Răng số 8 hàm trên phải (Răng khôn)",
    17: "Răng số 7 hàm trên phải (Răng cối lớn 2)",
    16: "Răng số 6 hàm trên phải (Răng cối lớn 1)",
    15: "Răng số 5 hàm trên phải (Răng tiền cối 2)",
    14: "Răng số 4 hàm trên phải (Răng tiền cối 1)",
    13: "Răng số 3 hàm trên phải (Răng nanh)",
    12: "Răng số 2 hàm trên phải (Răng cửa bên)",
    11: "Răng số 1 hàm trên phải (Răng cửa giữa)",
    21: "Răng số 1 hàm trên trái (Răng cửa giữa)",
    22: "Răng số 2 hàm trên trái (Răng cửa bên)",
    23: "Răng số 3 hàm trên trái (Răng nanh)",
    24: "Răng số 4 hàm trên trái (Răng tiền cối 1)",
    25: "Răng số 5 hàm trên trái (Răng tiền cối 2)",
    26: "Răng số 6 hàm trên trái (Răng cối lớn 1)",
    27: "Răng số 7 hàm trên trái (Răng cối lớn 2)",
    28: "Răng số 8 hàm trên trái (Răng khôn)",
    38: "Răng số 8 hàm dưới trái (Răng khôn)",
    37: "Răng số 7 hàm dưới trái (Răng cối lớn 2)",
    36: "Răng số 6 hàm dưới trái (Răng cối lớn 1)",
    35: "Răng số 5 hàm dưới trái (Răng tiền cối 2)",
    34: "Răng số 4 hàm dưới trái (Răng tiền cối 1)",
    33: "Răng số 3 hàm dưới trái (Răng nanh)",
    32: "Răng số 2 hàm dưới trái (Răng cửa bên)",
    31: "Răng số 1 hàm dưới trái (Răng cửa giữa)",
    41: "Răng số 1 hàm dưới phải (Răng cửa giữa)",
    42: "Răng số 2 hàm dưới phải (Răng cửa bên)",
    43: "Răng số 3 hàm dưới phải (Răng nanh)",
    44: "Răng số 4 hàm dưới phải (Răng tiền cối 1)",
    45: "Răng số 5 hàm dưới phải (Răng tiền cối 2)",
    46: "Răng số 6 hàm dưới phải (Răng cối lớn 1)",
    47: "Răng số 7 hàm dưới phải (Răng cối lớn 2)",
    48: "Răng số 8 hàm dưới phải (Răng khôn)",
}

STATUS_LABELS_VI: dict[ToothStatusType, str] = {
    "healthy": "Bình thường / Tốt",
    "caries": "Sâu răng",
    "periapical_lesion": "Tổn thương quanh chóp",
    "impacted": "Răng ngầm / Mọc kẹt",
    "missing": "Răng đã mất",
    "filled": "Đã trám thẩm mỹ",
    "crown": "Mão răng / Cầu răng sứ",
    "implant": "Trụ Implant",
    "root_canal": "Đã chữa tủy",
}

# Màu sắc chuẩn y khoa cho từng loại tổn thương
FINDING_COLORS = {
    "Caries": "#EF4444",  # Đỏ
    "caries": "#EF4444",
    "Periapical radiolucency": "#A855F7",  # Tím
    "periapical_lesion": "#A855F7",
    "Impacted": "#F97316",  # Cam
    "impacted": "#F97316",
    "Filling": "#0284C7",  # Xanh biển
    "filled": "#0284C7",
    "Crown / Bridge": "#D97706",  # Vàng đồng
    "crown": "#D97706",
    "Root canal filling": "#6366F1",  # Chàm
    "root_canal": "#6366F1",
    "Implant": "#4F46E5",  # Violet
    "implant": "#4F46E5",
    "Missing tooth": "#64748B",  # Xám
    "missing": "#64748B",
    "Residual root": "#EC4899",  # Hồng đậm
}

LOCAL_FINDINGS_EXPLANATION_PROMPT = """Bạn là trợ lý diễn giải kết quả AI nha khoa cho bác sĩ.
YOLO và DeepLab local đã thực hiện việc phát hiện trên phim Panorama. Bạn không được tự xem ảnh,
không được thêm, xóa hoặc thay đổi số răng, loại phát hiện và độ tin cậy do model local cung cấp.
Chỉ diễn giải dữ liệu đầu vào thành JSON hợp lệ theo schema:
{
  "summary": "Tóm tắt ngắn gọn các phát hiện",
  "diagnosis_suggestion": "Gợi ý để bác sĩ đối chiếu lâm sàng, không khẳng định chẩn đoán",
  "treatment_recommendations": ["Các bước kiểm tra hoặc xử trí để bác sĩ cân nhắc"]
}
Nếu danh sách phát hiện rỗng, nói rõ model local chưa phát hiện bất thường vượt ngưỡng;
không được khẳng định bệnh nhân hoàn toàn khỏe mạnh. Chỉ trả về JSON, không bọc Markdown.
"""


def _extract_json_from_text(text: str) -> dict[str, Any] | None:
    """Trích xuất dictionary JSON từ phản hồi LLM."""
    if not text:
        return None
    cleaned = text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()

    try:
        data = json.loads(cleaned)
        if isinstance(data, dict):
            return data
    except Exception:
        pass

    # Regex fallback
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            data = json.loads(match.group(0))
            if isinstance(data, dict):
                return data
        except Exception:
            pass
    return None


def draw_bounding_boxes_on_image(
    image: Image.Image,
    findings: list[DentalFinding] | list[ToothFinding],
) -> str:
    """Vẽ bounding boxes và nhãn lên ảnh rồi trả về base64 data URI."""
    if Image is None or ImageDraw is None:
        return ""

    draw_img = image.copy().convert("RGB")
    draw = ImageDraw.Draw(draw_img)
    w, h = draw_img.size

    for item in findings:
        if isinstance(item, DentalFinding):
            tooth_num = item.fdi_tooth_number
            f_type = item.finding_type
            bbox = item.bounding_box
            if not bbox or not isinstance(bbox, dict):
                continue
            bx = bbox.get("x", 0) / 100.0 * w
            by = bbox.get("y", 0) / 100.0 * h
            bw = bbox.get("width", 0) / 100.0 * w
            bh = bbox.get("height", 0) / 100.0 * h
            if bw <= 0 or bh <= 0:
                continue
            x1, y1, x2, y2 = int(bx), int(by), int(bx + bw), int(by + bh)
            color = FINDING_COLORS.get(f_type, "#EF4444")
            label_text = f"#{tooth_num} {f_type}"
        else:
            if not item.bbox or len(item.bbox) != 4:
                continue
            x1, y1, x2, y2 = item.bbox
            if x1 <= 1.0 and y1 <= 1.0 and x2 <= 1.0 and y2 <= 1.0:
                x1, y1, x2, y2 = int(x1 * w), int(y1 * h), int(x2 * w), int(y2 * h)
            else:
                x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
            color = FINDING_COLORS.get(item.status, "#10B981")
            label_text = f"#{item.tooth_number} {item.status_label_vi}"

        x1, y1 = max(0, min(x1, w - 1)), max(0, min(y1, h - 1))
        x2, y2 = max(x1 + 10, min(x2, w)), max(y1 + 10, min(y2, h))

        draw.rectangle([x1, y1, x2, y2], outline=color, width=3)
        label_h = 18
        label_w = min(len(label_text) * 8 + 6, w - x1)
        tag_y1 = max(0, y1 - label_h)
        draw.rectangle([x1, tag_y1, x1 + label_w, tag_y1 + label_h], fill=color)
        draw.text((x1 + 3, tag_y1 + 2), label_text, fill="#FFFFFF")

    buffer = io.BytesIO()
    draw_img.save(buffer, format="JPEG", quality=85)
    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{encoded}"


class PanoramicVisionService:
    """Phân tích phim Panorama bằng model local và diễn giải bằng Gemini."""

    def validate_radiograph(
        self, pil_image: Image.Image | None, url_or_name: str | None = None
    ) -> tuple[bool, str]:
        """Xác thực nghiêm ngặt cấp độ điểm ảnh (Pixel-Level Gatekeeper) xem ảnh có phải là phim X-quang y tế."""
        if pil_image is None:
            return (
                False,
                "Không thể đọc dữ liệu hình ảnh hoặc tệp ảnh bị hỏng/không tồn tại.",
            )

        width, height = pil_image.size
        if width < MIN_IMAGE_WIDTH or height < MIN_IMAGE_HEIGHT:
            return False, (
                f"Kích thước ảnh quá nhỏ ({width}x{height}); không đủ dữ liệu để xác thực phim X-quang."
            )

        if width * height > MAX_IMAGE_PIXELS:
            return False, "Kích thước điểm ảnh vượt giới hạn xử lý an toàn."

        url_lower = (url_or_name or "").lower()
        non_dental_keywords = [
            "macos",
            "screenshot",
            "screen",
            "desktop",
            "laptop",
            "mockup",
            "login_page",
            "document_pdf",
            "avatar_profile",
            "app_store",
            "vpn",
            "verification",
            "test_page",
            "dashboard",
            "wireframe",
            "chart",
            "infographic",
            "flowchart",
            "security",
            "tutorial",
            "guide",
        ]
        if any(kw in url_lower for kw in non_dental_keywords):
            return (
                False,
                "Ảnh chụp màn hình / giao diện thiết bị / tài liệu (Non-dental screenshot)",
            )

        try:
            # 1. Thuật toán quét điểm ảnh màu cục bộ (Pixel-level Color Dispersion)
            # Phim X-quang y khoa là ảnh xám đơn sắc (Grayscale / Monochrome).
            # Tất cả điểm ảnh trong phim X-quang đều có |R-G| < 8 và |G-B| < 8.
            # Bất kỳ ảnh chụp màn hình máy tính nào (có icon cờ, nút bấm, UI xanh/đỏ)
            # sẽ xuất hiện các điểm ảnh có |R-G| > 15 hoặc |G-B| > 15 với tỷ lệ > 1.2%.
            thumb = pil_image.copy().resize((100, 100)).convert("RGB")
            get_pixels = getattr(thumb, "get_flattened_data", thumb.getdata)
            pixels = list(get_pixels())
            total = len(pixels)

            colored_count = 0
            diff_sum = 0
            for r, g, b in pixels:
                d = max(abs(r - g), abs(g - b), abs(b - r))
                diff_sum += d
                if d > 14:  # Điểm ảnh có màu sắc rõ rệt (không phải xám y tế)
                    colored_count += 1

            colored_ratio = colored_count / total
            avg_diff = diff_sum / total

            if colored_ratio > 0.012:  # > 1.2% diện tích ảnh có màu
                return False, (
                    f"Ảnh chứa các biểu tượng/chi tiết màu sắc ({colored_ratio * 100:.1f}% điểm ảnh có màu), "
                    f"đây là ảnh chụp màn hình/giao diện thiết bị máy tính chứ không phải phim X-quang y khoa"
                )

            if avg_diff > 5.5:
                return (
                    False,
                    f"Độ lệch sắc độ trung bình cao ({avg_diff:.1f}), ảnh không phải phim X-quang đơn sắc y tế",
                )

            grayscale = pil_image.copy().resize((256, 128)).convert("L")
            contrast = ImageStat.Stat(grayscale).stddev[0]
            dynamic_range = grayscale.getextrema()[1] - grayscale.getextrema()[0]
            if contrast < 10 or dynamic_range < 35:
                return False, (
                    "Ảnh xám không có đủ tương phản và cấu trúc giải phẫu để xác thực là phim X-quang nha khoa."
                )

        except Exception as e:
            logger.warning(f"Lỗi kiểm tra sắc độ ảnh: {e}")
            return False, "Không thể xác thực cấu trúc hình ảnh một cách an toàn."

        return True, "Ảnh X-quang hợp lệ"

    @staticmethod
    def _decode_image(data: bytes) -> Image.Image:
        if len(data) > MAX_IMAGE_BYTES:
            raise ValueError("Dung lượng ảnh vượt quá 10 MB.")

        with Image.open(io.BytesIO(data)) as source:
            width, height = source.size
            if width * height > MAX_IMAGE_PIXELS:
                raise ValueError("Kích thước điểm ảnh vượt giới hạn xử lý an toàn.")
            source.verify()

        with Image.open(io.BytesIO(data)) as source:
            return source.convert("RGB")

    @staticmethod
    def _decode_base64_image(value: str) -> Image.Image:
        raw_base64 = value.split(",", 1)[1] if "," in value else value
        if len(raw_base64) > MAX_BASE64_LENGTH:
            raise ValueError("Dữ liệu ảnh base64 vượt quá 10 MB.")
        data = base64.b64decode(raw_base64, validate=True)
        return PanoramicVisionService._decode_image(data)

    @staticmethod
    def _download_remote_image(image_url: str) -> Image.Image:
        _validate_remote_image_url(image_url)
        request = Request(image_url, headers={"User-Agent": "SmartDentalVision/1.0"})
        opener = build_opener(_SafeImageRedirectHandler())

        with opener.open(request, timeout=10) as response:
            final_url = response.geturl()
            _validate_remote_image_url(final_url)

            content_type = response.headers.get_content_type()
            if not content_type.startswith("image/"):
                raise ValueError("URL không trả về nội dung hình ảnh.")

            content_length = response.headers.get("Content-Length")
            if content_length and int(content_length) > MAX_IMAGE_BYTES:
                raise ValueError("Dung lượng ảnh từ URL vượt quá 10 MB.")

            data = response.read(MAX_IMAGE_BYTES + 1)
            if len(data) > MAX_IMAGE_BYTES:
                raise ValueError("Dung lượng ảnh từ URL vượt quá 10 MB.")

        return PanoramicVisionService._decode_image(data)

    def _load_image(self, req: Any) -> Image.Image | None:
        """Đọc PIL Image từ base64 hoặc URL."""
        if Image is None:
            return None
        try:
            image_b64 = getattr(req, "image_base64", None)
            image_url = getattr(req, "image_url", None)

            if image_b64:
                return self._decode_base64_image(image_b64)
            elif image_url:
                if image_url.startswith("data:image"):
                    return self._decode_base64_image(image_url)
                return self._download_remote_image(image_url)
        except Exception as e:
            logger.warning(f"Không thể nạp ảnh X-quang: {e}")
        return None

    async def analyze_xray_hybrid(
        self, body: AnalyzeXrayRequest
    ) -> AnalyzeXrayResponse:
        """Phát hiện bằng YOLO + DeepLab local và diễn giải bằng Gemini."""
        pil_image = self._load_image(body)
        is_valid, validation_msg = self.validate_radiograph(pil_image, body.image_url)

        if not is_valid:
            logger.info(f"[Gatekeeper] Từ chối phân tích: {validation_msg}")
            return AnalyzeXrayResponse(
                is_radiograph=False,
                status="INVALID_IMAGE",
                error_status="INVALID_IMAGE",
                model_version=XRAY_MODEL_VERSION,
                findings=[],
                total_findings=0,
                summary=(
                    f"CẢNH BÁO Y KHOA: {validation_msg}.\n"
                    f"Ảnh được chọn KHÔNG phải là phim chụp X-quang nha khoa hợp lệ. "
                    f"Dental Vision AI từ chối phân tích để đảm bảo an toàn y tế và tránh chẩn đoán sai lệch."
                ),
                diagnosis_suggestion="Không thể chẩn đoán do hình ảnh tải lên không phải phim X-quang răng.",
                treatment_recommendations=[
                    "Vui lòng tải lên phim chụp X-quang Panorama, Bitewing hoặc Cận chóp đạt chuẩn."
                ],
                annotated_image_url=body.image_url,
                disclaimer="Hệ thống tự động phát hiện và chặn các ảnh không phải X-quang răng.",
            )

        try:
            local_findings = await asyncio.to_thread(
                local_panoramic_model.analyze,
                pil_image,
            )
        except NonDentalImageError as exc:
            logger.info("[Gatekeeper] Model từ chối ảnh không có cấu trúc răng: %s", exc)
            return AnalyzeXrayResponse(
                is_radiograph=False,
                status="INVALID_IMAGE",
                error_status="INVALID_IMAGE",
                model_version=XRAY_MODEL_VERSION,
                findings=[],
                total_findings=0,
                summary=f"CẢNH BÁO Y KHOA: {exc}",
                diagnosis_suggestion=None,
                treatment_recommendations=[],
                annotated_image_url=body.image_url,
                disclaimer=(
                    "Model giải phẫu không nhận diện được răng nên hệ thống từ chối phân tích."
                ),
            )
        except LocalModelUnavailableError as exc:
            logger.error("Model X-quang local chưa sẵn sàng: %s", exc)
            return AnalyzeXrayResponse(
                is_radiograph=True,
                status="MODEL_UNAVAILABLE",
                error_status="MODEL_UNAVAILABLE",
                model_version=XRAY_MODEL_VERSION,
                findings=[],
                total_findings=0,
                summary=str(exc),
                diagnosis_suggestion=None,
                treatment_recommendations=[],
                annotated_image_url=body.image_url,
                disclaimer=(
                    "Không có kết quả chẩn đoán vì model local chưa sẵn sàng. "
                    "Bác sĩ không sử dụng phản hồi này để đưa ra quyết định lâm sàng."
                ),
            )

        findings = [
            DentalFinding(
                fdi_tooth_number=item.fdi_tooth_number,
                finding_type=item.finding_type,
                confidence=item.confidence,
                bounding_box=item.bounding_box,
                severity=item.severity,
            )
            for item in local_findings
        ]
        summary = self._default_summary(findings)
        diagnosis_suggestion: str | None = None
        treatment_recs: list[str] = []

        try:
            findings_payload = [finding.model_dump() for finding in findings]
            explanation_request = (
                "Dữ liệu phát hiện từ YOLO + DeepLab local:\n"
                f"{json.dumps(findings_payload, ensure_ascii=False)}\n"
                "Ghi chú lâm sàng của bác sĩ:\n"
                f"{body.clinical_note_hint or 'Không có'}"
            )
            raw_text = await complete_gemini(
                system=LOCAL_FINDINGS_EXPLANATION_PROMPT,
                user=explanation_request,
            )
            parsed = _extract_json_from_text(raw_text)
            if parsed:
                summary = str(parsed.get("summary") or summary)
                diagnosis_suggestion = (
                    str(parsed.get("diagnosis_suggestion") or "") or None
                )
                treatment_recs = [
                    str(item) for item in parsed.get("treatment_recommendations", [])
                ]
        except Exception as exc:
            logger.warning("Gemini không thể diễn giải kết quả local: %s", exc)

        annotated_b64 = draw_bounding_boxes_on_image(pil_image, findings)

        return AnalyzeXrayResponse(
            is_radiograph=True,
            status="PATHOLOGY_DETECTED" if findings else "HEALTHY",
            model_version=XRAY_MODEL_VERSION,
            findings=findings,
            total_findings=len(findings),
            summary=summary,
            diagnosis_suggestion=diagnosis_suggestion,
            treatment_recommendations=treatment_recs,
            annotated_image_url=annotated_b64 or body.image_url,
            disclaimer=(
                "YOLO và DeepLab local tạo phát hiện; Gemini chỉ diễn giải kết quả. "
                "Bác sĩ cần đối chiếu lâm sàng trước khi đưa vào bệnh án."
            ),
        )

    @staticmethod
    def _default_summary(findings: list[DentalFinding]) -> str:
        if not findings:
            return (
                "YOLO và DeepLab local chưa phát hiện bất thường vượt ngưỡng. "
                "Kết quả này không loại trừ bệnh lý."
            )
        return f"YOLO và DeepLab local ghi nhận {len(findings)} phát hiện cần bác sĩ kiểm tra."

    async def analyze_panoramic_image(
        self, req: PanoramicAnalysisRequest
    ) -> PanoramicAnalysisResponse:
        """Hỗ trợ tương thích endpoint `/api/v1/vision/analyze-panoramic`."""
        res = await self.analyze_xray_hybrid(
            AnalyzeXrayRequest(
                image_url=req.image_url,
                image_base64=req.image_base64,
                clinical_note_hint=req.chief_complaint,
            )
        )

        teeth_findings: list[ToothFinding] = []
        for f in res.findings:
            name = FDI_TOOTH_NAMES.get(
                f.fdi_tooth_number, f"Răng #{f.fdi_tooth_number}"
            )
            status_map: dict[str, ToothStatusType] = {
                "Caries": "caries",
                "Impacted": "impacted",
                "Periapical radiolucency": "periapical_lesion",
                "Filling": "filled",
                "Crown / Bridge": "crown",
                "Root canal filling": "root_canal",
                "Implant": "implant",
                "Missing tooth": "missing",
            }
            st = status_map.get(f.finding_type, "healthy")
            teeth_findings.append(
                ToothFinding(
                    tooth_number=f.fdi_tooth_number,
                    tooth_name=name,
                    status=st,
                    status_label_vi=STATUS_LABELS_VI.get(st, f.finding_type),
                    confidence=f.confidence,
                    bbox=[
                        f.bounding_box.get("x", 0) / 100.0,
                        f.bounding_box.get("y", 0) / 100.0,
                        (f.bounding_box.get("x", 0) + f.bounding_box.get("width", 0))
                        / 100.0,
                        (f.bounding_box.get("y", 0) + f.bounding_box.get("height", 0))
                        / 100.0,
                    ],
                    description=f"{f.finding_type} - Mức độ: {f.severity}",
                )
            )

        return PanoramicAnalysisResponse(
            teeth=teeth_findings,
            pathologies=[],
            annotated_image_base64=(
                res.annotated_image_url
                if res.annotated_image_url
                and res.annotated_image_url.startswith("data:image")
                else None
            ),
            annotated_image_url=res.annotated_image_url,
            clinical_summary=res.summary,
            diagnosis_suggestion=res.diagnosis_suggestion or "",
            treatment_recommendations=res.treatment_recommendations,
        )


vision_service = PanoramicVisionService()
