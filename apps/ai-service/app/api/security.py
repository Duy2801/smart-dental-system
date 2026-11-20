from secrets import compare_digest

from fastapi import Header, HTTPException

from app.config import get_settings

# Giá trị mẫu từng nằm trong README, app mobile và code backend, nên ai cũng biết:
# không bao giờ chấp nhận nó làm key thật.
INSECURE_DEFAULT_KEYS = {"", "dev-local-key"}


def require_api_key(x_api_key: str | None = Header(default=None)) -> None:
    """Chỉ backend (giữ AI_SERVICE_API_KEY) được gọi AI service.

    Các route chatbot tin trường `created_by_user_id` trong body để đọc lịch hẹn,
    hồ sơ và đặt lịch thay người dùng, nên tuyệt đối không được mở công khai.
    """
    if not x_api_key:
        raise HTTPException(status_code=401, detail="Invalid AI service API key")
    expected = get_settings().ai_service_api_key.strip()
    if expected in INSECURE_DEFAULT_KEYS:
        raise HTTPException(
            status_code=503,
            detail="AI_SERVICE_API_KEY is not configured on the AI service",
        )
    if not compare_digest(x_api_key, expected):
        raise HTTPException(status_code=401, detail="Invalid AI service API key")
