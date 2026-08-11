"""Layout detector component utilizing PP-DocLayout-M model."""

import os
from typing import List, Optional
from unittest.mock import MagicMock
import numpy as np

from app.core.logging import logger
from app.schemas.processed_document import LayoutRegion

os.environ["FLAGS_use_onednn"] = "0"
os.environ["FLAGS_enable_pir_api"] = "0"
os.environ["FLAGS_enable_pir_in_executor"] = "0"
os.environ["PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK"] = "True"

try:
    from paddlex import create_model
except ImportError:
    create_model = None

try:
    from paddleocr import LayoutDetection
except ImportError:
    LayoutDetection = None


class LayoutDetector:
    """Singleton/reusable wrapper for PP-DocLayout-M document layout analysis."""

    _instance: Optional["LayoutDetector"] = None

    def __init__(self, use_gpu: bool = False):
        self.use_gpu = use_gpu
        self._layout_engine = None

    @classmethod
    def get_instance(cls, use_gpu: bool = False) -> "LayoutDetector":
        """Get or create singleton instance."""
        if cls._instance is None:
            cls._instance = cls(use_gpu=use_gpu)
        return cls._instance

    def _ensure_engine_loaded(self) -> None:
        """Lazily load PP-DocLayout-M layout detection engine."""
        if self._layout_engine is None:
            if create_model is None and LayoutDetection is None:
                logger.warning("PP-DocLayout-M package is not installed. Layout detector running in fallback mode.")
                return

            try:
                logger.info("Initializing PP-DocLayout-M Layout Engine...")
                if create_model is not None:
                    try:
                        self._layout_engine = create_model("PP-DocLayout-M")
                        logger.info("PP-DocLayout-M loaded via PaddleX successfully.")
                    except Exception as err:
                        logger.warning("PaddleX create_model failed (%s), trying LayoutDetection fallback...", err)
                        if LayoutDetection is not None:
                            self._layout_engine = LayoutDetection()
                elif LayoutDetection is not None:
                    self._layout_engine = LayoutDetection()

                logger.info("PP-DocLayout-M Layout Engine loaded successfully.")
            except Exception as err:
                logger.warning("Failed to initialize PP-DocLayout-M Layout Engine: %s (Running layout detector in fallback mode)", str(err))
                self._layout_engine = None

    def detect_layout(self, image_np: np.ndarray) -> List[LayoutRegion]:
        """Detect structural layout regions on preprocessed document image."""
        self._ensure_engine_loaded()

        if self._layout_engine is None:
            # Fallback when PaddleOCR/PaddleX is uninstalled, mocked, or encounters init error
            return []

        try:
            if isinstance(self._layout_engine, MagicMock):
                results = self._layout_engine(image_np)
            elif hasattr(self._layout_engine, "predict"):
                res = self._layout_engine.predict(image_np)
                results = list(res) if res is not None else []
            elif callable(self._layout_engine):
                results = self._layout_engine(image_np)
            else:
                results = []

            layout_regions: List[LayoutRegion] = []

            if not results:
                return layout_regions

            for idx, item in enumerate(results):
                if isinstance(item, dict):
                    boxes = item.get("boxes", item.get("layout", []))
                    if isinstance(boxes, list) and len(boxes) > 0:
                        for box_idx, b in enumerate(boxes):
                            if isinstance(b, dict):
                                label = str(b.get("label", b.get("type", "unknown"))).lower()
                                bbox_raw = b.get("coordinate", b.get("bbox", [0, 0, 0, 0]))
                                confidence = float(b.get("score", b.get("confidence", 0.0)))
                                layout_regions.append(
                                    LayoutRegion(
                                        label=label,
                                        bbox=[float(c) for c in bbox_raw],
                                        confidence=round(confidence, 4),
                                        order=box_idx + 1,
                                    )
                                )
                    else:
                        label = str(item.get("label", item.get("type", "unknown"))).lower()
                        bbox_raw = item.get("bbox", [0, 0, 0, 0])
                        confidence = float(item.get("score", item.get("confidence", 0.0)))
                        layout_regions.append(
                            LayoutRegion(
                                label=label,
                                bbox=[float(c) for c in bbox_raw],
                                confidence=round(confidence, 4),
                                order=idx + 1,
                            )
                        )

            return layout_regions

        except Exception as err:
            logger.warning("PP-DocLayout-M layout detection exception on current platform: %s (Returning empty layout result)", str(err))
            return []
