"""VectorIntelligenceService orchestrating page-level embedding generation, vector search, self-match prevention, and registration workflows."""

from typing import Optional, Union
from PIL import Image

from app.core.logging import logger
from app.schemas.embedding import PageEmbedding
from app.schemas.similarity import SimilarityEvidence
from app.services.embedding_service import EmbeddingService
from app.services.similarity_service import SimilarityService
from app.vector_store.base import VectorStore
from app.vector_store.mock import MockVectorStore


class VectorIntelligenceService:
    """Orchestrates Phase 2A vector intelligence capabilities: search/analysis and explicit registration."""

    def __init__(
        self,
        embedding_service: Optional[EmbeddingService] = None,
        vector_store: Optional[VectorStore] = None,
        similarity_service: Optional[SimilarityService] = None,
    ):
        self.embedding_service = embedding_service or EmbeddingService()
        self.vector_store = vector_store or MockVectorStore()
        self.similarity_service = similarity_service or SimilarityService()

    async def analyze_page_similarity(
        self,
        image_input: Union[Image.Image, str],
        document_id: str,
        page_number: int,
        top_k: int = 5,
        exclude_self: bool = True,
    ) -> SimilarityEvidence:
        """Search workflow: extract page embedding and search nearest neighbors in existing corpus.

        Prevents current document self-match by setting exclude_document_id when exclude_self is True.
        Does NOT auto-register the page embedding into the vector store.
        """
        logger.info(
            "Starting page similarity search for documentId='%s' page=%d (top_k=%d, exclude_self=%s)",
            document_id,
            page_number,
            top_k,
            exclude_self,
        )

        # 1. Generate 768-D L2-normalized embedding
        embedding: PageEmbedding = self.embedding_service.generate_page_embedding(
            image_input=image_input,
            document_id=document_id,
            page_number=page_number,
        )

        # 2. Execute vector nearest-neighbor search with self-match exclusion
        exclude_doc_id = document_id if exclude_self else None
        raw_matches = await self.vector_store.search_nearest_pages(
            query_vector=embedding.vector,
            top_k=top_k,
            exclude_document_id=exclude_doc_id,
        )

        # 3. Evaluate baseline similarity threshold evidence
        evidence: SimilarityEvidence = self.similarity_service.evaluate_similarity(
            query_document_id=document_id,
            query_page_number=page_number,
            raw_matches=raw_matches,
        )

        logger.info(
            "Completed similarity search for documentId='%s' page=%d: %d matches found",
            document_id,
            page_number,
            len(evidence.matches),
        )
        return evidence

    async def register_page_embedding(
        self,
        image_input: Union[Image.Image, str],
        document_id: str,
        page_number: int,
    ) -> PageEmbedding:
        """Registration workflow: explicitly extract and index a page embedding into the vector store."""
        logger.info("Registering page embedding into vector store for documentId='%s' page=%d", document_id, page_number)

        # 1. Generate 768-D L2-normalized embedding
        embedding: PageEmbedding = self.embedding_service.generate_page_embedding(
            image_input=image_input,
            document_id=document_id,
            page_number=page_number,
        )

        # 2. Upsert into vector store
        await self.vector_store.upsert_page_embedding(embedding)

        logger.info("Successfully registered page embedding for documentId='%s' page=%d", document_id, page_number)
        return embedding
