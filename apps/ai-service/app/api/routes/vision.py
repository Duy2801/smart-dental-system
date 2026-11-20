from fastapi import APIRouter, Depends, HTTPException

from app.api.security import require_api_key
from app.schemas.vision import (
    PanoramicAnalysisRequest,
    PanoramicAnalysisResponse,
)
from app.services.vision_service import vision_service


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
