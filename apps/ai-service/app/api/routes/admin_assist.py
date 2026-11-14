from fastapi import APIRouter, Depends, HTTPException

from app.api.routes.doctor_assist import require_api_key
from app.schemas.admin_assist import ContentSuggestRequest, ContentSuggestResponse
from app.services.admin_assist_service import AdminAssistService

router = APIRouter(dependencies=[Depends(require_api_key)])
service = AdminAssistService()


@router.post("/suggest-content", response_model=ContentSuggestResponse)
async def suggest_content(body: ContentSuggestRequest):
    """Soạn nháp nội dung (mô tả, điểm nổi bật...) để quản trị viên duyệt và chỉnh sửa."""
    try:
        return await service.suggest_content(body)
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
