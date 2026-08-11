"""PaddleOCR service wrapper for English document text recognition."""

import os
from typing import List, Optional
import numpy as np

from app.core.logging import logger
from app.schemas.processed_document import OCRRegion

# Disable oneDNN / PIR optimization flags that cause C++ static graph issues on Windows CPU
os.environ["FLAGS_use_onednn"] = "0"
os.environ["FLAGS_enable_pir_api"] = "0"
os.environ["FLAGS_enable_pir_in_executor"] = "0"
os.environ["PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK"] = "True"

try:
    from paddleocr import PaddleOCR
except ImportError:
    PaddleOCR = None


class OCRService:
    """Singleton/reusable wrapper for PaddleOCR English text recognition."""

    _instance: Optional["OCRService"] = None

    def __init__(self, use_gpu: bool = False, lang: str = "en"):
        self.use_gpu = use_gpu
        self.lang = lang
        self._ocr_engine = None

    @classmethod
    def get_instance(cls, use_gpu: bool = False, lang: str = "en") -> "OCRService":
        """Get or create singleton instance."""
        if cls._instance is None:
            cls._instance = cls(use_gpu=use_gpu, lang=lang)
        return cls._instance

    def _ensure_engine_loaded(self) -> None:
        """Lazily initialize PaddleOCR engine instance."""
        if self._ocr_engine is None:
            if PaddleOCR is None:
                logger.warning("PaddleOCR package is not installed. OCR will run in fallback mode.")
                return

            try:
                logger.info("Initializing PaddleOCR (lang=%s)...", self.lang)
                try:
                    self._ocr_engine = PaddleOCR(lang=self.lang)
                except TypeError:
                    self._ocr_engine = PaddleOCR(use_angle_cls=True, lang=self.lang)
                logger.info("PaddleOCR engine loaded successfully.")
            except Exception as err:
                logger.warning("Failed to initialize PaddleOCR engine: %s (Running OCR in fallback mode)", str(err))
                self._ocr_engine = None

    def extract_ocr(self, image_np: np.ndarray) -> List[OCRRegion]:
        """Perform text recognition on preprocessed image numpy array."""
        self._ensure_engine_loaded()

        if self._ocr_engine is None:
            # Fallback when PaddleOCR is uninstalled, mocked, or encounters init error
            return []

        try:
            try:
                results = self._ocr_engine.ocr(image_np, cls=True)
            except (TypeError, Exception):
                results = self._ocr_engine.ocr(image_np)

            ocr_regions: List[OCRRegion] = []

            if not results or not results[0]:
                return ocr_regions

            page_result = results[0]
            for item in page_result:
                if not item:
                    continue

                if isinstance(item, (list, tuple)) and len(item) >= 2:
                    bbox_pts, (text, score) = item[0], item[1]
                    clean_bbox = [[float(pt[0]), float(pt[1])] for pt in bbox_pts]
                    ocr_regions.append(
                        OCRRegion(
                            text=str(text).strip(),
                            bbox=clean_bbox,
                            confidence=round(float(score), 4),
                        )
                    )
                elif isinstance(item, dict):
                    text = item.get("text", item.get("rec_text", ""))
                    score = item.get("score", item.get("rec_score", 0.0))
                    bbox = item.get("bbox", item.get("dt_polys", []))
                    if text:
                        ocr_regions.append(
                            OCRRegion(
                                text=str(text).strip(),
                                bbox=bbox if isinstance(bbox, list) else [],
                                confidence=round(float(score), 4),
                            )
                        )

            return ocr_regions

        except Exception as err:
            logger.warning("PaddleOCR inference exception on current platform: %s (Returning empty OCR result)", str(err))
            return []
