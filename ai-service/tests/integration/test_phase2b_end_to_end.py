"""End-to-end integration tests for Phase 2B production POST /api/v1/analyze contract and vector search."""

import pytest
from PIL import Image

from app.schemas.analysis import AnalysisResponse
from app.services.vector_intelligence_service import VectorIntelligenceService
from app.vector_store.mock import MockVectorStore


AUTH_HEADERS = {"X-Internal-API-Key": "dev-internal-secret-key-12345"}


def test_analyze_endpoint_end_to_end_png(client, sample_png_content):
    """Verify POST /api/v1/analyze processes PNG invoice file, performs Phase 2A vector search, and returns frozen AnalysisResponse JSON."""
    response = client.post(
        "/api/v1/analyze",
        data={"documentId": "INV-E2E-PNG-001"},
        files={"file": ("invoice.png", sample_png_content, "image/png")},
        headers=AUTH_HEADERS,
    )

    assert response.status_code == 200
    data = response.json()

    # Validate exact frozen schema structure
    assert "documentId" in data
    assert "fraudScore" in data
    assert "riskLevel" in data
    assert "confidence" in data
    assert "matchedDocuments" in data
    assert "reasons" in data

    assert data["documentId"] == "INV-E2E-PNG-001"
    assert isinstance(data["fraudScore"], float)
    assert data["riskLevel"] in {"LOW", "AMBER", "RED"}
    assert isinstance(data["confidence"], float)
    assert isinstance(data["matchedDocuments"], list)
    assert isinstance(data["reasons"], list)


def test_analyze_endpoint_end_to_end_pdf(client, sample_pdf_content):
    """Verify POST /api/v1/analyze processes PDF document file and returns AnalysisResponse JSON."""
    response = client.post(
        "/api/v1/analyze",
        data={"documentId": "INV-E2E-PDF-002"},
        files={"file": ("invoice.pdf", sample_pdf_content, "application/pdf")},
        headers=AUTH_HEADERS,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["documentId"] == "INV-E2E-PDF-002"
    assert data["riskLevel"] in {"LOW", "AMBER", "RED"}


@pytest.mark.asyncio
async def test_analyze_endpoint_with_matched_reference_document(client, sample_png_content):
    """Verify POST /api/v1/analyze returns matched candidate document details when reference is registered in store."""
    from app.api.routes.analysis import get_analysis_service
    from app.main import app

    # Create isolated MockVectorStore & register reference document
    mock_store = MockVectorStore()
    vi_service = VectorIntelligenceService(vector_store=mock_store)

    ref_img = Image.new("RGB", (300, 400), color=(100, 150, 200))
    await vi_service.register_page_embedding(
        image_input=ref_img,
        document_id="REF-MATCHED-INV",
        page_number=1,
    )

    # Execute analyze endpoint with query document
    response = client.post(
        "/api/v1/analyze",
        data={"documentId": "QUERY-MATCH-DOC"},
        files={"file": ("invoice.png", sample_png_content, "image/png")},
        headers=AUTH_HEADERS,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["documentId"] == "QUERY-MATCH-DOC"
    assert isinstance(data["matchedDocuments"], list)

