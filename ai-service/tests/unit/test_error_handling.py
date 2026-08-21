"""Unit tests for Phase 2B error handling, HTTP error contracts, and failure path cleanup."""

import os
import pytest
from app.core.exceptions import InvalidInputException, ProcessingException
from app.services.analysis_service import AnalysisService
from app.vector_store.base import VectorStore


class FailingVectorStore(VectorStore):
    """Failing mock vector store simulating infrastructure / connection failures."""

    async def ensure_collection(self) -> bool:
        raise ProcessingException("Qdrant cluster connection failed: Connection refused")

    async def ensure_structural_collection(self) -> bool:
        raise ProcessingException("Qdrant cluster connection failed: Connection refused")

    async def upsert_page_embedding(self, embedding, payload_extra=None) -> bool:
        raise ProcessingException("Qdrant cluster connection failed: Connection refused")

    async def upsert_structural_embedding(self, embedding, payload_extra=None) -> bool:
        raise ProcessingException("Qdrant cluster connection failed: Connection refused")

    async def search_nearest_pages(self, query_vector, top_k=5, exclude_document_id=None, min_similarity=None):
        raise ProcessingException("Qdrant cluster connection failed: Connection refused")

    async def search_nearest_structural(self, query_vector, top_k=5, exclude_document_id=None, min_similarity=None):
        raise ProcessingException("Qdrant cluster connection failed: Connection refused")

    async def delete_document_embeddings(self, document_id: str) -> bool:
        raise ProcessingException("Qdrant cluster connection failed")

    async def is_healthy(self) -> bool:
        return False

    async def add_vector(self, document_id: str, vector, metadata=None) -> bool:
        raise ProcessingException("Qdrant failure")

    async def search_similar(self, vector, top_k=5, min_similarity=0.0):
        raise ProcessingException("Qdrant failure")

    async def delete_vector(self, document_id: str) -> bool:
        raise ProcessingException("Qdrant failure")



AUTH_HEADERS = {"X-Internal-API-Key": "dev-internal-secret-key-12345"}


def test_empty_document_id_raises_http_400(client, sample_png_content):
    """Verify empty documentId raises HTTP 400 Bad Request."""
    response = client.post(
        "/api/v1/analyze",
        data={"documentId": "   "},
        files={"file": ("invoice.png", sample_png_content, "image/png")},
        headers=AUTH_HEADERS,
    )
    assert response.status_code == 400
    assert "documentId parameter is required" in response.json()["detail"]


def test_empty_file_raises_http_400(client):
    """Verify empty 0-byte file upload raises HTTP 400 Bad Request."""
    response = client.post(
        "/api/v1/analyze",
        data={"documentId": "INV-EMPTY"},
        files={"file": ("empty.png", b"", "image/png")},
        headers=AUTH_HEADERS,
    )
    assert response.status_code == 400
    assert "Uploaded file is empty" in response.json()["detail"]


def test_unsupported_file_format_raises_http_400(client):
    """Verify uploading an unsupported file format (.txt) raises HTTP 400 Bad Request."""
    response = client.post(
        "/api/v1/analyze",
        data={"documentId": "INV-TXT"},
        files={"file": ("notes.txt", b"some text content", "text/plain")},
        headers=AUTH_HEADERS,
    )
    assert response.status_code == 400
    assert "Unsupported document format" in response.json()["detail"]


def test_qdrant_infrastructure_failure_surfaces_as_http_500(client, sample_png_content):
    """Verify Qdrant failure surfaces as HTTP 500 error instead of false 'no matches' success."""
    from unittest.mock import MagicMock
    from app.api.routes.analysis import get_analysis_service
    from app.main import app
    from app.schemas.document_understanding import DocumentClassification, DocumentType, RelevanceStatus

    failing_service = AnalysisService(vector_store=FailingVectorStore())
    failing_service.document_classifier.classify_and_gate = MagicMock(
        return_value=DocumentClassification(
            relevance_status=RelevanceStatus.RELEVANT,
            document_type=DocumentType.INVOICE,
            confidence=0.95,
            keywords_detected=["invoice", "total"],
            reasons=["Valid test medical invoice"],
        )
    )
    app.dependency_overrides[get_analysis_service] = lambda: failing_service

    try:
        response = client.post(
            "/api/v1/analyze",
            data={"documentId": "INV-FAIL-QDRANT"},
            files={"file": ("invoice.png", sample_png_content, "image/png")},
            headers=AUTH_HEADERS,
        )
        assert response.status_code == 500
        assert "Qdrant" in response.json()["detail"] or "Failed to process document" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


