import logging
import numpy as np
from typing import Any, Dict, List, Optional

from app.core.config import settings
from app.schemas.embedding import PageEmbedding
from app.schemas.similarity import PageSimilarityMatch
from app.vector_store.base import VectorStore

logger = logging.getLogger(__name__)


class MockVectorStore(VectorStore):
    """In-memory mock vector store implementation used for testing and Phase 0/1 compatibility."""

    def __init__(self, collection_name: Optional[str] = None):
        self.collection_name = collection_name or settings.QDRANT_COLLECTION
        # Keys are "document_id:page_number"
        self._page_store: Dict[str, PageEmbedding] = {}
        self._legacy_store: Dict[str, Dict[str, Any]] = {}
        self._collection_initialized: bool = False

    async def ensure_collection(self) -> bool:
        """Ensure mock collection is initialized."""
        self._collection_initialized = True
        logger.debug("MockVectorStore: Collection '%s' initialized", self.collection_name)
        return True

    async def upsert_page_embedding(self, embedding: PageEmbedding) -> bool:
        """Upsert a page embedding into in-memory store."""
        key = f"{embedding.document_id}:{embedding.page_number}"
        self._page_store[key] = embedding
        logger.debug("MockVectorStore: Upserted page embedding key='%s'", key)
        return True

    async def search_nearest_pages(
        self,
        query_vector: List[float],
        top_k: int = 5,
        exclude_document_id: Optional[str] = None,
        min_similarity: Optional[float] = None,
    ) -> List[PageSimilarityMatch]:
        """Search nearest page embeddings in memory, filtering out exclude_document_id."""
        threshold = min_similarity if min_similarity is not None else settings.SIMILARITY_THRESHOLD
        q_vec = np.array(query_vector, dtype=np.float32)

        candidates = []
        for key, emb in self._page_store.items():
            if exclude_document_id and emb.document_id == exclude_document_id:
                continue  # Self-match prevention

            stored_vec = np.array(emb.vector, dtype=np.float32)
            # Dot product of normalized vectors = Cosine similarity
            score = float(np.dot(q_vec, stored_vec))
            candidates.append((score, emb))

        # Sort descending by similarity score
        candidates.sort(key=lambda x: x[0], reverse=True)

        results = []
        for score, emb in candidates[:top_k]:
            results.append(
                PageSimilarityMatch(
                    document_id=emb.document_id,
                    page_number=emb.page_number,
                    similarity_score=round(score, 6),
                    threshold=threshold,
                    above_threshold=(score >= threshold),
                    metadata={
                        "model_name": emb.model_name,
                        "model_version": emb.model_version,
                        "created_at": emb.created_at,
                    },
                )
            )
        return results

    async def delete_document_embeddings(self, document_id: str) -> bool:
        """Delete all page embeddings for a given document_id."""
        keys_to_delete = [k for k, v in self._page_store.items() if v.document_id == document_id]
        for k in keys_to_delete:
            del self._page_store[k]
        return len(keys_to_delete) > 0

    async def add_vector(
        self,
        document_id: str,
        vector: List[float],
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """Store legacy vector and metadata in memory."""
        self._legacy_store[document_id] = {
            "vector": vector,
            "metadata": metadata or {},
        }
        return True

    async def search_similar(
        self,
        vector: List[float],
        top_k: int = 5,
        min_similarity: float = 0.0,
    ) -> List[Dict[str, Any]]:
        """Return legacy search results."""
        results = []
        for doc_id, data in list(self._legacy_store.items())[:top_k]:
            results.append({
                "documentId": doc_id,
                "similarity": 0.94,
                "metadata": data.get("metadata", {}),
            })
        return results

    async def delete_vector(self, document_id: str) -> bool:
        """Remove legacy document vector entry."""
        if document_id in self._legacy_store:
            del self._legacy_store[document_id]
            return True
        return False

    async def is_healthy(self) -> bool:
        """Mock vector store is always healthy."""
        return True

