import asyncio
import os
import shutil
import tempfile
import time
from typing import Any, Dict, List, Optional
from fastapi import UploadFile

from app.core.config import settings
from app.core.exceptions import InvalidInputException, ProcessingException
from app.core.logging import logger
from app.document_processing.document_classifier import DocumentClassifier
from app.document_processing.processor import DocumentProcessor
from app.schemas.analysis import AnalysisResponse, MatchedDocument
from app.schemas.document_understanding import DocumentClassification, DocumentType, RelevanceStatus
from app.schemas.report import AnalysisReport
from app.schemas.similarity import PageSimilarityMatch
from app.services.fingerprint_service import FingerprintService, StructuralFingerprintService
from app.services.risk_signal_service import RiskSignalService
from app.services.template_extraction_service import TemplateExtractionService
from app.services.vector_intelligence_service import VectorIntelligenceService
from app.vector_store.base import VectorStore
from app.vector_store.mock import MockVectorStore
from app.vector_store.qdrant import QdrantVectorStore


class AnalysisService:
    """Orchestrates complete multi-signal document analysis pipeline and relevance gating."""

    def __init__(
        self,
        vector_store: Optional[VectorStore] = None,
        document_processor: Optional[DocumentProcessor] = None,
        vector_intelligence_service: Optional[VectorIntelligenceService] = None,
        document_classifier: Optional[DocumentClassifier] = None,
        template_extraction_service: Optional[TemplateExtractionService] = None,
        risk_signal_service: Optional[RiskSignalService] = None,
    ):
        self.vector_store = vector_store or self._create_vector_store()
        self.document_processor = document_processor or DocumentProcessor()
        self.vector_intelligence_service = vector_intelligence_service or VectorIntelligenceService(
            vector_store=self.vector_store
        )
        self.document_classifier = document_classifier or DocumentClassifier()
        self.template_extraction_service = template_extraction_service or TemplateExtractionService()
        self.risk_signal_service = risk_signal_service or RiskSignalService()

    @staticmethod
    def _create_vector_store() -> VectorStore:
        """Select the configured store while retaining a dependency-free local default."""
        if settings.VECTOR_STORE_BACKEND.lower() == "qdrant":
            return QdrantVectorStore()
        return MockVectorStore()

    def validate_input(self, file: UploadFile, document_id: str) -> None:
        """Validate basic request inputs."""
        if not document_id or not document_id.strip():
            raise InvalidInputException("documentId parameter is required and cannot be empty.")

        if not file or not file.filename:
            raise InvalidInputException("Uploaded file is missing or filename is empty.")

        file.file.seek(0, os.SEEK_END)
        file_size = file.file.tell()
        file.file.seek(0)

        if file_size == 0:
            raise InvalidInputException("Uploaded file is empty (0 bytes).")

    async def analyze_document(self, file: UploadFile, document_id: str) -> AnalysisResponse:
        """Execute complete end-to-end multi-signal AI analysis pipeline.

        Pipeline Stages:
          1. File validation & temporary isolation
          2. Document Understanding (OCR + PP-DocLayout-M Layout Detection)
          3. Relevance Gate & Document Classification
             - IF IRRELEVANT: Reject immediately. No DINOv2 inference, no Qdrant search/write.
          4. Template Extraction & Standardization (Normalized Geometry + Variable Fields)
          5. Multi-Signal Fingerprinting (DINOv2 768-D + Structural 128-D) exactly ONCE per page
          6. Qdrant Cross-Document Template Search with Self-Match Exclusion
          7. Multi-Signal Suspicion Engine (Legitimate Same-Provider Reuse vs Suspicious Cross-Provider)
          8. Trusted Corpus Registration (only for relevant documents)
          9. AnalysisReport generation and conversion to frozen AnalysisResponse
        """
        self.validate_input(file, document_id)
        start_time = time.time()

        temp_dir = settings.TEMP_DIR or None
        temp_file_path: Optional[str] = None
        created_page_files: List[str] = []

        try:
            # 1. Save uploaded file to an isolated temporary file
            suffix = os.path.splitext(file.filename)[1] if file.filename else ".tmp"
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix, dir=temp_dir) as tmp:
                temp_file_path = tmp.name
                shutil.copyfileobj(file.file, tmp)

            logger.info("Saved temporary upload file '%s' for documentId='%s'", temp_file_path, document_id)

            # Validate file format and size
            self.document_processor.file_validator.validate_file(temp_file_path)

            # 2. Stage 1: Document Understanding (Render pages, Preprocess, Layout, OCR)
            # Load pages explicitly to retain image paths for multi-signal fingerprinting
            page_entries, created_page_files = await asyncio.to_thread(
                self.document_processor.document_loader.load_document_pages, temp_file_path
            )

            # Process layout and OCR across all pages in worker thread
            def run_page_understanding():
                pages_data = []
                for page_num, temp_img_path in page_entries:
                    img_np, (orig_w, orig_h) = self.document_processor.preprocessor.preprocess_image(temp_img_path)
                    layout_regions = self.document_processor.layout_detector.detect_layout(img_np)
                    ocr_regions = self.document_processor.ocr_service.extract_ocr(img_np)
                    page_text = " ".join(reg.text for reg in ocr_regions if reg.text)

                    from app.schemas.processed_document import PageData
                    pages_data.append(
                        PageData(
                            page_number=page_num,
                            width=orig_w,
                            height=orig_h,
                            text=page_text,
                            ocr_regions=ocr_regions,
                            layout_regions=layout_regions,
                        )
                    )
                from app.schemas.processed_document import ProcessedDocument
                return ProcessedDocument(
                    document_id=document_id,
                    pages=pages_data,
                    metadata={"total_pages": len(pages_data)},
                )

            processed_doc = await asyncio.to_thread(run_page_understanding)
            logger.info(
                "Document understanding completed for documentId='%s' (%d pages)",
                document_id,
                len(processed_doc.pages),
            )

            # 3. Stage 2: Relevance Gate & Document Classification (POST OCR/Layout)
            classification: DocumentClassification = self.document_classifier.classify_and_gate(processed_doc)
            logger.info(
                "Relevance gate evaluation for documentId='%s': status=%s, type=%s, conf=%.2f",
                document_id,
                classification.relevance_status.value,
                classification.document_type.value,
                classification.confidence,
            )

            # --- IRRELEVANT DOCUMENT HANDLING & CORPUS PROTECTION ---
            if (
                classification.relevance_status == RelevanceStatus.IRRELEVANT
                or classification.document_type == DocumentType.IRRELEVANT
                or not classification.is_medical_document
            ):
                logger.warning(
                    "Document '%s' REJECTED by Relevance Gate (status=%s, type=%s). "
                    "Skipping DINOv2 inference, structural fingerprinting, and vector store registration to protect corpus.",
                    document_id,
                    classification.relevance_status.value,
                    classification.document_type.value,
                )
                reasons = list(classification.reasons)
                if not any("rejected" in r.lower() for r in reasons):
                    reasons.insert(
                        0,
                        "Document Rejected: Uploaded file is an irrelevant document and does not belong to accepted medical document categories (medical invoices, laboratory reports, or prescriptions)."
                    )
                return AnalysisResponse(
                    documentId=document_id,
                    fraudScore=0.0,
                    riskLevel="LOW",
                    confidence=0.0,
                    matchedDocuments=[],
                    reasons=reasons,
                )

            # 4. Stage 3: Template Extraction & Standardization
            templates = self.template_extraction_service.extract_document_templates(
                processed_doc=processed_doc,
                classification=classification,
            )

            # 5. Stage 4: Multi-Signal Search & Trusted Corpus Registration
            provider_name = classification.provider_info.name if classification.provider_info else None
            doc_type_val = classification.document_type.value
            all_visual_matches: List[PageSimilarityMatch] = []
            all_structural_matches: List[PageSimilarityMatch] = []

            for (page_num, temp_img_path), page_template in zip(page_entries, templates):
                logger.debug(
                    "Executing multi-signal analyze & register for docId='%s' page=%d (docType=%s)",
                    document_id,
                    page_num,
                    doc_type_val,
                )
                v_matches, s_matches, _, _ = await self.vector_intelligence_service.search_and_register_multisignal_page(
                    image_input=temp_img_path,
                    template=page_template,
                    document_id=document_id,
                    page_number=page_num,
                    document_type=doc_type_val,
                    provider_name=provider_name,
                    top_k=settings.TOP_K_MATCHES,
                    exclude_self=True,
                )
                all_visual_matches.extend(v_matches)
                all_structural_matches.extend(s_matches)

            # 6. Stage 5: Multi-Signal Match Combination & Provider Context Evaluation
            matched_candidates = self.risk_signal_service.combine_matches(
                visual_matches=all_visual_matches,
                structural_matches=all_structural_matches,
                query_doc_id=document_id,
                query_provider=classification.provider_info,
            )

            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            processing_metadata = {
                "elapsed_ms": elapsed_ms,
                "pages_count": len(processed_doc.pages),
                "classification": classification.model_dump(),
            }

            # 7. Stage 6: Risk Signal & Suspicion Scoring
            report: AnalysisReport = self.risk_signal_service.evaluate_risk(
                document_id=document_id,
                classification=classification,
                templates=templates,
                matched_candidates=matched_candidates,
                processing_metadata=processing_metadata,
            )

            logger.info(
                "Analysis complete for documentId='%s': riskLevel=%s, fraudScore=%.4f, matchedDocs=%d",
                document_id,
                report.risk_level,
                report.fraud_score,
                len(report.matched_candidates),
            )

            # 8. Convert internal rich AnalysisReport to frozen external AnalysisResponse
            return report.to_analysis_response()

        except InvalidInputException:
            raise
        except Exception as err:
            logger.error("Error processing documentId='%s': %s", document_id, str(err), exc_info=True)
            raise ProcessingException(f"Failed to process document: {str(err)}") from err
        finally:
            # 9. Guaranteed Intermediate File Cleanup
            if created_page_files:
                self.document_processor.document_loader.cleanup_temp_files(created_page_files)
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                    logger.info("Successfully deleted temporary file '%s'", temp_file_path)
                except Exception as cleanup_err:
                    logger.error("Failed to clean up temporary file '%s': %s", temp_file_path, str(cleanup_err))


