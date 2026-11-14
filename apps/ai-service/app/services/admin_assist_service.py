"""Gợi ý nội dung cho các form quản trị (dịch vụ, phương pháp, khuyến mãi).

AI chỉ soạn phần chữ. Giá tiền, mức giảm, thời hạn khuyến mãi do người quản trị
quyết định, AI không được đề xuất.
"""

from app.core import llm
from app.schemas.admin_assist import (
    ContentSuggestRequest,
    ContentSuggestResponse,
    HighlightSuggestion,
)
from app.services.doctor_assist_service import _extract_json

_HIGHLIGHT_ICONS = {"shield", "sparkles", "checkup", "clock"}

ADMIN_CONTENT_SYSTEM = """Bạn là chuyên viên nội dung cho một phòng khám nha khoa tại Việt Nam.
Nhiệm vụ: soạn nội dung giới thiệu ngắn gọn, chuyên nghiệp, dễ hiểu cho bệnh nhân.

Quy tắc bắt buộc:
- Viết tiếng Việt có dấu, giọng văn lịch sự, trung thực, không phóng đại.
- KHÔNG nêu giá tiền, con số phần trăm giảm giá, ngày tháng, hay cam kết kết quả điều trị
  (ví dụ "đảm bảo 100%", "vĩnh viễn", "không đau tuyệt đối").
- KHÔNG bịa tên bác sĩ, thương hiệu thiết bị, chứng nhận hay số liệu thống kê.
- Chỉ trả về MỘT đối tượng JSON hợp lệ, không kèm giải thích hay markdown.
"""

_SCHEMAS = {
    "service": """{
  "short_description": "1 câu, tối đa 200 ký tự, hiển thị trên thẻ dịch vụ",
  "description": "2-3 đoạn ngắn: dịch vụ là gì, phù hợp với ai, lợi ích chính, lưu ý chung; tối đa 1500 ký tự",
  "pricing_note": "1 câu lưu ý về giá, ví dụ giá khởi điểm và chi phí cuối cùng xác nhận sau thăm khám; tối đa 300 ký tự",
  "highlights": [
    {"title": "tối đa 60 ký tự", "description": "tối đa 200 ký tự", "icon": "shield | sparkles | checkup | clock"}
  ],
  "duration_minutes": "số phút điển hình cho một lần thực hiện, số nguyên 5-600"
}
highlights gồm đúng 3 mục, mỗi mục một icon khác nhau phù hợp nội dung.""",
    "treatment_method": """{
  "description": "1-2 đoạn ngắn: đặc điểm, ưu điểm, trường hợp phù hợp của phương pháp; tối đa 800 ký tự",
  "duration_minutes": "số phút điển hình cho một lần thực hiện, số nguyên 5-600"
}""",
    "promotion": """{
  "description": "2-4 câu mô tả chương trình khuyến mãi: đối tượng, phạm vi áp dụng, lời kêu gọi đặt lịch; tối đa 600 ký tự. Chỉ nhắc mức giảm, thời hạn nếu có trong NGỮ CẢNH, không tự đặt ra."
}""",
}

_KIND_LABEL = {
    "service": "nhóm dịch vụ nha khoa",
    "treatment_method": "phương pháp điều trị nha khoa",
    "promotion": "chương trình khuyến mãi của phòng khám nha khoa",
}


def _clean_text(value: object, max_length: int) -> str:
    if not isinstance(value, str):
        return ""
    text = value.strip()
    if len(text) <= max_length:
        return text
    cut = text[:max_length].rsplit(" ", 1)[0].rstrip(" ,;:")
    return cut or text[:max_length]


def _clean_duration(value: object) -> int | None:
    try:
        minutes = int(float(value))  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None
    if minutes < 5 or minutes > 600:
        return None
    return round(minutes / 5) * 5


def _clean_highlights(value: object) -> list[HighlightSuggestion]:
    if not isinstance(value, list):
        return []
    result: list[HighlightSuggestion] = []
    for item in value[:4]:
        if not isinstance(item, dict):
            continue
        title = _clean_text(item.get("title"), 100)
        if not title:
            continue
        icon = item.get("icon")
        result.append(
            HighlightSuggestion(
                title=title,
                description=_clean_text(item.get("description"), 300),
                icon=icon if icon in _HIGHLIGHT_ICONS else "shield",
            )
        )
    return result


def _build_user_prompt(body: ContentSuggestRequest) -> str:
    lines = [
        f"Loại nội dung: {_KIND_LABEL[body.kind]}",
        f"Tên: {body.name.strip()}",
    ]
    if body.category:
        lines.append(f"Danh mục: {body.category.strip()}")
    if body.service_name:
        lines.append(f"Thuộc nhóm dịch vụ: {body.service_name.strip()}")
    if body.promotion_context:
        lines.append(f"NGỮ CẢNH: {body.promotion_context.strip()}")
    lines.append("")
    lines.append("Trả về JSON đúng cấu trúc sau:")
    lines.append(_SCHEMAS[body.kind])
    return "\n".join(lines)


class AdminAssistService:
    async def suggest_content(
        self, body: ContentSuggestRequest
    ) -> ContentSuggestResponse:
        raw = await llm.complete(ADMIN_CONTENT_SYSTEM, _build_user_prompt(body))
        data = _extract_json(raw)
        if not data:
            raise ValueError("AI không trả về JSON hợp lệ")

        if body.kind == "promotion":
            return ContentSuggestResponse(
                description=_clean_text(data.get("description"), 1000)
            )

        if body.kind == "treatment_method":
            return ContentSuggestResponse(
                description=_clean_text(data.get("description"), 2000),
                duration_minutes=_clean_duration(data.get("duration_minutes")),
            )

        return ContentSuggestResponse(
            short_description=_clean_text(data.get("short_description"), 255),
            description=_clean_text(data.get("description"), 5000),
            pricing_note=_clean_text(data.get("pricing_note"), 500),
            highlights=_clean_highlights(data.get("highlights")),
            duration_minutes=_clean_duration(data.get("duration_minutes")),
        )
