"""Prepare a blinded reference sheet, then export current local-model predictions."""
from __future__ import annotations

import argparse
import csv
import hashlib
import importlib.metadata
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

SERVICE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE))
from app.services.local_panoramic_model import FINDING_LABELS, LocalPanoramicModel


def write_csv(path: Path, fields: list[str], rows: list[dict]) -> None:
    with path.open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def read_csv(path: Path) -> list[dict]:
    with path.open(encoding="utf-8-sig", newline="") as stream:
        return list(csv.DictReader(stream))


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def prepare(images: Path, output: Path, finding_type: str) -> None:
    paths = sorted(path for path in images.iterdir() if path.is_file() and path.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"})
    if not paths:
        raise ValueError("No images found. Put JPG/PNG/WEBP files in the images folder.")
    output.mkdir(parents=True, exist_ok=True)
    if any((output / name).exists() for name in ["reference.csv", "manifest.json", "run_metadata.json"]):
        raise ValueError("Output already contains an evaluation. Use a NEW output folder; references will not be overwritten.")
    manifest = {"finding_type": finding_type, "images_dir": str(images.resolve()),
                "images": {path.name: sha256(path) for path in paths}}
    write_csv(output / "reference.csv", ["ten_anh", "rang_co_phat_hien", "da_kiem_tra"],
              [{"ten_anh": path.name, "rang_co_phat_hien": "", "da_kiem_tra": "0"} for path in paths])
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Prepared {len(paths)} images for: {finding_type}")
    print(f"Ask a dentist to complete {output / 'reference.csv'} BEFORE running predict.")


def predict(output: Path) -> bool:
    from PIL import Image

    manifest = json.loads((output / "manifest.json").read_text(encoding="utf-8"))
    references = read_csv(output / "reference.csv")
    names = [row["ten_anh"] for row in references]
    if len(names) != len(set(names)) or set(names) != set(manifest["images"]):
        raise ValueError("Reference image names changed or contain duplicates. Restore the prepared list.")
    for row in references:
        if row["da_kiem_tra"].strip() != "1":
            raise ValueError(f"Dentist review incomplete: {row['ten_anh']}. Set da_kiem_tra=1 only AFTER full review.")
        teeth = row["rang_co_phat_hien"].strip()
        if teeth and any(tooth.strip() not in {str(q * 10 + t) for q in range(1, 5) for t in range(1, 9)} for tooth in teeth.split(";")):
            raise ValueError(f"Invalid tooth number in {row['ten_anh']}. Use e.g. 46;47, or leave blank.")
    images = Path(manifest["images_dir"])
    for name, checksum in manifest["images"].items():
        if sha256(images / name) != checksum:
            raise ValueError(f"Image changed since preparation: {name}")

    model = LocalPanoramicModel()
    predictions, statuses = [], []
    for name in names:
        try:
            with Image.open(images / name) as image:
                findings = model.analyze(image.convert("RGB"))
            predictions.extend({"image_id": name, "fdi": item.fdi_tooth_number,
                                "finding_type": item.finding_type, "confidence": item.confidence} for item in findings)
            statuses.append({"image_id": name, "status": "OK", "error": ""})
            print(f"OK: {name} ({len(findings)} findings)")
        except Exception as error:
            statuses.append({"image_id": name, "status": "ERROR", "error": type(error).__name__})
            print(f"ERROR: {name}: {error}", file=sys.stderr)

    write_csv(output / "predictions.csv", ["image_id", "fdi", "finding_type", "confidence"], predictions)
    write_csv(output / "inference_status.csv", ["image_id", "status", "error"], statuses)
    tracked = ["app/services/local_panoramic_model.py", "dental-pano-ai/main.py",
               "dental-pano-ai/models/deeplab/config.yaml", "dental-pano-ai/models/yolo/config.yaml",
               "dental-pano-ai/models/deeplab/model.pth", "dental-pano-ai/models/yolo/model.pt"]
    versions = {}
    for package in ["torch", "torchvision", "detectron2", "ultralytics", "numpy", "Pillow"]:
        try:
            versions[package] = importlib.metadata.version(package)
        except importlib.metadata.PackageNotFoundError:
            versions[package] = None
    metadata = {"finding_type": manifest["finding_type"], "images": manifest["images"],
                "reference_sha256": sha256(output / "reference.csv"),
                "predictions_sha256": sha256(output / "predictions.csv"),
                "status_sha256": sha256(output / "inference_status.csv"),
                "confidence_threshold": model.confidence_threshold,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "model_scope": "LocalPanoramicModel findings before doctor correction; not full API or clinical validation",
                "files_sha256": {name: sha256(SERVICE / name) for name in tracked if (SERVICE / name).is_file()},
                "python": sys.version, "packages": versions,
                "inference_errors": sum(row["status"] != "OK" for row in statuses)}
    (output / "run_metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(f"Exported to: {output}")
    print("Upload reference.csv, predictions.csv, inference_status.csv and run_metadata.json to the Colab notebook.")
    return metadata["inference_errors"] == 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    prep = commands.add_parser("prepare", help="Create the dentist reference sheet; does not run AI")
    prep.add_argument("--images", type=Path, required=True)
    prep.add_argument("--out", type=Path, required=True)
    prep.add_argument("--finding-type", choices=list(FINDING_LABELS.values()), default="Caries")
    run = commands.add_parser("predict", help="Run the current local model after the dentist completes the reference sheet")
    run.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    try:
        if args.command == "prepare":
            prepare(args.images, args.out, args.finding_type)
            return 0
        return 0 if predict(args.out) else 1
    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
