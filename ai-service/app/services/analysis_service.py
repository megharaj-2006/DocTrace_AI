import asyncio
import inspect
import os
import shutil
import tempfile
from typing import Dict, List, Optional
from fastapi import UploadFile

from app.core.config import settings
from app.core.exceptions import InvalidInputException, ProcessingException
from app.core.logging import logger
from app.document_processing.processor import DocumentProcessor
from app.schemas.analysis import AnalysisResponse, MatchedDocument
from app.schemas.similarity import SimilarityEvidence
from app.services.vector_intelligence_service import VectorIntelligenceService
from app.vector_store.base import VectorStore
from app.vector_store.mock import MockVectorStore


class AnalysisService:
    """Orchestrates document validation, temporary file lifecycle, Phase 1 intelligence, and Phase 2A vector search."""

    def __init__(
        self,
        vector_store: Optional[VectorStore] = None,
        document_processor: Optional[DocumentProcessor] = None,
        vector_intelligence_service: Optional[VectorIntelligenceService] = None,
    ):
        self.vector_store = vector_store or MockVectorStore()
        self.document_processor = document_processor or DocumentProcessor()
        self.vector_intelligence_service = vector_intelligence_service or VectorIntelligenceService(
            vector_store=self.vector_store
        )

    def validate_input(self, file: UploadFile, document_id: str) -> None:
        """Validate basic request inputs for Phase 1 and Phase 2B."""
        if not document_id or not document_id.strip():
            raise InvalidInputException("documentId parameter is required and cannot be empty.")

        if not file or not file.filename:
            raise InvalidInputException("Uploaded file is missing or filename is empty.")

        # Check if file has size (if available) or read head
        file.file.seek(0, os.SEEK_END)
        file_size = file.file.tell()
        file.file.seek(0)

        if file_size == 0:
            raise InvalidInputException("Uploaded file is empty (0 bytes).")

    async def analyze_document(self, file: UploadFile, document_id: str) -> AnalysisResponse:
        """Process document file through Phase 1 DocumentProcessor and Phase 2A Vector Intelligence.

        Returns structured response conforming strictly to frozen AnalysisResponse API contract.
        Guarantees main temporary file deletion upon completion or failure.
        """
        self.validate_input(file, document_id)

        temp_dir = settings.TEMP_DIR or None
        temp_file_path: Optional[str] = None
        evidences: List[SimilarityEvidence] = []

        try:
            # 1. Save uploaded file to an isolated temporary file
            suffix = os.path.splitext(file.filename)[1] if file.filename else ".tmp"
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix, dir=temp_dir) as tmp:
                temp_file_path = tmp.name
                shutil.copyfileobj(file.file, tmp)

            logger.info(
                "Created temporary processing file '%s' for documentId='%s'",
                temp_file_path,
                document_id,
            )

            # Capture main event loop for threadsafe coroutine scheduling from worker thread
            main_loop = asyncio.get_running_loop()

            # Define page callback for inline Phase 2A vector similarity analysis
            def page_callback(page_num: int, temp_img_path: str):
                logger.debug(
                    "Executing Phase 2A page analyze+register for docId='%s' page=%d",
                    document_id,
                    page_num,
                )
                try:
                    future = asyncio.run_coroutine_threadsafe(
                        self.vector_intelligence_service.analyze_and_register_page(
                            image_input=temp_img_path,
                            document_id=document_id,
                            page_number=page_num,
                            top_k=5,
                            exclude_self=True,
                        ),
                        main_loop,
                    )
                    evidence = future.result(timeout=60)
                    evidences.append(evidence)
                except Exception as err:
                    logger.error(
                        "Error running Phase 2A analyze+register for docId='%s' page=%d: %s",
                        document_id,
                        page_num,
                        str(err),
                        exc_info=True,
                    )
                    raise

            # 2. Phase 1 Document Intelligence Execution + Inline Phase 2A Vector Search in worker thread
            processed_doc = await asyncio.to_thread(
                self.document_processor.process,
                temp_file_path,
                document_id,
                page_callback,
            )

            logger.info(

                "Completed document processing and vector search for documentId='%s' (%d pages)",
                document_id,
                len(processed_doc.pages),
            )

            # 3. Map accumulated page-level SimilarityEvidence to frozen AnalysisResponse API contract
            matched_dict: Dict[str, float] = {}

            for ev in evidences:
                for match in ev.matches:
                    if match.document_id not in matched_dict or match.similarity_score > matched_dict[match.document_id]:
                        matched_dict[match.document_id] = match.similarity_score

            matched_documents: List[MatchedDocument] = [
                MatchedDocument(documentId=doc_id, similarity=score)
                for doc_id, score in matched_dict.items()
            ]
            matched_documents.sort(key=lambda x: x.similarity, reverse=True)

            if matched_documents:
                top_similarity = matched_documents[0].similarity
                fraud_score = round(top_similarity, 4)
                if top_similarity >= settings.SIMILARITY_THRESHOLD:
                    risk_level = "RED"
                elif top_similarity >= 0.90:
                    risk_level = "AMBER"
                else:
                    risk_level = "LOW"

                confidence = round(min(0.99, max(0.85, top_similarity)), 2)
                reasons = [
                    f"Detected template similarity with document '{m.documentId}' (similarity: {m.similarity:.4f})"
                    for m in matched_documents
                ]
            else:
                fraud_score = 0.0
                risk_level = "LOW"
                confidence = 0.95
                reasons = ["No suspicious template similarity detected against existing document corpus."]

            response = AnalysisResponse(
                documentId=document_id,
                fraudScore=fraud_score,
                riskLevel=risk_level,
                confidence=confidence,
                matchedDocuments=matched_documents,
                reasons=reasons,
            )

            logger.info("Analysis completed successfully for documentId='%s'", document_id)
            return response

        except InvalidInputException:
            raise
        except Exception as err:
            logger.error("Error processing documentId='%s': %s", document_id, str(err), exc_info=True)
            raise ProcessingException(f"Failed to process document: {str(err)}") from err
        finally:
            # 4. Guaranteed Main Temporary File Cleanup
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                    logger.info("Successfully deleted temporary file '%s'", temp_file_path)
                except Exception as cleanup_err:
                    logger.error("Failed to clean up temporary file '%s': %s", temp_file_path, str(cleanup_err))

