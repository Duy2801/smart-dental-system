"""
Script tự động tải trọng số pre-trained models (chỉ tải 1 file trọng số nhẹ, KHÔNG cần tải dataset).
Nguồn: Mô hình Dental Vision AI (multinational panoramic study).
"""

import os
import urllib.request
import tarfile
from pathlib import Path

WEIGHTS_URL = "https://dental-pano-ai.s3.ap-southeast-1.amazonaws.com/models.tar.gz"
TARGET_DIR = Path("./models")

def download_weights():
    TARGET_DIR.mkdir(parents=True, exist_ok=True)
    tar_path = TARGET_DIR / "models.tar.gz"

    print(f"[*] Đang tải trọng số pre-trained từ: {WEIGHTS_URL}")
    print("[*] Quá trình này chỉ tải file mô hình đã học sẵn (không tải dataset)...")

    try:
        def reporthook(blocknum, blocksize, totalsize):
            readsofar = blocknum * blocksize
            if totalsize > 0:
                percent = readsofar * 1e2 / totalsize
                s = f"\r[+] Đang tải: {percent:5.1f}% ({readsofar / (1024*1024):.1f} MB / {totalsize / (1024*1024):.1f} MB)"
                print(s, end="")

        urllib.request.urlretrieve(WEIGHTS_URL, tar_path, reporthook=reporthook)
        print("\n[✓] Tải file nén thành công. Đang giải nén trọng số...")

        with tarfile.open(tar_path, "r:gz") as tar:
            tar.extractall(path="./")

        print(f"[✓] Hoàn tất! Trọng số mô hình đã được đặt tại: {TARGET_DIR.resolve()}")
        if tar_path.exists():
            tar_path.unlink() # Xóa file tar sau khi giải nén

    except Exception as e:
        print(f"\n[!] Không thể tải tự động từ S3: {e}")
        print("[i] Hệ thống vẫn hoạt động bình thường với Diagnostic Vision Engine tích hợp sẵn!")

if __name__ == "__main__":
    download_weights()
