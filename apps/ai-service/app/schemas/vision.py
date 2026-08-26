from typing import Literal
from pydantic import BaseModel, Field

ToothStatusType = Literal[
    "healthy",
    "caries",
    "periapical_lesion",
    "impacted",
    "missing",
    "filled",
    "crown",
    "implant",
    "root_canal",
]

class BoundingBox(BaseModel):
    x_min: float = Field(..., description="Tọa độ x min (0-1 hoặc pixel)")
    y_min: float = Field(..., description="Tọa độ y min (0-1 hoặc pixel)")
    x_max: float = Field(..., description="Tọa độ x max (0-1 hoặc pixel)")
    y_max: float = Field(..., description="Tọa độ y max (0-1 hoặc pixel)")

class ToothFinding(BaseModel):
    tooth_number: int = Field(..., description="Số răng theo hệ FDI (11-48)")
    tooth_name: str = Field(..., description="Tên giải phẫu răng")
    status: ToothStatusType = Field("healthy", description="Tình trạng răng")
    status_label_vi: str = Field("Bình thường", description="Tên tình trạng tiếng Việt")
    confidence: float = Field(0.95, description="Độ tin cậy của AI (0.0 - 1.0)")
    bbox: list[float] = Field(default_factory=list, description="Bounding Box [x1, y1, x2, y2]")
    description: str | None = Field(None, description="Mô tả chi tiết tổn thương hoặc tình trạng")

class PathologyFinding(BaseModel):
    category: str = Field(..., description="Phân loại bệnh lý (Caries, Periapical Lesion, Impacted...)")
    category_label_vi: str = Field(..., description="Tên bệnh lý tiếng Việt")
    teeth_involved: list[int] = Field(default_factory=list, description="Các răng liên quan")
    severity: Literal["mild", "moderate", "severe"] = Field("moderate", description="Mức độ nghiêm trọng")
    description: str = Field(..., description="Mô tả lâm sàng chi tiết")

class PanoramicAnalysisRequest(BaseModel):
    image_url: str | None = Field(None, description="Đường dẫn URL ảnh X-quang")
    image_base64: str | None = Field(None, description="Dữ liệu ảnh base64")
    patient_name: str | None = Field(None, description="Tên bệnh nhân")
    chief_complaint: str | None = Field(None, description="Lý do đến khám")
    doctor_notes: str | None = Field(None, description="Ghi chú thêm của bác sĩ")

class PanoramicAnalysisResponse(BaseModel):
    teeth: list[ToothFinding] = Field(default_factory=list, description="Danh sách 32 răng và tình trạng")
    pathologies: list[PathologyFinding] = Field(default_factory=list, description="Các bệnh lý phát hiện được")
    annotated_image_url: str | None = Field(None, description="Ảnh đã vẽ bounding boxes và nhãn")
    annotated_image_base64: str | None = Field(None, description="Ảnh base64 đã vẽ nhãn")
    clinical_summary: str = Field(..., description="Tóm tắt phân tích hình ảnh tổng quát")
    diagnosis_suggestion: str = Field(..., description="Gợi ý chẩn đoán sơ bộ cho bác sĩ")
    treatment_recommendations: list[str] = Field(default_factory=list, description="Đề xuất các can thiệp điều trị")
    disclaimer: str = Field(
        "Kết quả phân tích hình ảnh AI chỉ mang tính chất hỗ trợ gợi ý. Bác sĩ lâm sàng chịu trách nhiệm đối chiếu trực tiếp và đưa ra quyết định chẩn đoán cuối cùng.",
        description="Lưu ý pháp lý và lâm sàng",
    )
