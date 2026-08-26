from __future__ import annotations

import hashlib
import os
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path


REPOSITORY_ID = "Hau1122/smart-dental-pano-ai"
REVISION = os.getenv("DENTAL_MODEL_REVISION", "main")
BASE_URL = f"https://huggingface.co/{REPOSITORY_ID}/resolve/{REVISION}"
MODEL_DIRECTORY = (
    Path(__file__).resolve().parent
    / "apps"
    / "ai-service"
    / "dental-pano-ai"
    / "models"
)
CHUNK_SIZE = 1024 * 1024


@dataclass(frozen=True)
class ModelFile:
    relative_path: Path
    sha256: str

    @property
    def url(self) -> str:
        return f"{BASE_URL}/{self.relative_path.as_posix()}?download=true"


MODEL_FILES = (
    ModelFile(
        Path("deeplab/model.pth"),
        "f6b54cc119beec865cc2438a0d2dfba7e9788371ae329b9b040663aa5b114fc6",
    ),
    ModelFile(
        Path("yolo/model.pt"),
        "d3a987c95a8ceb07ea27d4e0561efb02ffc1a2bd089cadbab75dbe0827d22e50",
    ),
)


def calculate_sha256(file_path: Path) -> str:
    digest = hashlib.sha256()
    with file_path.open("rb") as file:
        while chunk := file.read(CHUNK_SIZE):
            digest.update(chunk)
    return digest.hexdigest()


def is_valid_model(file_path: Path, expected_sha256: str) -> bool:
    return file_path.is_file() and calculate_sha256(file_path) == expected_sha256


def print_progress(file_name: str, downloaded: int, total: int) -> None:
    downloaded_mb = downloaded / 1024 / 1024
    if total <= 0:
        print(f"\r[{file_name}] {downloaded_mb:.1f} MB", end="", flush=True)
        return

    total_mb = total / 1024 / 1024
    percent = min(downloaded * 100 / total, 100)
    print(
        f"\r[{file_name}] {percent:5.1f}% ({downloaded_mb:.1f}/{total_mb:.1f} MB)",
        end="",
        flush=True,
    )


def download_file(model: ModelFile, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = destination.with_suffix(destination.suffix + ".part")
    downloaded = temporary_path.stat().st_size if temporary_path.exists() else 0
    headers = {"User-Agent": "smart-dental-system"}
    if downloaded:
        headers["Range"] = f"bytes={downloaded}-"
    request = urllib.request.Request(model.url, headers=headers)

    with urllib.request.urlopen(request, timeout=120) as response:
        is_resumed = downloaded > 0 and response.status == 206
        if not is_resumed:
            downloaded = 0
        remaining = int(response.headers.get("Content-Length", 0))
        total = downloaded + remaining if remaining else 0
        mode = "ab" if is_resumed else "wb"
        with temporary_path.open(mode) as output:
            while chunk := response.read(CHUNK_SIZE):
                output.write(chunk)
                downloaded += len(chunk)
                print_progress(destination.name, downloaded, total)
    print()

    if calculate_sha256(temporary_path) != model.sha256:
        temporary_path.unlink(missing_ok=True)
        raise ValueError(f"Checksum khong hop le: {destination.name}")
    temporary_path.replace(destination)


def ensure_model(model: ModelFile) -> None:
    destination = MODEL_DIRECTORY / model.relative_path
    if is_valid_model(destination, model.sha256):
        print(f"[OK] Da co {model.relative_path}, bo qua tai lai.")
        return

    if destination.exists():
        print(f"[WARN] {model.relative_path} sai checksum, tai lai.")
    else:
        print(f"[DOWNLOAD] {model.relative_path}")
    download_file(model, destination)
    print(f"[OK] Da tai {model.relative_path}")


def main() -> int:
    try:
        for model in MODEL_FILES:
            ensure_model(model)
    except (OSError, ValueError, urllib.error.URLError) as error:
        print(f"[ERROR] Khong the tai model: {error}", file=sys.stderr)
        return 1

    print(f"[OK] Model san sang tai: {MODEL_DIRECTORY}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
