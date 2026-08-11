"""Abstract base class interface for vector stores.

Concrete vector DB selection (Qdrant, FAISS, pgvector, etc.) will occur in Phase 2.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

from app.schemas.embedding import PageEmbedding
from app.schemas.similarity import PageSimilarityMatch


class VectorStore(ABC):
    """Abstract interface defining vector store operations required by the AI service."""

    @abstractmethod
    async def ensure_collection(self) -> bool:
        """Ensure collection exists with vector size=768 and Cosine distance."""
        pass

    @abstractmethod
    async def upsert_page_embedding(self, embedding: PageEmbedding) -> bool:
        """Upsert a page embedding into vector store using deterministic point ID."""
        pass

    @abstractmethod
    async def search_nearest_pages(
        self,
        query_vector: List[float],
        top_k: int = 5,
        exclude_document_id: Optional[str] = None,
        min_similarity: Optional[float] = None,
    ) -> List[PageSimilarityMatch]:
        """Search nearest page embeddings, supporting current-document self-match exclusion."""
        pass

    @abstractmethod
    async def delete_document_embeddings(self, document_id: str) -> bool:
        """Delete all page vector entries associated with document_id."""
        pass

    @abstractmethod
    async def is_healthy(self) -> bool:
        """Check connection / readiness health of the vector store backend."""
        pass

    # Legacy methods maintained for backward compatibility
    @abstractmethod
    async def add_vector(
        self,
        document_id: str,
        vector: List[float],
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """Add or update a document embedding vector and metadata in the store."""
        pass

    @abstractmethod
    async def search_similar(
        self,
        vector: List[float],
        top_k: int = 5,
        min_similarity: float = 0.0,
    ) -> List[Dict[str, Any]]:
        """Search for top_k similar document embeddings matching the query vector."""
        pass

    @abstractmethod
    async def delete_vector(self, document_id: str) -> bool:
        """Delete a document vector entry by document ID."""
        pass

