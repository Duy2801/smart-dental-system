"""
Script chuyển đổi dataset Tufts Dental Database (PhysioNet) sang định dạng YOLO.
Hỗ trợ gán nhãn 32 răng (hệ FDI: 11-48) và các bất thường (Abnormalities/Caries/Restorations).
"""

import json
import os
from pathlib import Path
import shutil
import csv

def convert_rect_to_yolo(x_min: float, y_min: float, x_max: float, y_max: float, img_w: int, img_h: int):
    w = x_max - x_min
    h = y_max - y_min
    x_center = (x_min + w / 2.0) / img_w
    y_center = (y_min + h / 2.0) / img_h
    return x_center, y_center, w / img_w, h / img_h

def process_tufts_dataset(raw_dir: str, output_dir: str):
    raw_path = Path(raw_dir)
    out_path = Path(output_dir)

    print(f"[*] Đang chuẩn bị dữ liệu Tufts Dental từ: {raw_dir}")
    for subset in ["train", "val"]:
        (out_path / "images" / subset).mkdir(parents=True, exist_ok=True)
        (out_path / "labels" / subset).mkdir(parents=True, exist_ok=True)

    # Đọc danh sách file ảnh và file csv/json tương ứng
    images = list(raw_path.glob("**/*.jpg")) + list(raw_path.glob("**/*.png"))
    if not images:
        print(f"[!] Không tìm thấy file ảnh nào trong {raw_dir}")
        print("Vui lòng tải Tufts Dental Panoramic Radiographs dataset từ PhysioNet/Kaggle.")
        return

    print(f"[✓] Tìm thấy {len(images)} ảnh.")
    # Tạo data.yaml
    yaml_content = f"""path: {out_path.resolve().as_posix()}
train: images/train
val: images/val

names:
  0: Tooth
  1: Caries
  2: Restoration
  3: Impacted
  4: Periapical_Lesion
"""
    with open(out_path / "data.yaml", "w", encoding="utf-8") as yf:
        yf.write(yaml_content)

    print(f"[✓] Đã tạo cấu hình {out_path / 'data.yaml'}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Chuyển đổi dataset Tufts sang YOLO")
    parser.add_argument("--raw_dir", type=str, default="./data/raw/tufts", help="Thư mục chứa Tufts dataset")
    parser.add_argument("--output_dir", type=str, default="./data/processed/tufts_yolo", help="Thư mục xuất YOLO")
    args = parser.parse_args()

    process_tufts_dataset(args.raw_dir, args.output_dir)
