"""Qdrant concrete VectorStore implementation for invoice page embeddings."""

import uuid
from typing import Any, Dict, List, Optional
from app.core.config import settings
from app.core.exceptions import ProcessingException
from app.core.logging import logger
from app.schemas.embedding import PageEmbedding
from app.schemas.similarity import PageSimilarityMatch
from app.vector_store.base import VectorStore

try:
    from qdrant_client import QdrantClient, models
    from qdrant_client.http.exceptions import UnexpectedResponse
except ImportError:
    QdrantClient = None
    models = None
    UnexpectedResponse = Exception


class QdrantVectorStore(VectorStore):
    """Concrete VectorStore interfacing with Qdrant for 768-D page embedding search/upsert."""

    def __init__(
        self,
        url: Optional[str] = None,
        host: Optional[str] = None,
        port: Optional[int] = None,
        api_key: Optional[str] = None,
        collection_name: Optional[str] = None,
        client: Optional[Any] = None,
    ):
        if QdrantClient is None or models is None:
            raise ProcessingException("qdrant-client package is required for QdrantVectorStore.")

        self.collection_name = collection_name or settings.QDRANT_COLLECTION

        if client is not None:
            self.client = client
        else:
            q_url = url or settings.QDRANT_URL
            q_api_key = api_key or settings.QDRANT_API_KEY
            q_host = host or settings.QDRANT_HOST
            q_port = port or settings.QDRANT_PORT

            if q_url:
                self.client = QdrantClient(url=q_url, api_key=q_api_key)
            else:
                self.client = QdrantClient(host=q_host, port=q_port, api_key=q_api_key)

    async def ensure_collection(self) -> bool:
        """Ensure visual Qdrant collection exists with size=768 and Cosine distance."""
        try:
            collections = self.client.get_collections().collections
            exists = any(c.name == self.collection_name for c in collections)

            if not exists:
                logger.info("Creating Qdrant visual collection '%s' (dim=768, distance=COSINE)", self.collection_name)
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=models.VectorParams(
                        size=768,
                        distance=models.Distance.COSINE,
                    ),
                )
            return True
        except Exception as err:
            logger.error("Failed to ensure Qdrant collection '%s': %s", self.collection_name, str(err), exc_info=True)
            raise ProcessingException(f"Qdrant collection initialization failed: {str(err)}") from err

    async def ensure_structural_collection(self) -> bool:
        """Ensure structural Qdrant collection exists with size=128 and Cosine distance."""
        struct_col = settings.STRUCTURAL_COLLECTION
        try:
            collections = self.client.get_collections().collections
            exists = any(c.name == struct_col for c in collections)

            if not exists:
                logger.info("Creating Qdrant structural collection '%s' (dim=128, distance=COSINE)", struct_col)
                self.client.create_collection(
                    collection_name=struct_col,
                    vectors_config=models.VectorParams(
                        size=128,
                        distance=models.Distance.COSINE,
                    ),
                )
            return True
        except Exception as err:
            logger.error("Failed to ensure Qdrant structural collection '%s': %s", struct_col, str(err), exc_info=True)
            raise ProcessingException(f"Qdrant structural collection initialization failed: {str(err)}") from err

    @staticmethod
    def _make_point_id(document_id: str, page_number: int) -> str:
        """Generate deterministic UUID v5 for idempotent page registration."""
        name_str = f"{document_id}_page_{page_number}"
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, name_str))

    async def upsert_page_embedding(self, embedding: PageEmbedding, payload_extra: Optional[Dict[str, Any]] = None) -> bool:
        """Upsert a page embedding into Qdrant using deterministic point ID."""
        if len(embedding.vector) != 768:
            raise ProcessingException(f"Invalid embedding dimension: expected 768, got {len(embedding.vector)}")

        await self.ensure_collection()

        point_id = self._make_point_id(embedding.document_id, embedding.page_number)
        payload = {
            "document_id": embedding.document_id,
            "page_number": embedding.page_number,
            "embedding_model": embedding.model_name,
            "embedding_version": embedding.model_version,
            "created_at": embedding.created_at,
        }
        if payload_extra:
            payload.update(payload_extra)

        try:
            point = models.PointStruct(
                id=point_id,
                vector=embedding.vector,
                payload=payload,
            )
            self.client.upsert(
                collection_name=self.collection_name,
                points=[point],
            )
            logger.info(
                "Upserted page vector in Qdrant collection '%s' (docId='%s', page=%d, pointId='%s')",
                self.collection_name,
                embedding.document_id,
                embedding.page_number,
                point_id,
            )
            return True
        except Exception as err:
            logger.error("Failed to upsert page vector to Qdrant: %s", str(err), exc_info=True)
            raise ProcessingException(f"Qdrant upsert failed: {str(err)}") from err

    async def upsert_structural_embedding(self, embedding: Any, payload_extra: Optional[Dict[str, Any]] = None) -> bool:
        """Upsert a structural embedding (128-D) into structural collection."""
        if len(embedding.vector) != 128:
            raise ProcessingException(f"Invalid structural embedding dimension: expected 128, got {len(embedding.vector)}")

        await self.ensure_structural_collection()
        struct_col = settings.STRUCTURAL_COLLECTION

        point_id = self._make_point_id(embedding.document_id, embedding.page_number)
        payload = {
            "document_id": embedding.document_id,
            "page_number": embedding.page_number,
            "model_version": embedding.model_version,
            "template_version": embedding.template_version,
            "created_at": embedding.created_at,
        }
        if payload_extra:
            payload.update(payload_extra)

        try:
            point = models.PointStruct(
                id=point_id,
                vector=embedding.vector,
                payload=payload,
            )
            self.client.upsert(
                collection_name=struct_col,
                points=[point],
            )
            logger.info(
                "Upserted structural vector in Qdrant collection '%s' (docId='%s', page=%d, pointId='%s')",
                struct_col,
                embedding.document_id,
                embedding.page_number,
                point_id,
            )
            return True
        except Exception as err:
            logger.error("Failed to upsert structural vector to Qdrant: %s", str(err), exc_info=True)
            raise ProcessingException(f"Qdrant structural upsert failed: {str(err)}") from err

    async def search_nearest_pages(
        self,
        query_vector: List[float],
        top_k: int = 5,
        exclude_document_id: Optional[str] = None,
        min_similarity: Optional[float] = None,
        document_type: Optional[str] = None,
    ) -> List[PageSimilarityMatch]:
        """Search nearest page visual embeddings in Qdrant with optional self-match exclusion and document-type filter."""
        if len(query_vector) != 768:
            raise ProcessingException(f"Query vector dimension mismatch: expected 768, got {len(query_vector)}")

        await self.ensure_collection()

        threshold = min_similarity if min_similarity is not None else settings.SIMILARITY_THRESHOLD

        must_conditions = []
        must_not_conditions = []

        if exclude_document_id:
            must_not_conditions.append(
                models.FieldCondition(
                    key="document_id",
                    match=models.MatchValue(value=exclude_document_id),
                )
            )

        if document_type:
            must_conditions.append(
                models.FieldCondition(
                    key="document_type",
                    match=models.MatchValue(value=document_type.upper()),
                )
            )

        search_filter = None
        if must_conditions or must_not_conditions:
            search_filter = models.Filter(
                must=must_conditions if must_conditions else None,
                must_not=must_not_conditions if must_not_conditions else None,
            )

        try:
            hits = self.client.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            limit=top_k,
            query_filter=search_filter,
            ).points

            results: List[PageSimilarityMatch] = []
            for hit in hits:
                payload = hit.payload or {}
                doc_id = str(payload.get("document_id", ""))
                page_num = int(payload.get("page_number", 1))
                score = float(hit.score)

                match = PageSimilarityMatch(
                    document_id=doc_id,
                    page_number=page_num,
                    similarity_score=round(score, 6),
                    threshold=threshold,
                    above_threshold=(score >= threshold),
                    metadata=payload,
                )
                results.append(match)

            return results
        except Exception as err:
            logger.error("Qdrant search failed: %s", str(err), exc_info=True)
            raise ProcessingException(f"Qdrant search failed: {str(err)}") from err

    async def search_nearest_structural(
        self,
        query_vector: List[float],
        top_k: int = 5,
        exclude_document_id: Optional[str] = None,
        min_similarity: Optional[float] = None,
        document_type: Optional[str] = None,
    ) -> List[PageSimilarityMatch]:
        """Search nearest structural layout embeddings in Qdrant with optional self-match exclusion and document-type filter."""
        if len(query_vector) != 128:
            raise ProcessingException(f"Structural query vector dimension mismatch: expected 128, got {len(query_vector)}")

        await self.ensure_structural_collection()
        struct_col = settings.STRUCTURAL_COLLECTION

        threshold = min_similarity if min_similarity is not None else settings.STRUCTURAL_SIMILARITY_THRESHOLD

        must_conditions = []
        must_not_conditions = []

        if exclude_document_id:
            must_not_conditions.append(
                models.FieldCondition(
                    key="document_id",
                    match=models.MatchValue(value=exclude_document_id),
                )
            )

        if document_type:
            must_conditions.append(
                models.FieldCondition(
                    key="document_type",
                    match=models.MatchValue(value=document_type.upper()),
                )
            )

        search_filter = None
        if must_conditions or must_not_conditions:
            search_filter = models.Filter(
                must=must_conditions if must_conditions else None,
                must_not=must_not_conditions if must_not_conditions else None,
            )

        try:
            hits = self.client.search(
                collection_name=struct_col,
                query_vector=query_vector,
                limit=top_k,
                query_filter=search_filter,
            )

            results: List[PageSimilarityMatch] = []
            for hit in hits:
                payload = hit.payload or {}
                doc_id = str(payload.get("document_id", ""))
                page_num = int(payload.get("page_number", 1))
                score = float(hit.score)

                match = PageSimilarityMatch(
                    document_id=doc_id,
                    page_number=page_num,
                    similarity_score=round(score, 6),
                    threshold=threshold,
                    above_threshold=(score >= threshold),
                    metadata=payload,
                )
                results.append(match)

            return results
        except Exception as err:
            logger.error("Qdrant structural search failed: %s", str(err), exc_info=True)
            raise ProcessingException(f"Qdrant structural search failed: {str(err)}") from err

    async def delete_document_embeddings(self, document_id: str) -> bool:
        """Delete all page vector points matching document_id from both visual and structural collections."""
        await self.ensure_collection()
        await self.ensure_structural_collection()
        struct_col = settings.STRUCTURAL_COLLECTION
        try:
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=models.FilterSelector(
                    filter=models.Filter(
                        must=[
                            models.FieldCondition(
                                key="document_id",
                                match=models.MatchValue(value=document_id),
                            )
                        ]
                    )
                ),
            )
            self.client.delete(
                collection_name=struct_col,
                points_selector=models.FilterSelector(
                    filter=models.Filter(
                        must=[
                            models.FieldCondition(
                                key="document_id",
                                match=models.MatchValue(value=document_id),
                            )
                        ]
                    )
                ),
            )
            logger.info("Deleted page vectors for docId='%s' from Qdrant collections", document_id)
            return True
        except Exception as err:
            logger.error("Failed to delete vectors for docId='%s' from Qdrant: %s", document_id, str(err), exc_info=True)
            raise ProcessingException(f"Qdrant delete failed: {str(err)}") from err

    async def add_vector(
        self,
        document_id: str,
        vector: List[float],
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """Legacy compatibility wrapper mapping add_vector to page 1 upsert."""
        embedding = PageEmbedding(
            document_id=document_id,
            page_number=1,
            vector=vector,
        )
        return await self.upsert_page_embedding(embedding)

    async def search_similar(
        self,
        vector: List[float],
        top_k: int = 5,
        min_similarity: float = 0.0,
    ) -> List[Dict[str, Any]]:
        """Legacy compatibility wrapper for search_similar."""
        matches = await self.search_nearest_pages(
            query_vector=vector,
            top_k=top_k,
            min_similarity=min_similarity,
        )
        return [
            {
                "documentId": m.document_id,
                "similarity": m.similarity_score,
                "metadata": m.metadata,
            }
            for m in matches
        ]

    async def delete_vector(self, document_id: str) -> bool:
        """Legacy compatibility wrapper for delete_vector."""
        return await self.delete_document_embeddings(document_id)

    async def is_healthy(self) -> bool:
        """Check Qdrant backend connectivity."""
        try:
            self.client.get_collections()
            return True
        except Exception:
            return False

