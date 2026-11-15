"""Exercise mask geometry without importing Detectron2 or loading model weights."""
import ast
import dataclasses
from enum import Enum
from pathlib import Path
import re
import sys
from types import ModuleType, SimpleNamespace
from typing import Any, Literal, TypeAlias
import unittest
from unittest.mock import patch

import numpy as np


SOURCE = Path(__file__).resolve().parents[1] / "dental-pano-ai/main.py"
module = ModuleType("panoramic_mask_memory_test_model")
sys.modules[module.__name__] = module
module.__dict__.update({
    "dataclasses": dataclasses, "Enum": Enum, "np": np, "re": re,
    "Any": Any, "Literal": Literal, "TypeAlias": TypeAlias,
    "IntersectionMetric": str, "Results": SimpleNamespace,
    "Detectron2Instances": SimpleNamespace,
    "SegmentationPredictor": object,
})
classes = {
    "SemanticSegmentationPrediction", "InstanceDetectionPredictionInstance",
    "InstanceDetectionPrediction", "MemoryBoundSegmentationPredictor",
    "FindingType", "FindingEntry", "PostProcessingModule",
}
tree = ast.parse(SOURCE.read_text(encoding="utf-8"))
tree.body = [node for node in tree.body if isinstance(node, ast.ClassDef) and node.name in classes]
exec(compile(tree, str(SOURCE), "exec"), module.__dict__)


class PanoramicMaskMemoryTest(unittest.TestCase):
    def setUp(self):
        self.rng = np.random.default_rng(31)
        self.shape = (30, 50)

    def pair(self, box, category="TOOTH_11", score=0.9):
        x1, y1, x2, y2 = box
        mask = np.zeros(self.shape, dtype=bool)
        mask[y1:y2 + 1, x1:x2 + 1] = self.rng.random(mask[y1:y2 + 1, x1:x2 + 1].shape) > 0.2
        fields = dict(score=score, category_id=1, category_name=category, bbox_xyxy=np.array(box))
        full = module.InstanceDetectionPredictionInstance(mask=mask, **fields)
        compact = module.InstanceDetectionPredictionInstance(
            mask=mask[y1:y2 + 1, x1:x2 + 1].copy(), image_shape=self.shape, **fields,
        )
        return full, compact

    def test_crop_preserves_regions_areas_and_reconstruction(self):
        full, compact = self.pair((5, 7, 12, 17))
        probability = self.rng.random((33, *self.shape)).astype(np.float32)
        np.testing.assert_array_equal(full.mask_array(probability), compact.mask_array(probability))
        np.testing.assert_array_equal(full.full_mask(), compact.full_mask())
        self.assertEqual(full.mask_area, compact.mask_area)
        self.assertLess(compact.mask.nbytes, full.mask.nbytes / 10)

    def test_overlap_and_nms_match_full_masks(self):
        pairs = [self.pair(box, score=score) for box, score in [
            ((5, 5, 16, 20), 0.9), ((8, 9, 18, 22), 0.8),
            ((28, 3, 39, 15), 0.7), ((45, 25, 50, 30), 0.6),
        ]]
        for a, ca in pairs:
            for b, cb in pairs:
                for metric in ("intersection_over_union", "intersection_over_minimum"):
                    self.assertAlmostEqual(a.intersect(b, metric), ca.intersect(cb, metric))
        full = module.InstanceDetectionPrediction(category_id_to_name={}, instances=[p[0] for p in pairs])
        compact = module.InstanceDetectionPrediction(category_id_to_name={}, instances=[p[1] for p in pairs])
        self.assertEqual(
            [p.score for p in full.non_maximum_suppression(0.3, "intersection_over_minimum").instances],
            [p.score for p in compact.non_maximum_suppression(0.3, "intersection_over_minimum").instances],
        )

    def test_discount_and_findings_match_original_full_mask_formula(self):
        pairs = [self.pair((4, 5, 16, 22)), self.pair((9, 10, 22, 27)),
                 self.pair((7, 8, 11, 15), "CARIES", 0.85)]
        probability = self.rng.random((33, *self.shape)).astype(np.float32)
        probability /= probability.sum(axis=0, keepdims=True)
        semantic = module.SemanticSegmentationPrediction(prob=probability)
        compact = module.InstanceDetectionPrediction(category_id_to_name={}, instances=[p[1] for p in pairs])
        actual = module.PostProcessingModule()(semantic, compact)

        # Independent reference: the original full-resolution mask reduction.
        expected = []
        for finding in module.FindingType:
            candidates = module.InstanceDetectionPrediction(category_id_to_name={}, instances=[p[0] for p in pairs])
            if finding == module.FindingType.MISSING:
                instances = candidates.filter_by_category("^TOOTH").non_maximum_suppression(0.3, "intersection_over_minimum").filter_by_area().instances
            else:
                instances = candidates.filter_by_category(f"^{finding.value}$").filter_by_area().instances
            scores = []
            if instances:
                discount = np.sum([p.mask for p in instances], axis=0).astype(np.float32)
                for instance in instances:
                    masked = 1 - np.power(1 - instance.mask_array(probability), 1 / instance.mask_array(discount))
                    share = masked.mean(axis=-1)
                    share = np.r_[0, share[1:]] / share[1:].sum()
                    scores.append(share if finding == module.FindingType.MISSING else instance.score * share)
            score = 1 - np.prod(1 - np.stack(scores), axis=0) if scores else np.zeros(33, dtype=np.float32)
            if finding == module.FindingType.MISSING:
                score = 1 - score
            expected.extend(score[1:])
        np.testing.assert_allclose([p.score for p in actual], expected, rtol=1e-6, atol=1e-7)

    def test_streaming_projection_matches_native_masks_and_bounds_batch_size(self):
        try:
            import torch
            from ultralytics.engine.results import Results
            from ultralytics.utils.ops import process_mask_native, scale_boxes
        except ImportError:
            self.skipTest("Full vision runtime is required for projection equivalence")
        torch.manual_seed(7)
        image = np.zeros((100, 120, 3), dtype=np.uint8)
        network_image = torch.zeros(1, 3, 64, 64)
        detections = torch.rand(11, 14)
        detections[:, :4] = torch.tensor([5, 8, 40, 48])
        detections[:, 5] = 0
        prototype = torch.randn(8, 16, 16)
        expected_boxes = scale_boxes((64, 64), detections[:, :4].clone(), image.shape)
        expected = process_mask_native(prototype, detections[:, 6:], expected_boxes, image.shape[:2]).numpy().astype(bool)
        predictor = module.MemoryBoundSegmentationPredictor()
        predictor.model = SimpleNamespace(names={0: "TOOTH_11"})
        batches = []

        def project(proto, masks, boxes, shape):
            batches.append(len(masks))
            return process_mask_native(proto, masks, boxes, shape)

        with patch.dict(module.__dict__, Results=Results, scale_boxes=scale_boxes, process_mask_native=project):
            result = predictor.construct_result(detections.clone(), network_image, image, "test.jpg", prototype)
            converted = module.InstanceDetectionPrediction.from_ultralytics_results(result)
        self.assertEqual(batches, [4, 4, 3])
        self.assertEqual(len(converted.instances), 11)
        for actual, mask in zip(converted.instances, expected):
            np.testing.assert_array_equal(actual.full_mask(), mask)


if __name__ == "__main__":
    unittest.main()
