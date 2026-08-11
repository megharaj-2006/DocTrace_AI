"""DocumentProcessor orchestrator binding validation, loading, preprocessing, OCR, and layout detection."""

import time
from typing import List, Optional
from app.core.logging import logger
from app.document_processing.document_loader import DocumentLoader
from app.document_processing.file_validator import FileValidator
from app.document_processing.layout_detector import LayoutDetector
from app.document_processing.ocr_service import OCRService
from app.document_processing.preprocessor import Preprocessor
from app.schemas.processed_document import PageData, ProcessedDocument


from typing import Callable, List, Optional


class DocumentProcessor:
    """Orchestrates document intelligence pipeline execution and cleanup."""

    def __init__(
        self,
        file_validator: Optional[FileValidator] = None,
        document_loader: Optional[DocumentLoader] = None,
        preprocessor: Optional[Preprocessor] = None,
        ocr_service: Optional[OCRService] = None,
        layout_detector: Optional[LayoutDetector] = None,
    ):
        self.file_validator = file_validator or FileValidator()
        self.document_loader = document_loader or DocumentLoader()
        self.preprocessor = preprocessor or Preprocessor()
        self.ocr_service = ocr_service or OCRService.get_instance()
        self.layout_detector = layout_detector or LayoutDetector.get_instance()

    def process(
        self,
        file_path: str,
        document_id: str,
        page_callback: Optional[Callable[[int, str], None]] = None,
    ) -> ProcessedDocument:
        """Run complete document intelligence pipeline on target file path.

        Guarantees cleanup of intermediate temporary page images.
        """
        start_time = time.time()
        logger.info("Starting DocumentProcessor pipeline for documentId='%s'", document_id)

        # 1. Validate file format and size
        ext = self.file_validator.validate_file(file_path)

        created_temp_files: List[str] = []
        pages_data: List[PageData] = []

        try:
            # 2. Render/load document pages into temporary page images
            page_entries, created_temp_files = self.document_loader.load_document_pages(file_path)

            for page_num, temp_img_path in page_entries:
                logger.info(
                    "Processing page %d/%d for documentId='%s'",
                    page_num,
                    len(page_entries),
                    document_id,
                )

                if page_callback is not None:
                    try:
                        page_callback(page_num, temp_img_path)
                    except Exception as cb_err:
                        logger.error("Error in page_callback for page %d: %s", page_num, str(cb_err), exc_info=True)
                        raise

                # 3. Conservative Image Preprocessing

                img_np, (orig_w, orig_h) = self.preprocessor.preprocess_image(temp_img_path)

                # 4. PP-DocLayout-M Layout Detection
                layout_regions = self.layout_detector.detect_layout(img_np)
                logger.debug("Page %d: Detected %d layout regions", page_num, len(layout_regions))

                # 5. PaddleOCR Text Recognition
                ocr_regions = self.ocr_service.extract_ocr(img_np)
                logger.debug("Page %d: Recognized %d OCR text regions", page_num, len(ocr_regions))

                # Concatenate page text for summary lookup
                page_text = " ".join(reg.text for reg in ocr_regions if reg.text)

                # 6. Assemble PageData
                page_data = PageData(
                    page_number=page_num,
                    width=orig_w,
                    height=orig_h,
                    text=page_text,
                    ocr_regions=ocr_regions,
                    layout_regions=layout_regions,
                )
                pages_data.append(page_data)

            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            logger.info(
                "DocumentProcessor completed for documentId='%s' (%d pages) in %.2f ms",
                document_id,
                len(pages_data),
                elapsed_ms,
            )

            # 7. Assemble ProcessedDocument
            processed_doc = ProcessedDocument(
                document_id=document_id,
                pages=pages_data,
                metadata={
                    "format": ext,
                    "total_pages": len(pages_data),
                    "processing_time_ms": elapsed_ms,
                },
            )
            return processed_doc

        finally:
            # 8. Guaranteed Intermediate Page Artifact Cleanup
            self.document_loader.cleanup_temp_files(created_temp_files)
