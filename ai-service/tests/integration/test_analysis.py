"""Integration tests for POST /api/v1/analyze endpoint."""

import io


def test_analyze_valid_multipart_input(client, sample_pdf_content):
    """Test POST /api/v1/analyze with valid file, documentId, and valid X-Internal-API-Key."""
    files = {"file": ("test_invoice.pdf", io.BytesIO(sample_pdf_content), "application/pdf")}
    data = {"documentId": "INV-123"}
    headers = {"X-Internal-API-Key": "dev-internal-secret-key-12345"}

    response = client.post("/api/v1/analyze", files=files, data=data, headers=headers)
    assert response.status_code == 200, response.text

    body = response.json()
    assert body["documentId"] == "INV-123"
    assert isinstance(body["fraudScore"], float)
    assert body["riskLevel"] in ["LOW", "AMBER", "RED"]
    assert isinstance(body["confidence"], float)
    assert isinstance(body["matchedDocuments"], list)
    assert isinstance(body["reasons"], list)

    # Check matched document fields match frozen schema
    if body["matchedDocuments"]:
        match = body["matchedDocuments"][0]
        assert "documentId" in match
        assert "similarity" in match


def test_analyze_unauthorized_rejected(client, sample_pdf_content):
    """Test POST /api/v1/analyze fails with 401 when X-Internal-API-Key header is missing or wrong."""
    files = {"file": ("test_invoice.pdf", io.BytesIO(sample_pdf_content), "application/pdf")}
    data = {"documentId": "INV-123"}

    response = client.post("/api/v1/analyze", files=files, data=data)
    assert response.status_code == 401

    headers = {"X-Internal-API-Key": "wrong-key"}
    response = client.post("/api/v1/analyze", files=files, data=data, headers=headers)
    assert response.status_code == 401


def test_analyze_missing_file_rejected(client):
    """Test POST /api/v1/analyze fails when file is missing."""
    data = {"documentId": "INV-123"}
    headers = {"X-Internal-API-Key": "dev-internal-secret-key-12345"}
    response = client.post("/api/v1/analyze", data=data, headers=headers)
    assert response.status_code == 422


def test_analyze_missing_document_id_rejected(client, sample_pdf_content):
    """Test POST /api/v1/analyze fails when documentId is missing."""
    files = {"file": ("test_invoice.pdf", io.BytesIO(sample_pdf_content), "application/pdf")}
    headers = {"X-Internal-API-Key": "dev-internal-secret-key-12345"}
    response = client.post("/api/v1/analyze", files=files, headers=headers)
    assert response.status_code in [400, 422]


def test_analyze_empty_file_rejected(client):
    """Test POST /api/v1/analyze rejects empty (0-byte) file."""
    files = {"file": ("empty.pdf", io.BytesIO(b""), "application/pdf")}
    data = {"documentId": "INV-123"}
    headers = {"X-Internal-API-Key": "dev-internal-secret-key-12345"}

    response = client.post("/api/v1/analyze", files=files, data=data, headers=headers)
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_analyze_corrupted_image_returns_400(client):
    """TASK 1: Verify corrupted image file input returns HTTP 400 Bad Request."""
    corrupted_bytes = b"NOT_A_REAL_IMAGE_DATA_12345_CORRUPTED"
    files = {"file": ("corrupted.png", io.BytesIO(corrupted_bytes), "image/png")}
    data = {"documentId": "INV-CORRUPT-001"}
    headers = {"X-Internal-API-Key": "dev-internal-secret-key-12345"}

    response = client.post("/api/v1/analyze", files=files, data=data, headers=headers)
    assert response.status_code == 400
    assert "corrupted" in response.json()["detail"].lower() or "failed to open" in response.json()["detail"].lower()


def test_analyze_auth_production_default_key_rejected(client, sample_pdf_content, monkeypatch):
    """TASK 2: Verify production mode rejects default development API key."""
    from app.core.config import settings
    monkeypatch.setattr(settings, "APP_ENV", "production")
    monkeypatch.setattr(settings, "INTERNAL_API_KEY", "dev-internal-secret-key-12345")

    files = {"file": ("test.pdf", io.BytesIO(sample_pdf_content), "application/pdf")}
    data = {"documentId": "INV-PROD-001"}
    headers = {"X-Internal-API-Key": "dev-internal-secret-key-12345"}

    response = client.post("/api/v1/analyze", files=files, data=data, headers=headers)
    assert response.status_code == 500
    assert "unconfigured" in response.json()["detail"].lower()


def test_analyze_qdrant_failure_sanitized_500(client, sample_pdf_content):
    """TASK 3: Verify Qdrant connection failure returns HTTP 500 without stack trace leak."""
    from unittest.mock import patch, MagicMock
    from app.core.exceptions import ProcessingException
    from app.schemas.document_understanding import DocumentClassification, DocumentType, RelevanceStatus

    rel_mock = MagicMock(
        return_value=DocumentClassification(
            relevance_status=RelevanceStatus.RELEVANT,
            document_type=DocumentType.INVOICE,
            confidence=0.95,
            keywords_detected=["invoice", "total"],
            reasons=["Valid test medical invoice"],
        )
    )

    with patch("app.document_processing.document_classifier.DocumentClassifier.classify_and_gate", rel_mock):
        with patch("app.vector_store.mock.MockVectorStore.search_nearest_pages", side_effect=ProcessingException("Qdrant connection refused")):
            files = {"file": ("test.pdf", io.BytesIO(sample_pdf_content), "application/pdf")}
            data = {"documentId": "INV-QDRANT-FAIL-001"}
            headers = {"X-Internal-API-Key": "dev-internal-secret-key-12345"}

            response = client.post("/api/v1/analyze", files=files, data=data, headers=headers)
            assert response.status_code == 500
            data_json = response.json()
            assert "detail" in data_json
            assert "Traceback" not in data_json["detail"]
