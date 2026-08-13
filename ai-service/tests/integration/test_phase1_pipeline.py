"""Integration test processing JPG, PNG, and PDF documents through DocumentProcessor."""

import io
import os
import tempfile
from PIL import Image
from app.document_processing.processor import DocumentProcessor


def test_document_processor_pipeline_png():
    """Test full DocumentProcessor pipeline with a PNG document image."""
    processor = DocumentProcessor()

    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        png_path = tmp.name
        img = Image.new("RGB", (600, 800), color="white")
        img.save(png_path, format="PNG")

    try:
        proc_doc = processor.process(png_path, "INV-PNG-001")
        assert proc_doc.document_id == "INV-PNG-001"
        assert len(proc_doc.pages) == 1
        assert proc_doc.pages[0].page_number == 1
        assert proc_doc.pages[0].width == 600
        assert proc_doc.pages[0].height == 800
        assert proc_doc.metadata["format"] == ".png"
    finally:
        os.remove(png_path)


def test_analyze_api_with_phase1_pipeline(client, sample_pdf_content):
    """Verify POST /api/v1/analyze invokes Phase 1 pipeline and retains response contract."""
    files = {"file": ("invoice.pdf", io.BytesIO(sample_pdf_content), "application/pdf")}
    data = {"documentId": "INV-PHASE1-100"}

    response = client.post("/api/v1/analyze", files=files, data=data)
    assert response.status_code == 200, response.text

    body = response.json()
    assert body["documentId"] == "INV-PHASE1-100"
    assert body["riskLevel"] in ["LOW", "AMBER", "RED"]
    assert isinstance(body["matchedDocuments"], list)
    assert isinstance(body["reasons"], list)
