from __future__ import annotations

import hashlib
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import download_models


class DownloadModelsTest(unittest.TestCase):
    def test_existing_valid_model_is_not_downloaded(self) -> None:
        content = b"valid model"
        model = download_models.ModelFile(
            Path("yolo/model.pt"), hashlib.sha256(content).hexdigest()
        )

        with tempfile.TemporaryDirectory() as directory:
            model_directory = Path(directory)
            destination = model_directory / model.relative_path
            destination.parent.mkdir(parents=True)
            destination.write_bytes(content)

            with (
                patch.object(download_models, "MODEL_DIRECTORY", model_directory),
                patch.object(download_models, "download_file") as download_file,
            ):
                download_models.ensure_model(model)

            download_file.assert_not_called()

    def test_invalid_model_is_downloaded_again(self) -> None:
        model = download_models.ModelFile(Path("deeplab/model.pth"), "expected")

        with tempfile.TemporaryDirectory() as directory:
            model_directory = Path(directory)
            destination = model_directory / model.relative_path
            destination.parent.mkdir(parents=True)
            destination.write_bytes(b"invalid")

            with (
                patch.object(download_models, "MODEL_DIRECTORY", model_directory),
                patch.object(download_models, "download_file") as download_file,
            ):
                download_models.ensure_model(model)

            download_file.assert_called_once_with(model, destination)


if __name__ == "__main__":
    unittest.main()
