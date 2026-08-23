"""
Script huấn luyện mô hình YOLO (YOLOv8/YOLOv11) cho bài toán phân tích phim X-quang toàn cảnh Panorama.
Hỗ trợ:
- Object Detection (YOLOv8m / YOLOv11m)
- Instance Segmentation (YOLOv8m-seg)
"""

import argparse
from pathlib import Path

def train(
    data_yaml: str,
    model_type: str = "yolov8m.pt",
    epochs: int = 100,
    imgsz: int = 1024,
    batch: int = 8,
    device: str = "0",
    project: str = "runs/train",
    name: str = "dental_pano_yolo"
):
    try:
        from ultralytics import YOLO
    except ImportError:
        print("[!] Thư viện ultralytics chưa được cài đặt. Vui lòng chạy: pip install ultralytics")
        return

    data_path = Path(data_yaml)
    if not data_path.exists():
        print(f"[!] Không tìm thấy file data.yaml tại: {data_yaml}")
        return

    print(f"[*] Bắt đầu huấn luyện mô hình {model_type} trên dataset: {data_yaml}")
    print(f"[*] Cấu hình: epochs={epochs}, imgsz={imgsz}, batch={batch}, device={device}")

    # Load model pre-trained
    model = YOLO(model_type)

    # Bắt đầu huấn luyện
    results = model.train(
        data=str(data_path.resolve()),
        epochs=epochs,
        imgsz=imgsz,
        batch=batch,
        device=device,
        project=project,
        name=name,
        save=True,
        plots=True,
        augment=True,
        degrees=5.0,
        translate=0.05,
        scale=0.1,
        fliplr=0.5, # Lật ngang đối xứng hàm răng
    )

    print("[✓] Huấn luyện hoàn tất!")
    print(f"[✓] Trọng số tốt nhất (Best weights) được lưu tại: {Path(project) / name / 'weights' / 'best.pt'}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Huấn luyện mô hình YOLO phân tích X-quang Panorama")
    parser.add_argument("--data", type=str, default="./data/processed/dentex_yolo/data.yaml", help="Đường dẫn file data.yaml")
    parser.add_argument("--model", type=str, default="yolov8m.pt", help="Base model checkpoint (vd: yolov8n.pt, yolov8m.pt, yolo11m.pt)")
    parser.add_argument("--epochs", type=int, default=100, help="Số epochs huấn luyện")
    parser.add_argument("--imgsz", type=int, default=1024, help="Kích thước ảnh đầu vào")
    parser.add_argument("--batch", type=int, default=8, help="Batch size")
    parser.add_argument("--device", type=str, default="cpu", help="Thiết bị tính toán: 0, 1 hoặc cpu")
    args = parser.parse_args()

    train(
        data_yaml=args.data,
        model_type=args.model,
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        device=args.device
    )
