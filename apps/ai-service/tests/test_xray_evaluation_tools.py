import contextlib
import csv
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

SERVICE = Path(__file__).resolve().parents[1]
ROOT = SERVICE.parents[1]
spec = importlib.util.spec_from_file_location("xray_evaluation_export", SERVICE / "scripts/export_xray_evaluation.py")
exporter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(exporter)
notebook = json.loads((ROOT / "docs/Test_AI_Xquang.ipynb").read_text(encoding="utf-8"))
code_cells = ["".join(cell["source"]) for cell in notebook["cells"] if cell["cell_type"] == "code"]
namespace = {}
with contextlib.redirect_stdout(io.StringIO()):
    exec(code_cells[0], namespace)
    exec(code_cells[1], namespace)
evaluate = namespace["evaluate"]


class XrayEvaluationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="sds-evaluation-test-")
        self.addCleanup(self.temp.cleanup)
        self.folder = Path(self.temp.name)
        namespace["_COLAB_CACHE"].update({"evaluator": None, "catalog_json": {}, "image_preds": {}})

    def fixtures(self, *, empty_predictions=False, error=False, incomplete=False):
        references = [
            {"ten_anh": "a.png", "rang_co_phat_hien": "46", "da_kiem_tra": "0" if incomplete else "1"},
            {"ten_anh": "b.png", "rang_co_phat_hien": "35", "da_kiem_tra": "1"},
            {"ten_anh": "healthy.png", "rang_co_phat_hien": "", "da_kiem_tra": "1"},
        ]
        predictions = [
            {"image_id": "a.png", "fdi": "46", "finding_type": "Caries", "confidence": "0.9"},
            {"image_id": "a.png", "fdi": "46", "finding_type": "Caries", "confidence": "0.8"},
            {"image_id": "b.png", "fdi": "36", "finding_type": "Caries", "confidence": "0.9"},
            {"image_id": "healthy.png", "fdi": "26", "finding_type": "Caries", "confidence": "0.9"},
            {"image_id": "a.png", "fdi": "47", "finding_type": "Implant", "confidence": "0.9"},
        ]
        statuses = [{"image_id": row["ten_anh"], "status": "ERROR" if error else "OK", "error": ""} for row in references]
        exporter.write_csv(self.folder / "reference.csv", list(references[0]), references)
        exporter.write_csv(self.folder / "predictions.csv", list(predictions[0]), [] if empty_predictions else predictions)
        exporter.write_csv(self.folder / "inference_status.csv", list(statuses[0]), statuses)
        metadata = {"finding_type": "Caries", "images": {row["ten_anh"]: "test-hash" for row in references},
                    "confidence_threshold": 0.5, "inference_errors": int(error)}
        for name, key in [("reference.csv", "reference_sha256"), ("predictions.csv", "predictions_sha256"), ("inference_status.csv", "status_sha256")]:
            metadata[key] = hashlib.sha256((self.folder / name).read_bytes()).hexdigest()
        (self.folder / "run_metadata.json").write_text(json.dumps(metadata), encoding="utf-8")

    def test_preparation_creates_unreviewed_sheet_and_preserves_existing_reference(self):
        images = self.folder / "images"
        images.mkdir()
        (images / "a.png").write_bytes(b"fixture; image is not decoded during preparation")
        output = self.folder / "output"
        with contextlib.redirect_stdout(io.StringIO()):
            exporter.prepare(images, output, "Caries")
        reference = output / "reference.csv"
        self.assertEqual(exporter.read_csv(reference)[0]["da_kiem_tra"], "0")
        original = reference.read_bytes()
        with self.assertRaises(ValueError):
            exporter.prepare(images, output, "Caries")
        self.assertEqual(reference.read_bytes(), original)

    def test_wrong_tooth_healthy_false_positive_duplicates_and_other_classes(self):
        self.fixtures()
        metrics, rows, _ = evaluate(self.folder)
        self.assertEqual((metrics["TP"], metrics["FP"], metrics["FN"]), (1, 2, 1))
        self.assertAlmostEqual(metrics["precision"], 1 / 3)
        self.assertAlmostEqual(metrics["recall"], 0.5)
        self.assertAlmostEqual(metrics["f1"], 0.4)
        self.assertEqual(len(rows), 3)

    def test_exported_files_can_be_evaluated_by_the_notebook(self):
        from PIL import Image

        images = self.folder / "images"
        images.mkdir()
        Image.new("RGB", (16, 16)).save(images / "a.png")
        output = self.folder / "output"
        with contextlib.redirect_stdout(io.StringIO()):
            exporter.prepare(images, output, "Caries")
        exporter.write_csv(output / "reference.csv", ["ten_anh", "rang_co_phat_hien", "da_kiem_tra"],
                           [{"ten_anh": "a.png", "rang_co_phat_hien": "46", "da_kiem_tra": "1"}])
        model = SimpleNamespace(confidence_threshold=0.5, analyze=lambda image: [
            SimpleNamespace(fdi_tooth_number=46, finding_type="Caries", confidence=0.91)])
        with patch.object(exporter, "LocalPanoramicModel", return_value=model), contextlib.redirect_stdout(io.StringIO()):
            self.assertTrue(exporter.predict(output))
        metrics, _, _ = evaluate(output)
        self.assertEqual((metrics["TP"], metrics["FP"], metrics["FN"]), (1, 0, 0))

    def test_empty_prediction_file_counts_missed_findings(self):
        self.fixtures(empty_predictions=True)
        metrics, _, _ = evaluate(self.folder)
        self.assertEqual((metrics["TP"], metrics["FP"], metrics["FN"]), (0, 0, 2))
        self.assertIsNone(metrics["precision"])
        self.assertEqual(metrics["recall"], 0)

    def test_incomplete_reference_is_rejected(self):
        self.fixtures(incomplete=True)
        with self.assertRaisesRegex(ValueError, "Bác sĩ chưa hoàn thành"):
            evaluate(self.folder)

    def test_inference_failures_cannot_silently_improve_metrics(self):
        self.fixtures(error=True)
        with self.assertRaisesRegex(ValueError, "Có ảnh suy luận lỗi"):
            evaluate(self.folder)

    def test_files_from_different_runs_are_rejected(self):
        self.fixtures()
        with (self.folder / "predictions.csv").open("a", encoding="utf-8") as stream:
            stream.write("a.png,47,Caries,0.95\n")
        with self.assertRaisesRegex(ValueError, "File đã thay đổi"):
            evaluate(self.folder)

    def test_cloud_colab_runner_produces_valid_evaluation_bundle(self):
        from PIL import Image

        buf = io.BytesIO()
        Image.new("RGB", (16, 16)).save(buf, format="PNG")
        png_bytes = buf.getvalue()
        fake_evaluator = SimpleNamespace(
            predict_image=lambda im: [{"fdi": 46, "finding_type": "Caries", "confidence": 0.92}]
        )
        with patch.dict(
            namespace,
            {
                "ensure_colab_packages": lambda: None,
                "fetch_dentex_catalog": lambda ft, mx: [("val_0.png", "https://example.test/val_0.png", [46])],
                "ColabPanoramicEvaluator": lambda confidence_threshold=0.5: fake_evaluator,
            },
        ), patch.object(
            namespace["urllib"].request,
            "urlopen",
            return_value=SimpleNamespace(read=lambda: png_bytes),
        ), contextlib.redirect_stdout(io.StringIO()):
            out_dir = namespace["run_cloud_dentex_evaluation"]("Caries", 1, 0.5)
        self.addCleanup(lambda: __import__("shutil").rmtree(out_dir, ignore_errors=True))
        metrics, _, meta = evaluate(out_dir)
        self.assertEqual((metrics["TP"], metrics["FP"], metrics["FN"]), (1, 0, 0))
        self.assertEqual(meta["total_tooth_evaluations"], 32)

    def test_cloud_colab_all_8_classes_mode_produces_8_class_summary(self):
        from PIL import Image

        buf = io.BytesIO()
        Image.new("RGB", (16, 16)).save(buf, format="PNG")
        png_bytes = buf.getvalue()
        fake_evaluator = SimpleNamespace(
            predict_image=lambda im, gt_boxes=None: (
                [{"fdi": 46, "finding_type": "Caries", "confidence": 0.85},
                 {"fdi": 36, "finding_type": "Filling", "confidence": 0.90}],
                {"Caries": [46], "Filling": [36]},
            ) if gt_boxes is not None else [{"fdi": 18, "finding_type": "Missing tooth", "confidence": 0.95}]
        )
        fake_records = [
            {"name": "pano_test_v1.jpg", "url": "https://example.test/v1.jpg", "kind": "boxes", "gt_boxes": [("Caries", 0.5, 0.5, 0.1, 0.1)], "gt_fdi": {}},
            {"name": "qe_train_0.png", "url": "https://example.test/t0.png", "kind": "fdi", "gt_boxes": [], "gt_fdi": {"Missing tooth": [18]}},
        ]
        namespace["_COLAB_CACHE"]["image_preds"].clear()
        with patch.dict(
            namespace,
            {
                "ensure_colab_packages": lambda: None,
                "fetch_multiclass_8_catalog": lambda mx: fake_records,
                "ColabPanoramicEvaluator": lambda confidence_threshold=0.5: fake_evaluator,
            },
        ), patch.object(
            namespace["urllib"].request,
            "urlopen",
            return_value=SimpleNamespace(read=lambda: png_bytes),
        ), contextlib.redirect_stdout(io.StringIO()):
            out_dir = namespace["run_cloud_dentex_evaluation"]("ALL", 2, 0.25)
        self.addCleanup(lambda: __import__("shutil").rmtree(out_dir, ignore_errors=True))
        metrics, _, meta = evaluate(out_dir)
        self.assertEqual(len(meta["multi_class_summary"]), 8)
        self.assertEqual(meta["overall_summary"]["TP"], 3)


if __name__ == "__main__":
    unittest.main()
