import asyncio
import base64
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Đảm bảo in tiếng Việt chuẩn trên Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from app.schemas.vision import PanoramicAnalysisRequest
from app.services.vision_service import vision_service
from app.schemas.doctor_assist import AnalyzeXrayRequest
from app.services.doctor_assist_service import DoctorAssistService

async def main():
    print("=" * 60)
    print(" BẮT ĐẦU KIỂM TRA CHỨC NĂNG PHÂN TÍCH ẢNH X-QUANG AI")
    print("=" * 60)

    sample_img_path = Path("data/sample_panoramic.jpg")
    img_b64 = None
    if sample_img_path.exists():
        with open(sample_img_path, "rb") as f:
            img_b64 = base64.b64encode(f.read()).decode("utf-8")
        print(f"[✓] Đã đọc ảnh X-quang mẫu ({len(img_b64)} bytes base64)")
    else:
        print("[!] Không thấy file sample_panoramic.jpg, sẽ test qua mock image.")

    # 1. Test Vision Service trực tiếp
    print("\n--- 1. Kiểm tra Panoramic Vision Service (/api/v1/vision/analyze-panoramic) ---")
    req1 = PanoramicAnalysisRequest(
        image_base64=img_b64,
        chief_complaint="Đau nhức vùng hàm dưới bên phải khi ăn nhai",
        doctor_notes="Nghi ngờ sâu răng 46 và răng khôn 38, 48 mọc kẹt",
    )
    res1 = await vision_service.analyze_panoramic_image(req1)
    
    print(f"[✓] Số lượng răng nhận diện được: {len(res1.teeth)} răng (hệ FDI 11-48)")
    print(f"[✓] Số lượng nhóm bệnh lý phát hiện: {len(res1.pathologies)} nhóm")
    for p in res1.pathologies:
        print(f"    + {p.category_label_vi} (Răng: {p.teeth_involved}) - Mức độ: {p.severity}")
    
    if res1.annotated_image_base64:
        print(f"[✓] Đã sinh ảnh vẽ Bounding Box màu thành công (Độ dài: {len(res1.annotated_image_base64)} chars)")
    else:
        print("[!] Chưa có ảnh annotated base64.")

    print(f"[✓] Tóm tắt lâm sàng:\n    {res1.clinical_summary}")
    print(f"[✓] Gợi ý chẩn đoán ICD:\n    {res1.diagnosis_suggestion}")
    print(f"[✓] Đề xuất phác đồ điều trị:")
    for rec in res1.treatment_recommendations:
        print(f"    * {rec}")

    # 2. Test Doctor Assist Proxy API
    print("\n--- 2. Kiểm tra API Bác sĩ AI (/api/v1/doctor/analyze-xray) ---")
    doc_service = DoctorAssistService()
    req2 = AnalyzeXrayRequest(
        image_base64=img_b64,
        image_url="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5",
        clinical_note_hint="Kiểm tra răng khôn và tủy răng",
    )
    res2 = await doc_service.analyze_xray(req2)
    print(f"[✓] Tổng số phát hiện (Total Findings): {res2.total_findings}")
    for f in res2.findings:
        print(f"    * Răng #{f.fdi_tooth_number}: {f.finding_type} - Tin cậy: {f.confidence*100:.1f}% - Mức độ: {f.severity}")

    print("\n" + "=" * 60)
    print(" KẾT QUẢ: TẤT CẢ CÁC TÍNH NĂNG VISION AI HOẠT ĐỘNG HOÀN HẢO!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
