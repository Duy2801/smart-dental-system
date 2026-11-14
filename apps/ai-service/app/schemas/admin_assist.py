from typing import Literal

from pydantic import BaseModel, Field

ContentKind = Literal["service", "treatment_method", "promotion"]


class ContentSuggestRequest(BaseModel):
    kind: ContentKind
    name: str = Field(min_length=2, max_length=150)
    category: str | None = Field(default=None, max_length=100)
    service_name: str | None = Field(default=None, max_length=150)
    # Ngữ cảnh khuyến mãi: mức giảm, phạm vi, thời hạn... (chỉ để AI viết mô tả cho đúng)
    promotion_context: str | None = Field(default=None, max_length=1000)
    locale: str = "vi"


class HighlightSuggestion(BaseModel):
    title: str
    description: str = ""
    icon: Literal["shield", "sparkles", "checkup", "clock"] = "shield"


class ContentSuggestResponse(BaseModel):
    short_description: str = ""
    description: str = ""
    pricing_note: str = ""
    highlights: list[HighlightSuggestion] = Field(default_factory=list)
    duration_minutes: int | None = None
    disclaimer: str = (
        "Nội dung do AI gợi ý, vui lòng kiểm tra và chỉnh sửa trước khi lưu."
    )
