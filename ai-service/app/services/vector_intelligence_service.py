"""VectorIntelligenceService orchestrating page-level embedding generation, vector search, self-match prevention, and registration workflows."""

from typing import Any, Dict, List, Optional, Tuple, Union
from PIL import Image

from app.core.logging import logger
from app.schemas.embedding import PageEmbedding
from app.schemas.similarity import PageSimilarityMatch, SimilarityEvidence
from app.schemas.structural import NormalizedPageTemplate, StructuralEmbedding
from app.services.embedding_service import EmbeddingService
from app.services.fingerprint_service import FingerprintService, StructuralFingerprintService
from app.services.similarity_service import SimilarityService
from app.vector_store.base import VectorStore
from app.vector_store.mock import MockVectorStore


class VectorIntelligenceService:
    """Orchestrates multi-signal vector intelligence capabilities: visual and structural search/registration."""

    def __init__(
        self,
        embedding_service: Optional[EmbeddingService] = None,
        vector_store: Optional[VectorStore] = None,
        similarity_service: Optional[SimilarityService] = None,
        structural_service: Optional[StructuralFingerprintService] = None,
        fingerprint_service: Optional[FingerprintService] = None,
    ):
        self.embedding_service = embedding_service or EmbeddingService()
        self.vector_store = vector_store or MockVectorStore()
        self.similarity_service = similarity_service or SimilarityService()
        self.structural_service = structural_service or StructuralFingerprintService()
        self.fingerprint_service = fingerprint_service or FingerprintService(
            embedding_service=self.embedding_service,
            structural_service=self.structural_service,
        )

    async def search_and_register_multisignal_page(
        self,
        image_input: Union[Image.Image, str],
        template: NormalizedPageTemplate,
        document_id: str,
        page_number: int,
        document_type: Optional[str] = None,
        provider_name: Optional[str] = None,
        template_family_id: Optional[str] = None,
        top_k: int = 5,
        exclude_self: bool = True,
    ) -> Tuple[List[PageSimilarityMatch], List[PageSimilarityMatch], PageEmbedding, StructuralEmbedding]:
        """Search both visual and structural collections in Qdrant and register embeddings once per page."""
        doc_type_str = document_type.upper() if document_type else None
        logger.info(
            "Multi-signal analyze+register for docId='%s' page=%d (type=%s, top_k=%d, exclude_self=%s)",
            document_id,
            page_number,
            doc_type_str,
            top_k,
            exclude_self,
        )

        # 1. Generate Visual (DINOv2 768-D) and Structural (128-D) embeddings exactly ONCE
        visual_emb: PageEmbedding = self.fingerprint_service.generate_visual_fingerprint(
            image_input=image_input,
            document_id=document_id,
            page_number=page_number,
        )
        structural_emb: StructuralEmbedding = self.fingerprint_service.generate_structural_fingerprint(
            template=template,
            document_id=document_id,
        )

        # 2. Search Qdrant Visual and Structural collections BEFORE upserting (self-exclusion + document_type partition)
        exclude_doc_id = document_id if exclude_self else None

        visual_matches = await self.vector_store.search_nearest_pages(
            query_vector=visual_emb.vector,
            top_k=top_k,
            exclude_document_id=exclude_doc_id,
            document_type=doc_type_str,
        )

        structural_matches = await self.vector_store.search_nearest_structural(
            query_vector=structural_emb.vector,
            top_k=top_k,
            exclude_document_id=exclude_doc_id,
            document_type=doc_type_str,
        )

        logger.info(
            "Completed multi-signal search for docId='%s' page=%d: %d visual matches, %d structural matches",
            document_id,
            page_number,
            len(visual_matches),
            len(structural_matches),
        )

        # 3. Register BOTH embeddings into trusted corpus AFTER search
        extra_payload = {
            "document_type": doc_type_str,
            "provider_name": provider_name,
            "template_family_id": template_family_id or f"TF-{document_id[:8]}",
        }

        try:
            await self.vector_store.upsert_page_embedding(visual_emb, payload_extra=extra_payload)
            await self.vector_store.upsert_structural_embedding(structural_emb, payload_extra=extra_payload)
            logger.info("Registered visual & structural embeddings into corpus for docId='%s' page=%d (type=%s)", document_id, page_number, doc_type_str)
        except Exception as reg_err:
            logger.error(
                "Failed to register embeddings for docId='%s' page=%d: %s — search result preserved",
                document_id,
                page_number,
                str(reg_err),
            )

        return visual_matches, structural_matches, visual_emb, structural_emb

    async def analyze_page_similarity(
        self,
        image_input: Union[Image.Image, str],
        document_id: str,
        page_number: int,
        top_k: int = 5,
        exclude_self: bool = True,
    ) -> SimilarityEvidence:
        """Search workflow: extract page embedding and search nearest neighbors in existing corpus."""
        logger.info(
            "Starting page similarity search for documentId='%s' page=%d (top_k=%d, exclude_self=%s)",
            document_id,
            page_number,
            top_k,
            exclude_self,
        )

        embedding: PageEmbedding = self.embedding_service.generate_page_embedding(
            image_input=image_input,
            document_id=document_id,
            page_number=page_number,
        )

        exclude_doc_id = document_id if exclude_self else None
        raw_matches = await self.vector_store.search_nearest_pages(
            query_vector=embedding.vector,
            top_k=top_k,
            exclude_document_id=exclude_doc_id,
        )

        evidence: SimilarityEvidence = self.similarity_service.evaluate_similarity(
            query_document_id=document_id,
            query_page_number=page_number,
            raw_matches=raw_matches,
        )
        return evidence

    async def analyze_and_register_page(
        self,
        image_input: Union[Image.Image, str],
        document_id: str,
        page_number: int,
        top_k: int = 5,
        exclude_self: bool = True,
    ) -> SimilarityEvidence:
        """Combined search + registration workflow using a SINGLE DINOv2 inference per page."""
        logger.info(
            "Starting combined analyze+register for documentId='%s' page=%d (top_k=%d, exclude_self=%s)",
            document_id,
            page_number,
            top_k,
            exclude_self,
        )

        embedding: PageEmbedding = self.embedding_service.generate_page_embedding(
            image_input=image_input,
            document_id=document_id,
            page_number=page_number,
        )

        exclude_doc_id = document_id if exclude_self else None
        raw_matches = await self.vector_store.search_nearest_pages(
            query_vector=embedding.vector,
            top_k=top_k,
            exclude_document_id=exclude_doc_id,
        )

        evidence: SimilarityEvidence = self.similarity_service.evaluate_similarity(
            query_document_id=document_id,
            query_page_number=page_number,
            raw_matches=raw_matches,
        )

        try:
            await self.vector_store.upsert_page_embedding(embedding)
            logger.info("Registered page embedding into corpus for documentId='%s' page=%d", document_id, page_number)
        except Exception as reg_err:
            logger.error("Failed to register embedding for documentId='%s' page=%d: %s", document_id, page_number, str(reg_err))

        return evidence

    async def register_page_embedding(
        self,
        image_input: Union[Image.Image, str],
        document_id: str,
        page_number: int,
    ) -> PageEmbedding:
        """Registration workflow: explicitly extract and index a page embedding into the vector store."""
        logger.info("Registering page embedding into vector store for documentId='%s' page=%d", document_id, page_number)

        embedding: PageEmbedding = self.embedding_service.generate_page_embedding(
            image_input=image_input,
            document_id=document_id,
            page_number=page_number,
        )

        await self.vector_store.upsert_page_embedding(embedding)
        return embedding

