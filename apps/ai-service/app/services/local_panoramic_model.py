from __future__ import annotations

import importlib.util
import math
import os
import re
import sys
import threading
from dataclasses import dataclass
from pathlib import Path
from types import ModuleType
from typing import Any

MODEL_ROOT = Path(__file__).resolve().parents[2] / "dental-pano-ai"
MODEL_SOURCE = MODEL_ROOT / "main.py"
MODEL_FILES = (
    MODEL_ROOT / "models/deeplab/model.pth",
    MODEL_ROOT / "models/yolo/model.pt",
)
CACHE_ROOT = Path(__file__).resolve().parents[2] / ".cache"

FINDING_LABELS = {
    "MISSING": "Missing tooth",
    "IMPLANT": "Implant",
    "ROOT_REMNANTS": "Residual root",
    "CROWN_BRIDGE": "Crown / Bridge",
    "ENDO": "Root canal filling",
    "FILLING": "Filling",
    "CARIES": "Caries",
    "PERIAPICAL_RADIOLUCENT": "Periapical radiolucency",
}


class LocalModelUnavailableError(RuntimeError):
    pass


class NonDentalImageError(ValueError):
    pass


@dataclass(frozen=True)
class LocalDentalFinding:
    fdi_tooth_number: int
    finding_type: str
    confidence: float
    bounding_box: dict[str, float]
    severity: str
    region_source: str = "DETECTED"


class LocalPanoramicModel:
    def __init__(self, confidence_threshold: float = 0.5) -> None:
        self.confidence_threshold = confidence_threshold
        self._module: ModuleType | None = None
        self._semantic_model: Any = None
        self._instance_model: Any = None
        self._postprocessor: Any = None
        self._load_lock = threading.Lock()
        self._inference_lock = threading.Lock()

    def analyze(self, image: Any) -> list[LocalDentalFinding]:
        self._ensure_loaded()
        numpy = self._import_numpy()
        image_array = numpy.asarray(image.convert("RGB"))

        with self._inference_lock:
            semantic_prediction = self._semantic_model(image_array, MODEL_ROOT)
            instance_prediction = self._instance_model(image_array, MODEL_ROOT)
            detected_teeth = [
                instance
                for instance in instance_prediction.instances
                if str(instance.category_name).upper().startswith("TOOTH")
                and float(instance.score) >= 0.25
            ]
            if not detected_teeth:
                raise NonDentalImageError(
                    "Model không nhận diện được cấu trúc răng trên hình ảnh."
                )
            entries = self._postprocessor(semantic_prediction, instance_prediction)

        width, height = image.size
        return [
            self._convert_entry(
                entry, instance_prediction.instances, semantic_prediction, width, height
            )
            for entry in entries
            if float(entry.score) >= self.confidence_threshold
        ]

    def _ensure_loaded(self) -> None:
        if self._module is not None:
            return

        with self._load_lock:
            if self._module is not None:
                return
            self._validate_model_files()
            module = self._load_model_module()
            try:
                self._semantic_model = module.SemanticSegmentationModule(
                    config_path=str(MODEL_ROOT / "models/deeplab/config.yaml"),
                    weights_path=str(MODEL_FILES[0]),
                )
                self._instance_model = module.InstanceDetectionModule(
                    config_path=str(MODEL_ROOT / "models/yolo/config.yaml"),
                    weights_path=str(MODEL_FILES[1]),
                )
                self._postprocessor = module.PostProcessingModule()
                self._module = module
            except Exception as exc:
                raise LocalModelUnavailableError(
                    "Không thể nạp trọng số YOLO/DeepLab local. "
                    "Kiểm tra model và phiên bản dependency."
                ) from exc

    def _validate_model_files(self) -> None:
        missing = [str(path) for path in MODEL_FILES if not path.is_file()]
        if missing:
            raise LocalModelUnavailableError(
                "Thiếu model local. Chạy `python download_models.py` từ thư mục gốc. "
                f"Tệp chưa có: {', '.join(missing)}"
            )

    def _load_model_module(self) -> ModuleType:
        try:
            loaded_module = sys.modules.get("dental_pano_model")
            if loaded_module is not None:
                return loaded_module
            CACHE_ROOT.mkdir(parents=True, exist_ok=True)
            os.environ.setdefault("MPLCONFIGDIR", str(CACHE_ROOT / "matplotlib"))
            os.environ.setdefault("YOLO_CONFIG_DIR", str(CACHE_ROOT / "ultralytics"))
            spec = importlib.util.spec_from_file_location(
                "dental_pano_model", MODEL_SOURCE
            )
            if spec is None or spec.loader is None:
                raise ImportError(f"Không thể đọc {MODEL_SOURCE}")
            module = importlib.util.module_from_spec(spec)
            sys.modules[spec.name] = module
            spec.loader.exec_module(module)
            return module
        except Exception as exc:
            raise LocalModelUnavailableError(
                "Không thể khởi tạo YOLO/DeepLab local. Kiểm tra dependency bằng "
                "`pnpm --filter ai-service setup`."
            ) from exc

    @staticmethod
    def _import_numpy() -> Any:
        try:
            import numpy

            return numpy
        except ImportError as exc:
            raise LocalModelUnavailableError(
                "Thiếu NumPy. Chạy `pnpm --filter ai-service setup`."
            ) from exc

    def _convert_entry(
        self,
        entry: Any,
        instances: list[Any],
        semantic_prediction: Any,
        width: int,
        height: int,
    ) -> LocalDentalFinding:
        fdi = int(entry.fdi)
        finding_code = str(entry.finding.value)
        finding_type = FINDING_LABELS.get(finding_code, finding_code)
        confidence = round(float(entry.score), 4)
        if finding_code == "MISSING":
            bbox = self._find_missing_tooth_bbox(
                instances, semantic_prediction, fdi, width, height
            )
            region_source = "ESTIMATED" if bbox["width"] > 0 else "UNLOCATED"
        else:
            bbox = self._find_finding_bbox(
                instances, semantic_prediction, fdi, finding_code, width, height
            )
            if bbox["width"] == 0:
                bbox = self._find_tooth_bbox(instances, fdi, width, height)
            region_source = "DETECTED" if bbox["width"] > 0 else "UNLOCATED"
        return LocalDentalFinding(
            fdi_tooth_number=fdi,
            finding_type=finding_type,
            confidence=confidence,
            bounding_box=bbox,
            severity="UNASSESSED",
            region_source=region_source,
        )

    @staticmethod
    def _find_tooth_bbox(
        instances: list[Any],
        fdi: int,
        width: int,
        height: int,
    ) -> dict[str, float]:
        for instance in instances:
            name = str(instance.category_name).upper()
            match = re.search(r"TOOTH[^0-9]*([1-4][1-8])", name)
            if not match or int(match.group(1)) != fdi:
                continue
            x1, y1, x2, y2 = (float(value) for value in instance.bbox_xyxy)
            return LocalPanoramicModel._percent_bbox((x1, y1, x2, y2), width, height)
        return {"x": 0.0, "y": 0.0, "width": 0.0, "height": 0.0}

    @staticmethod
    def _find_finding_bbox(
        instances: list[Any],
        semantic_prediction: Any,
        fdi: int,
        finding_code: str,
        width: int,
        height: int,
    ) -> dict[str, float]:
        probability = getattr(semantic_prediction, "prob", None)
        if probability is None:
            return {"x": 0.0, "y": 0.0, "width": 0.0, "height": 0.0}

        tooth_index = (fdi // 10 - 1) * 8 + fdi % 10
        best_instance = None
        best_score = 0.0
        for instance in instances:
            if str(instance.category_name).upper() != finding_code:
                continue
            masked_probability = instance.mask_array(probability)
            if masked_probability.size == 0 or tooth_index >= len(masked_probability):
                continue
            mean_probability = masked_probability.mean(axis=-1)
            total = float(mean_probability[1:].sum())
            if total <= 0 or not math.isfinite(total):
                continue
            tooth_share = float(mean_probability[tooth_index] / total)
            if tooth_share <= 0.5 or not math.isfinite(tooth_share):
                continue
            score = float(instance.score) * tooth_share
            if score > best_score:
                best_instance, best_score = instance, score

        if best_instance is None:
            return {"x": 0.0, "y": 0.0, "width": 0.0, "height": 0.0}
        return LocalPanoramicModel._percent_bbox(
            best_instance.bbox_xyxy, width, height
        )

    @staticmethod
    def _find_missing_tooth_bbox(
        instances: list[Any],
        semantic_prediction: Any,
        fdi: int,
        width: int,
        height: int,
    ) -> dict[str, float]:
        empty = {"x": 0.0, "y": 0.0, "width": 0.0, "height": 0.0}
        tooth_index = (fdi // 10 - 1) * 8 + fdi % 10
        probability = getattr(semantic_prediction, "prob", None)
        if (
            probability is not None
            and getattr(probability, "ndim", 0) == 3
            and tooth_index < len(probability)
        ):
            mask = (probability.argmax(axis=0) == tooth_index) & (
                probability[tooth_index] >= 0.6
            )
            ys, xs = mask.nonzero()
            if len(xs) >= max(64, width * height * 0.0005):
                x1, x2 = int(xs.min()), int(xs.max()) + 1
                y1, y2 = int(ys.min()), int(ys.max()) + 1
                area = (x2 - x1) * (y2 - y1)
                if (
                    x2 - x1 <= width * 0.25
                    and y2 - y1 <= height * 0.35
                    and len(xs) / area >= 0.2
                ):
                    return LocalPanoramicModel._percent_bbox(
                        (x1, y1, x2, y2), width, height
                    )

        if not 2 <= fdi % 10 <= 7:
            return empty
        trusted_teeth = [
            instance for instance in instances if float(instance.score) >= 0.25
        ]
        adjacent = [
            LocalPanoramicModel._find_tooth_bbox(trusted_teeth, neighbor, width, height)
            for neighbor in (fdi - 1, fdi + 1)
        ]
        if any(box["width"] <= 0 for box in adjacent):
            return empty
        left, right = sorted(adjacent, key=lambda box: box["x"])
        gap_start = left["x"] + left["width"]
        gap_width = right["x"] - gap_start
        if not 0.4 * min(left["width"], right["width"]) <= gap_width <= 2.5 * max(
            left["width"], right["width"]
        ):
            return empty
        top = (left["y"] + right["y"]) / 2
        bottom = (
            left["y"] + left["height"] + right["y"] + right["height"]
        ) / 2
        return {
            "x": round(gap_start, 2),
            "y": round(top, 2),
            "width": round(gap_width, 2),
            "height": round(bottom - top, 2),
        }

    @staticmethod
    def _percent_bbox(
        bbox_xyxy: Any, width: int, height: int
    ) -> dict[str, float]:
        x1, y1, x2, y2 = (float(value) for value in bbox_xyxy)
        return {
            "x": round(x1 / width * 100, 2),
            "y": round(y1 / height * 100, 2),
            "width": round((x2 - x1) / width * 100, 2),
            "height": round((y2 - y1) / height * 100, 2),
        }


local_panoramic_model = LocalPanoramicModel()
