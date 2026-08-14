"""PaddleOCR service wrapper for English document text recognition."""

import os
import threading
import time
from typing import List, Optional
import numpy as np

from app.core.exceptions import ProcessingException
from app.core.logging import logger
from app.schemas.processed_document import OCRRegion

# Disable oneDNN / PIR optimization flags that cause C++ static graph issues on CPU
os.environ["FLAGS_use_mkldnn"] = "0"
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
    _lock: threading.Lock = threading.Lock()

    def __init__(self, use_gpu: bool = False, lang: str = "en"):
        self.use_gpu = use_gpu
        self.lang = lang
        self._ocr_engine = None

    @classmethod
    def get_instance(cls, use_gpu: bool = False, lang: str = "en") -> "OCRService":
        """Get or create singleton instance with thread lock."""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls(use_gpu=use_gpu, lang=lang)
        return cls._instance

    def _ensure_engine_loaded(self) -> None:
        """Initialize PaddleOCR engine instance in a thread-safe manner."""
        if self._ocr_engine is None:
            with self._lock:
                if self._ocr_engine is None:
                    if PaddleOCR is None:
                        logger.warning("PaddleOCR package is not installed. OCR running in fallback mode.")
                        return

                    t0 = time.time()
                    try:
                        logger.info("Initializing PaddleOCR (lang=%s, use_gpu=%s, enable_mkldnn=False)...", self.lang, self.use_gpu)
                        try:
                            self._ocr_engine = PaddleOCR(
                                lang=self.lang,
                                enable_mkldnn=False,
                            )
                        except TypeError:
                            self._ocr_engine = PaddleOCR(
                                use_angle_cls=True,
                                lang=self.lang,
                                enable_mkldnn=False,
                            )
                        elapsed_ms = (time.time() - t0) * 1000
                        logger.info("PaddleOCR engine loaded successfully in %.2f ms.", elapsed_ms)
                    except Exception as err:
                        logger.error("Failed to initialize PaddleOCR engine: %s", str(err), exc_info=True)
                        self._ocr_engine = None
                        raise ProcessingException(f"PaddleOCR model initialization failed: {str(err)}") from err

    def extract_ocr(self, image_np: np.ndarray) -> List[OCRRegion]:
        """Perform text recognition on preprocessed image numpy array with performance telemetry."""
        self._ensure_engine_loaded()

        if self._ocr_engine is None:
            logger.warning("PaddleOCR engine is uninitialized. Returning empty OCR list.")
            return []

        with self._lock:
            start_time = time.time()
            try:
                try:
                    results = self._ocr_engine.ocr(image_np, cls=True)
                except (TypeError, Exception) as sub_err:
                    logger.debug("PaddleOCR default call failed (%s), retrying without cls...", sub_err)
                    results = self._ocr_engine.ocr(image_np)

                ocr_regions: List[OCRRegion] = []

                if not results or not results[0]:
                    elapsed_ms = (time.time() - start_time) * 1000
                    logger.info("PaddleOCR inference completed in %.2f ms (legitimate 0 text regions found).", elapsed_ms)
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

                elapsed_ms = (time.time() - start_time) * 1000
                logger.info("PaddleOCR inference successfully recognized %d regions in %.2f ms.", len(ocr_regions), elapsed_ms)
                return ocr_regions

            except Exception as err:
                elapsed_ms = (time.time() - start_time) * 1000
                logger.error(
                    "PaddleOCR inference exception after %.2f ms: %s",
                    elapsed_ms,
                    str(err),
                    exc_info=True,
                )
                raise ProcessingException(f"PaddleOCR inference failed: {str(err)}") from err

