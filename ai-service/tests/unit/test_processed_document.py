"""Unit tests for ProcessedDocument schema and models."""

from app.schemas.processed_document import (
    LayoutRegion,
    OCRRegion,
    PageData,
    ProcessedDocument,
)


def test_processed_document_model_serialization():
    """Verify ProcessedDocument schema model serialization."""
    layout = LayoutRegion(label="header", bbox=[10.0, 20.0, 100.0, 50.0], confidence=0.95, order=1)
    ocr = OCRRegion(text="MEDICAL INVOICE", bbox=[[10.0, 20.0], [100.0, 20.0], [100.0, 50.0], [10.0, 50.0]], confidence=0.98)

    page = PageData(
        page_number=1,
        width=1200,
        height=1600,
        text="MEDICAL INVOICE",
        ocr_regions=[ocr],
        layout_regions=[layout],
    )

    doc = ProcessedDocument(
        document_id="INV-999",
        pages=[page],
        metadata={"total_pages": 1, "format": ".pdf"},
    )

    data = doc.model_dump()
    assert data["document_id"] == "INV-999"
    assert len(data["pages"]) == 1
    assert data["pages"][0]["ocr_regions"][0]["text"] == "MEDICAL INVOICE"
    assert data["pages"][0]["layout_regions"][0]["label"] == "header"
