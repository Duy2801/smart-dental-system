from secrets import compare_digest
from fastapi import APIRouter, Depends, Header, HTTPException

from app.config import get_settings
from app.schemas.vision import (
    PanoramicAnalysisRequest,
    PanoramicAnalysisResponse,
)
from app.services.vision_service import vision_service


def require_api_key(x_api_key: str | None = Header(default=None)):
    expected = get_settings().ai_service_api_key
    if not expected or not compare_digest(x_api_key or "", expected):
        raise HTTPException(status_code=401, detail="Invalid AI service API key")


router = APIRouter(dependencies=[Depends(require_api_key)])


@router.post(
    "/analyze-panoramic",
    response_model=PanoramicAnalysisResponse,
    summary="Phân tích phim X-quang toàn cảnh (Dental Panoramic Radiograph - OPG) với hệ FDI",
)
async def analyze_panoramic(
    req: PanoramicAnalysisRequest,
) -> PanoramicAnalysisResponse:
    """
    Phân tích ảnh X-quang Panorama:
    - Đánh số và phân loại 32 răng theo hệ thống FDI
    - Phát hiện sâu răng, viêm quanh chóp, răng ngầm, mất răng, phục hình
    - Sinh ảnh trực quan với bounding boxes & nhãn lâm sàng
    - Đề xuất chẩn đoán sơ bộ và phác đồ điều trị
    """
    try:
        return await vision_service.analyze_panoramic_image(req)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi trong quá trình xử lý ảnh X-quang: {str(e)}",
        )
