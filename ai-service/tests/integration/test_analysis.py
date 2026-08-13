"""Integration tests for POST /api/v1/analyze endpoint."""

import io


def test_analyze_valid_multipart_input(client, sample_pdf_content):
    """Test POST /api/v1/analyze with valid file and documentId."""
    files = {"file": ("test_invoice.pdf", io.BytesIO(sample_pdf_content), "application/pdf")}
    data = {"documentId": "INV-123"}

    response = client.post("/api/v1/analyze", files=files, data=data)
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


def test_analyze_missing_file_rejected(client):
    """Test POST /api/v1/analyze fails when file is missing."""
    data = {"documentId": "INV-123"}
    response = client.post("/api/v1/analyze", data=data)
    assert response.status_code == 422


def test_analyze_missing_document_id_rejected(client, sample_pdf_content):
    """Test POST /api/v1/analyze fails when documentId is missing."""
    files = {"file": ("test_invoice.pdf", io.BytesIO(sample_pdf_content), "application/pdf")}
    response = client.post("/api/v1/analyze", files=files)
    assert response.status_code in [400, 422]


def test_analyze_empty_file_rejected(client):
    """Test POST /api/v1/analyze rejects empty (0-byte) file."""
    files = {"file": ("empty.pdf", io.BytesIO(b""), "application/pdf")}
    data = {"documentId": "INV-123"}

    response = client.post("/api/v1/analyze", files=files, data=data)
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()
