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
        self._structural_store: Dict[str, Any] = {}
        self._legacy_store: Dict[str, Dict[str, Any]] = {}
        self._collection_initialized: bool = False
        self._structural_collection_initialized: bool = False

    async def ensure_collection(self) -> bool:
        """Ensure mock visual collection is initialized."""
        self._collection_initialized = True
        logger.debug("MockVectorStore: Collection '%s' initialized", self.collection_name)
        return True

    async def ensure_structural_collection(self) -> bool:
        """Ensure mock structural collection is initialized."""
        self._structural_collection_initialized = True
        logger.debug("MockVectorStore: Structural collection '%s' initialized", settings.STRUCTURAL_COLLECTION)
        return True

    async def upsert_page_embedding(self, embedding: PageEmbedding, payload_extra: Optional[Dict[str, Any]] = None) -> bool:
        """Upsert a page embedding into in-memory store."""
        key = f"{embedding.document_id}:{embedding.page_number}"
        self._page_store[key] = {
            "embedding": embedding,
            "payload_extra": payload_extra or {},
        }
        logger.debug("MockVectorStore: Upserted page embedding key='%s'", key)
        return True

    async def upsert_structural_embedding(self, embedding: Any, payload_extra: Optional[Dict[str, Any]] = None) -> bool:
        """Upsert a structural embedding into in-memory store."""
        key = f"{embedding.document_id}:{embedding.page_number}"
        self._structural_store[key] = {
            "embedding": embedding,
            "payload_extra": payload_extra or {},
        }
        logger.debug("MockVectorStore: Upserted structural embedding key='%s'", key)
        return True

    async def search_nearest_pages(
        self,
        query_vector: List[float],
        top_k: int = 5,
        exclude_document_id: Optional[str] = None,
        min_similarity: Optional[float] = None,
        document_type: Optional[str] = None,
    ) -> List[PageSimilarityMatch]:
        """Search nearest page embeddings in memory, filtering out exclude_document_id and matching document_type."""
        threshold = min_similarity if min_similarity is not None else settings.SIMILARITY_THRESHOLD
        q_vec = np.array(query_vector, dtype=np.float32)

        candidates = []
        for key, item in self._page_store.items():
            if isinstance(item, dict):
                emb = item["embedding"]
                extra = item["payload_extra"]
            else:
                emb = item
                extra = {}

            if exclude_document_id and emb.document_id == exclude_document_id:
                continue  # Self-match prevention

            # Document-type partition filter
            if document_type:
                cand_doc_type = extra.get("document_type") or extra.get("doc_type")
                if cand_doc_type and cand_doc_type.upper() != document_type.upper():
                    continue

            stored_vec = np.array(emb.vector, dtype=np.float32)
            score = float(np.dot(q_vec, stored_vec))
            candidates.append((score, emb, extra))

        candidates.sort(key=lambda x: x[0], reverse=True)

        results = []
        for score, emb, extra in candidates[:top_k]:
            meta = {
                "model_name": emb.model_name,
                "model_version": emb.model_version,
                "created_at": emb.created_at,
            }
            meta.update(extra)
            results.append(
                PageSimilarityMatch(
                    document_id=emb.document_id,
                    page_number=emb.page_number,
                    similarity_score=round(score, 6),
                    threshold=threshold,
                    above_threshold=(score >= threshold),
                    metadata=meta,
                )
            )
        return results

    async def search_nearest_structural(
        self,
        query_vector: List[float],
        top_k: int = 5,
        exclude_document_id: Optional[str] = None,
        min_similarity: Optional[float] = None,
        document_type: Optional[str] = None,
    ) -> List[PageSimilarityMatch]:
        """Search nearest structural layout embeddings in memory, filtering out exclude_document_id and matching document_type."""
        threshold = min_similarity if min_similarity is not None else settings.STRUCTURAL_SIMILARITY_THRESHOLD
        q_vec = np.array(query_vector, dtype=np.float32)

        candidates = []
        for key, item in self._structural_store.items():
            emb = item["embedding"]
            extra = item["payload_extra"]

            if exclude_document_id and emb.document_id == exclude_document_id:
                continue  # Self-match prevention

            # Document-type partition filter
            if document_type:
                cand_doc_type = extra.get("document_type") or extra.get("doc_type")
                if cand_doc_type and cand_doc_type.upper() != document_type.upper():
                    continue

            stored_vec = np.array(emb.vector, dtype=np.float32)
            score = float(np.dot(q_vec, stored_vec))
            candidates.append((score, emb, extra))

        candidates.sort(key=lambda x: x[0], reverse=True)

        results = []
        for score, emb, extra in candidates[:top_k]:
            meta = {
                "model_version": emb.model_version,
                "template_version": emb.template_version,
                "created_at": emb.created_at,
            }
            meta.update(extra)
            results.append(
                PageSimilarityMatch(
                    document_id=emb.document_id,
                    page_number=emb.page_number,
                    similarity_score=round(score, 6),
                    threshold=threshold,
                    above_threshold=(score >= threshold),
                    metadata=meta,
                )
            )
        return results

    async def delete_document_embeddings(self, document_id: str) -> bool:
        """Delete all page embeddings for a given document_id."""
        keys_to_delete = [
            k for k, v in self._page_store.items()
            if (v["embedding"].document_id if isinstance(v, dict) else v.document_id) == document_id
        ]
        for k in keys_to_delete:
            del self._page_store[k]
        struct_keys = [k for k, v in self._structural_store.items() if v["embedding"].document_id == document_id]
        for k in struct_keys:
            del self._structural_store[k]
        return len(keys_to_delete) > 0 or len(struct_keys) > 0

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


