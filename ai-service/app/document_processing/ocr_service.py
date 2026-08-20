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
        """Initialize PaddleOCR 3.x engine instance in a thread-safe manner."""
        if self._ocr_engine is None:
            with self._lock:
                if self._ocr_engine is None:
                    if PaddleOCR is None:
                        logger.warning(
                            "PaddleOCR package is not installed. OCR running in fallback mode."
                        )
                        return

                    t0 = time.time()
                    try:
                        logger.info(
                            "Initializing PaddleOCR 3.x (lang=%s, use_gpu=%s)...",
                            self.lang,
                            self.use_gpu,
                        )

                        self._ocr_engine = PaddleOCR(
                            lang=self.lang,
                            use_doc_orientation_classify=False,
                            use_doc_unwarping=False,
                            use_textline_orientation=False,
                        )

                        elapsed_ms = (time.time() - t0) * 1000
                        logger.info(
                            "PaddleOCR engine loaded successfully in %.2f ms.",
                            elapsed_ms,
                        )
                    except Exception as err:
                        logger.error(
                            "Failed to initialize PaddleOCR engine: %s",
                            str(err),
                            exc_info=True,
                        )
                        self._ocr_engine = None
                        raise ProcessingException(
                            f"PaddleOCR model initialization failed: {str(err)}"
                        ) from err

    def extract_ocr(self, image_np: np.ndarray) -> List[OCRRegion]:
        """Perform OCR using the PaddleOCR 3.x predict API."""
        self._ensure_engine_loaded()

        if self._ocr_engine is None:
            logger.warning(
                "PaddleOCR engine is uninitialized. Returning empty OCR list."
            )
            return []

        start_time = time.time()

        try:
            with self._lock:
                results = self._ocr_engine.predict(
                    image_np,
                    use_doc_orientation_classify=False,
                    use_doc_unwarping=False,
                    use_textline_orientation=False,
                )

                ocr_regions: List[OCRRegion] = []

                for result in results:
                    if result is None:
                        continue

                    if isinstance(result, list):
                        for item in result:
                            if isinstance(item, (list, tuple)) and len(item) == 2:
                                poly, text_score = item
                                if isinstance(text_score, (list, tuple)) and len(text_score) == 2:
                                    txt, score = text_score
                                    ocr_regions.append(
                                        OCRRegion(
                                            text=str(txt).strip(),
                                            bbox=poly if isinstance(poly, list) else [],
                                            confidence=round(float(score), 4),
                                        )
                                    )
                        continue

                    data = getattr(result, "json", None)
                    if callable(data):
                        data = data()
                    elif data is None and isinstance(result, dict):
                        data = result

                    if not data:
                        continue

                    res = data.get("res", data)

                    texts = res.get("rec_texts", [])
                    scores = res.get("rec_scores", [])
                    boxes = res.get("rec_polys", res.get("dt_polys", []))

                    for i, text_value in enumerate(texts):
                        if not text_value:
                            continue

                        score = float(scores[i]) if i < len(scores) else 0.0

                        bbox = boxes[i] if i < len(boxes) else []
                        if hasattr(bbox, "tolist"):
                            bbox = bbox.tolist()

                        ocr_regions.append(
                            OCRRegion(
                                text=str(text_value).strip(),
                                bbox=bbox if isinstance(bbox, list) else [],
                                confidence=round(score, 4),
                            )
                        )

            elapsed_ms = (time.time() - start_time) * 1000
            logger.info(
                "PaddleOCR 3.x inference successfully recognized %d regions in %.2f ms.",
                len(ocr_regions),
                elapsed_ms,
            )
            return ocr_regions

        except Exception as err:
            elapsed_ms = (time.time() - start_time) * 1000
            logger.error(
                "PaddleOCR inference exception after %.2f ms: %s",
                elapsed_ms,
                str(err),
                exc_info=True,
            )
            raise ProcessingException(
                f"PaddleOCR inference failed: {str(err)}"
            ) from err