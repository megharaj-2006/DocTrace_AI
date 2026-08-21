"""Unit tests for OCRService and LayoutDetector components."""

import numpy as np
from unittest.mock import MagicMock
from app.document_processing.layout_detector import LayoutDetector
from app.document_processing.ocr_service import OCRService


def test_ocr_service_mock_inference():
    """Verify OCRService processes and structures PaddleOCR engine outputs."""
    ocr_srv = OCRService(use_gpu=False)

    # Mock PaddleOCR engine output
    mock_engine = MagicMock()
    mock_result = MagicMock()
    mock_result.json.return_value = {
        "res": {
            "rec_texts": ["PATIENT NAME", "JOHN DOE"],
            "rec_scores": [0.96, 0.99],
            "rec_polys": [
                [[10, 10], [50, 10], [50, 30], [10, 30]],
                [[10, 40], [100, 40], [100, 60], [10, 60]],
            ],
        }
    }
    mock_engine.predict.return_value = [mock_result]
    ocr_srv._ocr_engine = mock_engine

    img_dummy = np.zeros((100, 100, 3), dtype=np.uint8)
    regions = ocr_srv.extract_ocr(img_dummy)

    assert len(regions) == 2
    assert regions[0].text == "PATIENT NAME"
    assert regions[0].confidence == 0.96
    assert regions[1].text == "JOHN DOE"


def test_layout_detector_mock_inference():
    """Verify LayoutDetector processes and structures PP-DocLayout-M engine outputs."""
    layout_det = LayoutDetector(use_gpu=False)

    # Mock PPStructure layout engine output
    mock_engine = MagicMock()
    mock_engine.return_value = [
        {"type": "header", "bbox": [10, 10, 500, 100], "score": 0.94},
        {"type": "table", "bbox": [10, 150, 500, 600], "score": 0.91},
    ]
    layout_det._layout_engine = mock_engine

    img_dummy = np.zeros((100, 100, 3), dtype=np.uint8)
    regions = layout_det.detect_layout(img_dummy)

    assert len(regions) == 2
    assert regions[0].label == "header"
    assert regions[0].confidence == 0.94
    assert regions[1].label == "table"
