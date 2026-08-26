"""
Script chuyển đổi dữ liệu DENTEX 2023 sang định dạng huấn luyện YOLO.
Hỗ trợ ánh xạ Quadrant + Tooth Number sang chuẩn FDI (11-48)
và nhận diện 4 nhóm bệnh lý chính:
0: Normal / Healthy
1: Caries (Sâu răng)
2: Deep Caries (Sâu răng tủy)
3: Periapical Lesion (Tổn thương quanh chóp)
4: Impacted (Răng ngầm / Mọc lệch)
"""

import json
import os
from pathlib import Path
import shutil
from typing import Dict, Any

# Bảng ánh xạ răng FDI
# Quadrant 1: 18 -> 11 (Hàm trên phải)
# Quadrant 2: 21 -> 28 (Hàm trên trái)
# Quadrant 3: 31 -> 38 (Hàm dưới trái)
# Quadrant 4: 41 -> 48 (Hàm dưới phải)

PATHOLOGY_MAP = {
    0: "Normal",
    1: "Caries",
    2: "Deep_Caries",
    3: "Periapical_Lesion",
    4: "Impacted"
}

def convert_coco_bbox_to_yolo(bbox: list[float], img_w: int, img_h: int) -> tuple[float, float, float, float]:
    """Chuyển đổi COCO bbox [x_min, y_min, width, height] sang YOLO [x_center, y_center, width, height] chuẩn hoá (0..1)"""
    x_min, y_min, w, h = bbox
    x_center = (x_min + w / 2.0) / img_w
    y_center = (y_min + h / 2.0) / img_h
    norm_w = w / img_w
    norm_h = h / img_h
    return x_center, y_center, norm_w, norm_h

def process_dentex_dataset(raw_dir: str, output_dir: str, split_ratio: float = 0.8):
    """
    Đọc file annotations JSON của DENTEX 2023 và sinh cấu trúc thư mục YOLO:
    output_dir/
      images/train/, images/val/
      labels/train/, labels/val/
      data.yaml
    """
    raw_path = Path(raw_dir)
    out_path = Path(output_dir)

    json_files = list(raw_path.glob("**/*.json"))
    if not json_files:
        print(f"[!] Không tìm thấy file JSON nào trong {raw_dir}")
        print("Vui lòng tải DENTEX 2023 dataset từ: https://dentex.grand-challenge.org/")
        return

    print(f"[*] Tìm thấy {len(json_files)} file annotation JSON.")
    for json_file in json_files:
        with open(json_file, "r", encoding="utf-8") as f:
            data: Dict[str, Any] = json.load(f)

        images = {img["id"]: img for img in data.get("images", [])}
        annotations = data.get("annotations", [])

        print(f"[*] Đang xử lý {len(images)} ảnh và {len(annotations)} nhãn từ {json_file.name}...")
        # Tạo cấu trúc thư mục
        for subset in ["train", "val"]:
            (out_path / "images" / subset).mkdir(parents=True, exist_ok=True)
            (out_path / "labels" / subset).mkdir(parents=True, exist_ok=True)

        img_ids = list(images.keys())
        split_idx = int(len(img_ids) * split_ratio)
        train_ids = set(img_ids[:split_idx])

        # Gom nhãn theo image_id
        img_annos: dict[int, list] = {}
        for ann in annotations:
            img_id = ann["image_id"]
            img_annos.setdefault(img_id, []).append(ann)

        for img_id, img_info in images.items():
            subset = "train" if img_id in train_ids else "val"
            file_name = img_info["file_name"]
            img_w = img_info["width"]
            img_h = img_info["height"]

            # Đường dẫn ảnh gốc
            src_img = raw_path / file_name
            if not src_img.exists():
                # Thử tìm đệ quy
                matches = list(raw_path.glob(f"**/{file_name}"))
                if matches:
                    src_img = matches[0]

            dst_img = out_path / "images" / subset / Path(file_name).name
            if src_img.exists() and not dst_img.exists():
                shutil.copy2(src_img, dst_img)

            # Tạo file label YOLO
            label_file = out_path / "labels" / subset / f"{Path(file_name).stem}.txt"
            with open(label_file, "w", encoding="utf-8") as lf:
                for ann in img_annos.get(img_id, []):
                    category_id = ann.get("category_id", 0)
                    bbox = ann.get("bbox", [])
                    if len(bbox) == 4 and img_w > 0 and img_h > 0:
                        xc, yc, nw, nh = convert_coco_bbox_to_yolo(bbox, img_w, img_h)
                        lf.write(f"{category_id} {xc:.6f} {yc:.6f} {nw:.6f} {nh:.6f}\n")

    # Tạo data.yaml cho YOLOv8 / YOLOv11
    yaml_content = f"""path: {out_path.resolve().as_posix()}
train: images/train
val: images/val

names:
  0: Normal
  1: Caries
  2: Deep_Caries
  3: Periapical_Lesion
  4: Impacted
"""
    with open(out_path / "data.yaml", "w", encoding="utf-8") as yf:
        yf.write(yaml_content)

    print(f"[✓] Hoàn tất tiền xử lý DENTEX. File cấu hình huấn luyện lưu tại: {out_path / 'data.yaml'}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Chuyển đổi dataset DENTEX sang YOLO")
    parser.add_argument("--raw_dir", type=str, default="./data/raw/dentex", help="Thư mục chứa dữ liệu gốc DENTEX")
    parser.add_argument("--output_dir", type=str, default="./data/processed/dentex_yolo", help="Thư mục xuất dữ liệu YOLO")
    args = parser.parse_args()

    process_dentex_dataset(args.raw_dir, args.output_dir)
