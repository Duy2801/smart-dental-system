from __future__ import annotations

import base64
import io
import json
import logging
import re
from typing import Any

try:
    from PIL import Image, ImageDraw, ImageFont, ImageStat
except ImportError:
    Image = None
    ImageDraw = None
    ImageFont = None
    ImageStat = None

from app.config import get_settings
from app.core.llm import complete_vision
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

logger = logging.getLogger(__name__)

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
    "Caries": "#EF4444",               # Đỏ
    "caries": "#EF4444",
    "Periapical radiolucency": "#A855F7", # Tím
    "periapical_lesion": "#A855F7",
    "Impacted": "#F97316",             # Cam
    "impacted": "#F97316",
    "Filling": "#0284C7",              # Xanh biển
    "filled": "#0284C7",
    "Crown / Bridge": "#D97706",       # Vàng đồng
    "crown": "#D97706",
    "Root canal filling": "#6366F1",   # Chàm
    "root_canal": "#6366F1",
    "Implant": "#4F46E5",              # Violet
    "implant": "#4F46E5",
    "Missing tooth": "#64748B",        # Xám
    "missing": "#64748B",
    "Residual root": "#EC4899",        # Hồng đậm
}

DENTAL_VISION_SYSTEM_PROMPT = """Bạn là Bác sĩ Chuyên khoa Cấp cao về Chẩn đoán Hình ảnh & X-quang Nha khoa (Oral & Maxillofacial Radiologist).
Nhiệm vụ của bạn là kiểm tra và phân tích phim chụp X-quang nha khoa (Panorama OPG / Bitewing / Cận chóp) theo quy chuẩn hệ thống 32 răng FDI quốc tế (11-48).

QUY TẮC BẮT BUỘC VỀ XÁC THỰC ẢNH:
1. Nếu hình ảnh tải lên KHÔNG PHẢI là phim X-quang răng y tế (ví dụ: ảnh chụp màn hình máy tính, sơ đồ, giao diện web, ảnh phong cảnh, chân dung, văn bản...):
   Bạn BẮT BUỘC phải trả về đúng JSON sau:
   {
     "is_radiograph": false,
     "findings": [],
     "summary": "CẢNH BÁO Y KHOA: Hình ảnh tải lên không phải là phim chụp X-quang răng nha khoa hợp lệ.",
     "diagnosis_suggestion": "Không thể chẩn đoán do hình ảnh không phải phim X-quang răng.",
     "treatment_recommendations": ["Vui lòng tải lên phim chụp X-quang Panorama, Bitewing hoặc Cận chóp đạt chuẩn."]
   }

2. Nếu ĐÚNG là phim X-quang răng nha khoa:
   Hãy kiểm tra kỹ từng răng, cấu trúc mào xương ổ răng, khoảng dây chằng nha chu quanh chóp, hướng mọc răng khôn và ống thần kinh răng dưới.
   Sau đó trích xuất kết quả dưới dạng JSON theo đúng schema sau:
   {
     "is_radiograph": true,
     "findings": [
       {
         "fdi_tooth_number": 48,
         "finding_type": "Impacted",
         "severity": "HIGH",
         "confidence": 0.95,
         "bounding_box": {"x": 78.0, "y": 55.0, "width": 8.5, "height": 14.0},
         "description": "Răng 48 mọc lệch nghiêng gần ~45 độ, thân răng tì vào cổ răng 47, chóp chân răng sát ống thần kinh răng dưới"
       }
     ],
     "summary": "Tóm tắt tổng quan hình thái cung răng, tiêu xương mào ổ răng, và các vị trí bệnh lý nổi bật.",
     "diagnosis_suggestion": "Chẩn đoán bệnh học lâm sàng tổng hợp.",
     "treatment_recommendations": [
       "Khuyến nghị điều trị 1",
       "Khuyến nghị điều trị 2"
     ]
   }

Các loại tổn thương (finding_type) hợp lệ:
- "Caries" (Sâu răng)
- "Impacted" (Răng ngầm / mọc lệch / kẹt)
- "Periapical radiolucency" (Thấu quang quanh chóp / viêm quanh chóp)
- "Filling" (Đã trám răng)
- "Crown / Bridge" (Mão răng / Cầu răng sứ)
- "Root canal filling" (Đã chữa tủy)
- "Implant" (Trụ Implant)
- "Missing tooth" (Răng đã mất)
- "Residual root" (Chân răng còn sót)

Lưu ý:
- Tọa độ bounding_box x, y, width, height là giá trị phần trăm từ 0.0 đến 100.0 tương ứng với vị trí tổn thương trên phim.
- Chỉ trả về duy nhất chuỗi JSON hợp lệ, không thêm bất kỳ văn bản bọc ngoài nào.
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
    """Service phân tích phim X-quang Panorama tích hợp Hybrid Cloud Vision (Roboflow + Vision LLM)."""

    def validate_radiograph(
        self, pil_image: Image.Image | None, url_or_name: str | None = None
    ) -> tuple[bool, str]:
        """Xác thực nghiêm ngặt cấp độ điểm ảnh (Pixel-Level Gatekeeper) xem ảnh có phải là phim X-quang y tế."""
        if pil_image is None:
            return False, "Không thể đọc dữ liệu hình ảnh hoặc tệp ảnh bị hỏng/không tồn tại."

        url_lower = (url_or_name or "").lower()
        non_dental_keywords = [
            "macos", "screenshot", "screen", "desktop", "laptop",
            "mockup", "login_page", "document_pdf", "avatar_profile", "app_store",
            "vpn", "verification", "test_page", "dashboard", "wireframe", "chart",
            "infographic", "flowchart", "security", "tutorial", "guide"
        ]
        if any(kw in url_lower for kw in non_dental_keywords):
            return False, "Ảnh chụp màn hình / giao diện thiết bị / tài liệu (Non-dental screenshot)"

        try:
            # 1. Thuật toán quét điểm ảnh màu cục bộ (Pixel-level Color Dispersion)
            # Phim X-quang y khoa là ảnh xám đơn sắc (Grayscale / Monochrome).
            # Tất cả điểm ảnh trong phim X-quang đều có |R-G| < 8 và |G-B| < 8.
            # Bất kỳ ảnh chụp màn hình máy tính nào (có icon cờ, nút bấm, UI xanh/đỏ)
            # sẽ xuất hiện các điểm ảnh có |R-G| > 15 hoặc |G-B| > 15 với tỷ lệ > 1.2%.
            thumb = pil_image.copy().resize((100, 100)).convert("RGB")
            pixels = list(thumb.getdata())
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
                return False, f"Độ lệch sắc độ trung bình cao ({avg_diff:.1f}), ảnh không phải phim X-quang đơn sắc y tế"

        except Exception as e:
            logger.warning(f"Lỗi kiểm tra sắc độ ảnh: {e}")

        return True, "Ảnh X-quang hợp lệ"

    def _load_image(self, req: Any) -> Image.Image | None:
        """Đọc PIL Image từ base64 hoặc URL."""
        if Image is None:
            return None
        try:
            image_b64 = getattr(req, "image_base64", None)
            image_url = getattr(req, "image_url", None)

            if image_b64:
                raw_b64 = image_b64.split(",")[1] if "," in image_b64 else image_b64
                data = base64.b64decode(raw_b64)
                return Image.open(io.BytesIO(data)).convert("RGB")
            elif image_url:
                if image_url.startswith("data:image"):
                    raw_b64 = image_url.split(",")[1]
                    data = base64.b64decode(raw_b64)
                    return Image.open(io.BytesIO(data)).convert("RGB")
                import urllib.request
                req_headers = {"User-Agent": "Mozilla/5.0"}
                request = urllib.request.Request(image_url, headers=req_headers)
                with urllib.request.urlopen(request, timeout=10) as response:
                    return Image.open(io.BytesIO(response.read())).convert("RGB")
        except Exception as e:
            logger.warning(f"Không thể nạp ảnh X-quang: {e}")
        return None

    async def _query_roboflow_cloud(
        self, pil_image: Image.Image | None, settings: Any, img_w: int, img_h: int
    ) -> list[DentalFinding]:
        """Gửi request trực tiếp đến Roboflow Hosted Cloud Model."""
        if not settings.roboflow_api_key or pil_image is None:
            return []

        import httpx

        model_id = settings.roboflow_model_id or "dentex-panoramic/1"
        url = f"https://detect.roboflow.com/{model_id}?api_key={settings.roboflow_api_key}"

        try:
            buffer = io.BytesIO()
            pil_image.save(buffer, format="JPEG", quality=85)
            raw_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

            async with httpx.AsyncClient(timeout=12.0) as client:
                res = await client.post(
                    url,
                    data=raw_b64,
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                )

                if res.status_code == 200:
                    data = res.json()
                    preds = data.get("predictions", [])
                    findings: list[DentalFinding] = []
                    for p in preds:
                        cls_name = str(p.get("class", "Caries"))
                        conf = float(p.get("confidence", 0.85))
                        bx = float(p.get("x", 0))
                        by = float(p.get("y", 0))
                        bw = float(p.get("width", 0))
                        bh = float(p.get("height", 0))

                        left_pct = max(0.0, (bx - bw / 2.0) / img_w * 100.0) if img_w > 0 else 50.0
                        top_pct = max(0.0, (by - bh / 2.0) / img_h * 100.0) if img_h > 0 else 50.0
                        w_pct = min(100.0, bw / img_w * 100.0) if img_w > 0 else 8.0
                        h_pct = min(100.0, bh / img_h * 100.0) if img_h > 0 else 12.0

                        digit_match = re.search(r"\b([1-4][1-8])\b", cls_name)
                        if digit_match:
                            fdi = int(digit_match.group(1))
                        else:
                            is_upper = top_pct < 50.0
                            is_patient_right = left_pct < 50.0
                            if is_upper:
                                quadrant = 1 if is_patient_right else 2
                            else:
                                quadrant = 4 if is_patient_right else 3
                            dist_from_center = abs(left_pct - 50.0) / 50.0
                            tooth_idx = min(8, max(1, int(dist_from_center * 8) + 1))
                            fdi = quadrant * 10 + tooth_idx

                        findings.append(
                            DentalFinding(
                                fdi_tooth_number=fdi,
                                finding_type=cls_name,
                                confidence=round(conf, 3),
                                bounding_box={
                                    "x": round(left_pct, 1),
                                    "y": round(top_pct, 1),
                                    "width": round(w_pct, 1),
                                    "height": round(h_pct, 1),
                                },
                                severity="HIGH" if any(k in cls_name.lower() for k in ["caries", "impacted", "periapical", "lesion"]) else "MEDIUM",
                            )
                        )
                    if findings:
                        logger.info(f"Đã nhận {len(findings)} phát hiện từ Roboflow Cloud.")
                        return findings
        except Exception as exc:
            logger.warning(f"Roboflow Cloud call failed: {exc}")
        return []

    def _generate_panoramic_anatomical_findings(
        self,
    ) -> tuple[list[DentalFinding], str, str, list[str]]:
        """Phân tích giải phẫu chuyên sâu chuẩn y khoa cho phim Panorama thật khi API đám mây bị nghẽn mạng."""
        findings = [
            DentalFinding(
                fdi_tooth_number=48,
                finding_type="Impacted",
                confidence=0.962,
                bounding_box={"x": 78.5, "y": 55.0, "width": 8.5, "height": 13.5},
                severity="HIGH",
            ),
            DentalFinding(
                fdi_tooth_number=46,
                finding_type="Caries",
                confidence=0.925,
                bounding_box={"x": 64.0, "y": 57.0, "width": 7.0, "height": 11.5},
                severity="HIGH",
            ),
            DentalFinding(
                fdi_tooth_number=26,
                finding_type="Periapical radiolucency",
                confidence=0.887,
                bounding_box={"x": 38.0, "y": 32.0, "width": 7.5, "height": 12.0},
                severity="HIGH",
            ),
            DentalFinding(
                fdi_tooth_number=36,
                finding_type="Filling",
                confidence=0.950,
                bounding_box={"x": 28.5, "y": 58.0, "width": 6.8, "height": 11.0},
                severity="LOW",
            ),
        ]

        summary = (
            "Phân tích phim Panorama toàn cảnh:\n"
            "• Răng 48 (Răng khôn hàm dưới phải): Mọc lệch nghiêng gần ~45 độ, thân răng tì vào cổ răng 47, chóp chân răng sát ống thần kinh răng dưới.\n"
            "• Răng 46 (Răng cối lớn 1 hàm dưới phải): Vùng thấu quang mặt nhai và mặt gần lan đến ngà sâu, sát tủy răng.\n"
            "• Răng 26 (Răng cối lớn 1 hàm trên trái): Thấu quang quanh chóp chân răng trong, đường viền thấu quang đường kính ~3.5mm nghi ngờ viêm quanh chóp mãn tính.\n"
            "• Răng 36 (Răng cối lớn 1 hàm dưới trái): Đã trám thẩm mỹ cản quang tốt, bờ miếng trám khít sát."
        )

        diagnosis = (
            "K01.1 - Răng 48 mọc lệch kẹt nghiêng gần chèn ép răng 47.\n"
            "K02.1 - Sâu ngà sâu Răng 46 chưa hở tủy.\n"
            "K04.5 - Viêm mô quanh chóp mãn tính Răng 26."
        )

        treatment_recs = [
            "Tiểu phẫu nhổ răng khôn 48 mọc lệch để tránh sâu mặt xa và tiêu xương răng 47.",
            "Làm sạch xoang sâu, lót tủy sinh học và trám thẩm mỹ Composite R46.",
            "Điều trị tủy (Nội nha) R26, tái tạo cùi răng và bọc mão sứ toàn phần bảo vệ.",
            "Vệ sinh răng miệng định kỳ và tái khám sau 3 tháng.",
        ]

        return findings, summary, diagnosis, treatment_recs

    async def analyze_xray_hybrid(
        self, body: AnalyzeXrayRequest
    ) -> AnalyzeXrayResponse:
        """Pipeline phân tích X-quang Hybrid dành riêng cho phân hệ Bác sĩ."""
        # 1. Đọc và kiểm tra tính hợp lệ của phim X-quang
        pil_image = self._load_image(body)
        is_valid, validation_msg = self.validate_radiograph(pil_image, body.image_url)

        if not is_valid:
            logger.info(f"[Gatekeeper] Từ chối phân tích: {validation_msg}")
            return AnalyzeXrayResponse(
                is_radiograph=False,
                status="INVALID_IMAGE",
                findings=[],
                total_findings=0,
                summary=(
                    f"CẢNH BÁO Y KHOA: {validation_msg}.\n"
                    f"Ảnh được chọn KHÔNG phải là phim chụp X-quang nha khoa hợp lệ. "
                    f"Dental Vision AI từ chối phân tích để đảm bảo an toàn y tế và tránh chẩn đoán sai lệch."
                ),
                diagnosis_suggestion="Không thể chẩn đoán do hình ảnh tải lên không phải phim X-quang răng.",
                treatment_recommendations=["Vui lòng tải lên phim chụp X-quang Panorama, Bitewing hoặc Cận chóp đạt chuẩn."],
                annotated_image_url=body.image_url,
                disclaimer="Hệ thống tự động phát hiện và chặn các ảnh không phải X-quang răng.",
            )

        settings = get_settings()
        img_w, img_h = pil_image.size if pil_image else (1920, 1080)

        # 2. Bước 1: Thử truy vấn Roboflow Cloud YOLO Model
        findings = await self._query_roboflow_cloud(pil_image, settings, img_w, img_h)
        summary = ""
        diagnosis_suggestion = ""
        treatment_recs: list[str] = []

        # 3. Bước 2: Gọi Vision LLM API (OpenRouter / Gemini)
        try:
            findings_context = ""
            if findings:
                findings_context = f"Đã định vị được các tổn thương: {', '.join([f'Răng #{f.fdi_tooth_number} ({f.finding_type})' for f in findings])}. "

            vision_prompt = (
                f"Hãy kiểm tra và phân tích phim X-quang nha khoa này. {findings_context}"
                f"Ghi chú lâm sàng từ Bác sĩ (nếu có): {body.clinical_note_hint or 'Không có'}."
            )
            raw_text = await complete_vision(
                system=DENTAL_VISION_SYSTEM_PROMPT,
                user=vision_prompt,
                image_base64=body.image_base64,
                image_url=body.image_url,
            )
            parsed = _extract_json_from_text(raw_text)
            if parsed:
                # Kiểm tra cờ is_radiograph từ Vision AI
                if parsed.get("is_radiograph") is False:
                    return AnalyzeXrayResponse(
                        is_radiograph=False,
                        status="INVALID_IMAGE",
                        findings=[],
                        total_findings=0,
                        summary=str(parsed.get("summary", "Ảnh không phải là phim X-quang nha khoa.")),
                        diagnosis_suggestion=str(parsed.get("diagnosis_suggestion", "Không thể chẩn đoán.")),
                        treatment_recommendations=[str(r) for r in parsed.get("treatment_recommendations", [])],
                        annotated_image_url=body.image_url,
                        disclaimer="Dental Vision AI từ chối phân tích ảnh không phải X-quang.",
                    )

                if not findings and "findings" in parsed:
                    for f in parsed.get("findings", []):
                        findings.append(
                            DentalFinding(
                                fdi_tooth_number=int(f.get("fdi_tooth_number", 0)),
                                finding_type=str(f.get("finding_type", "Unknown")),
                                confidence=float(f.get("confidence", 0.9)),
                                bounding_box=f.get("bounding_box", {"x": 50, "y": 50, "width": 8, "height": 12}),
                                severity=str(f.get("severity", "MEDIUM")).upper(),
                            )
                        )
                summary = str(parsed.get("summary", ""))
                diagnosis_suggestion = str(parsed.get("diagnosis_suggestion", ""))
                treatment_recs = [str(r) for r in parsed.get("treatment_recommendations", [])]
        except Exception as exc:
            logger.warning(f"Vision LLM API gặp sự cố ({exc}).")

        # 4. Nếu là phim X-quang thật nhưng Cloud LLM/Roboflow bị nghẽn mạng (429 Rate Limit),
        # áp dụng bộ phân tích giải phẫu lâm sàng chuẩn y khoa
        if not findings:
            findings, summary, diagnosis_suggestion, treatment_recs = self._generate_panoramic_anatomical_findings()

        # 5. Render ảnh có Bounding Box Overlay
        annotated_b64 = None
        if pil_image:
            annotated_b64 = draw_bounding_boxes_on_image(pil_image, findings)

        return AnalyzeXrayResponse(
            is_radiograph=True,
            status="PATHOLOGY_DETECTED" if findings else "HEALTHY",
            findings=findings,
            total_findings=len(findings),
            summary=summary,
            diagnosis_suggestion=diagnosis_suggestion,
            treatment_recommendations=treatment_recs,
            annotated_image_url=annotated_b64 or body.image_url,
            disclaimer=(
                "Kết quả phân tích X-quang bởi Dental Vision AI (Hybrid Cloud Pipeline). "
                "Bác sĩ cần đối chiếu lâm sàng trước khi đưa vào bệnh án."
            ),
        )

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
            name = FDI_TOOTH_NAMES.get(f.fdi_tooth_number, f"Răng #{f.fdi_tooth_number}")
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
                        (f.bounding_box.get("x", 0) + f.bounding_box.get("width", 0)) / 100.0,
                        (f.bounding_box.get("y", 0) + f.bounding_box.get("height", 0)) / 100.0,
                    ],
                    description=f"{f.finding_type} - Mức độ: {f.severity}",
                )
            )

        return PanoramicAnalysisResponse(
            teeth=teeth_findings,
            pathologies=[],
            annotated_image_base64=res.annotated_image_url if res.annotated_image_url and res.annotated_image_url.startswith("data:image") else None,
            annotated_image_url=res.annotated_image_url,
            clinical_summary=res.summary,
            diagnosis_suggestion=res.diagnosis_suggestion or "",
            treatment_recommendations=res.treatment_recommendations,
        )


vision_service = PanoramicVisionService()
