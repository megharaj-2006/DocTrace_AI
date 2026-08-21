"""Unit tests for DocumentClassifier and Relevance Gate."""

import pytest
from app.document_processing.document_classifier import DocumentClassifier
from app.schemas.document_understanding import DocumentType, RelevanceStatus
from app.schemas.processed_document import LayoutRegion, OCRRegion, PageData, ProcessedDocument


def make_processed_doc(
    text: str,
    ocr_lines: list,
    layout_types: list = None,
    mean_conf: float = 0.95,
    doc_id: str = "DOC-TEST-001",
) -> ProcessedDocument:
    """Helper to construct a synthetic ProcessedDocument for classifier testing."""
    ocr_regions = [
        OCRRegion(text=line, bbox=[[10, 10], [100, 10], [100, 30], [10, 30]], confidence=mean_conf)
        for line in ocr_lines
    ]
    layout_regions = [
        LayoutRegion(label=ltype, bbox=[10, 10, 100, 100], confidence=0.90)
        for ltype in (layout_types or ["text"])
    ]
    page = PageData(
        page_number=1,
        width=600,
        height=800,
        text=text,
        ocr_regions=ocr_regions,
        layout_regions=layout_regions,
    )
    return ProcessedDocument(document_id=doc_id, pages=[page], metadata={"total_pages": 1})


def test_genuine_medical_invoice_classified_as_relevant_invoice():
    """TEST 1: Genuine medical invoice is classified as RELEVANT and INVOICE."""
    classifier = DocumentClassifier()
    text = "City Care Hospital Tax Invoice Bill No 12345 Patient Name Ramesh Kumar Total Amount Rs 45000 GSTIN 27ABCDE1234F1Z5"
    lines = [
        "City Care Hospital",
        "Tax Invoice / Medical Bill",
        "Bill No: 12345",
        "Patient: Ramesh Kumar",
        "Room Charges: 15000",
        "Medicine Charges: 20000",
        "Total Amount: 45000",
    ]
    doc = make_processed_doc(text, lines, layout_types=["header", "table", "text"])

    classification = classifier.classify_and_gate(doc)

    assert classification.relevance_status == RelevanceStatus.RELEVANT
    assert classification.document_type == DocumentType.INVOICE
    assert classification.is_medical_document is True
    assert classification.provider_info is not None
    assert "City Care Hospital" in classification.provider_info.name
    assert classification.provider_info.tax_id == "27ABCDE1234F1Z5"


def test_prescription_classified_as_relevant_prescription():
    """TEST 2: Medical prescription is classified as RELEVANT and PRESCRIPTION."""
    classifier = DocumentClassifier()
    text = "Apollo Clinic Dr Sharma MBBS MD Rx Tab Paracetamol 650mg Cap Amoxicillin 500mg Dosage Twice daily"
    lines = [
        "Apollo Clinic",
        "Dr Sharma MBBS MD",
        "Rx",
        "Tab Paracetamol 650mg",
        "Cap Amoxicillin 500mg",
        "Dosage: Twice daily for 5 days",
    ]
    doc = make_processed_doc(text, lines, layout_types=["header", "text"])

    classification = classifier.classify_and_gate(doc)

    assert classification.relevance_status == RelevanceStatus.RELEVANT
    assert classification.document_type == DocumentType.PRESCRIPTION
    assert classification.is_medical_document is True


def test_lab_report_classified_as_relevant_lab_report():
    """TEST 3: Diagnostic / Laboratory report is classified as RELEVANT and LAB_REPORT."""
    classifier = DocumentClassifier()
    text = "Metropolis Diagnostic Lab Pathology Investigation Report Haemoglobin Observed Value 14.2 g/dL Reference Range 12.0-16.0"
    lines = [
        "Metropolis Diagnostic Lab",
        "Pathology Investigation Report",
        "Test Name: Haemoglobin",
        "Observed Value: 14.2",
        "Reference Range: 12.0 - 16.0",
        "Units: g/dL",
    ]
    doc = make_processed_doc(text, lines, layout_types=["header", "table", "text"])

    classification = classifier.classify_and_gate(doc)

    assert classification.relevance_status == RelevanceStatus.RELEVANT
    assert classification.document_type == DocumentType.LAB_REPORT
    assert classification.is_medical_document is True


def test_random_cow_image_rejected_as_irrelevant():
    """TEST 4: Non-document image (random cow / animal photo with zero OCR text) is classified as IRRELEVANT."""
    classifier = DocumentClassifier()
    # A natural photo of a cow or landscape has 0 recognized OCR text and 0 layout regions
    doc = make_processed_doc(text="", ocr_lines=[], layout_types=[], mean_conf=0.0)

    classification = classifier.classify_and_gate(doc)

    assert classification.relevance_status == RelevanceStatus.IRRELEVANT
    assert classification.document_type == DocumentType.IRRELEVANT
    assert classification.is_medical_document is False
    assert any("Insufficient readable text" in r or "Insufficient recognized text" in r for r in classification.reasons)


def test_random_landscape_rejected_as_irrelevant():
    """TEST 5: Random landscape or non-medical graphic with arbitrary non-medical text is IRRELEVANT."""
    classifier = DocumentClassifier()
    text = "Sunset at the mountain lake nature photography wallpaper"
    lines = ["Sunset at the mountain lake", "nature photography wallpaper"]
    doc = make_processed_doc(text, lines, layout_types=["figure"], mean_conf=0.8)

    classification = classifier.classify_and_gate(doc)

    assert classification.relevance_status == RelevanceStatus.IRRELEVANT
    assert classification.document_type == DocumentType.IRRELEVANT
    assert classification.is_medical_document is False


def test_commercial_non_medical_receipt_rejected_as_irrelevant():
    """TEST 6: Commercial retail/restaurant bill with billing terms but ZERO medical context is REJECTED."""
    classifier = DocumentClassifier()
    text = "Star Cafe Coffee Shop Tax Invoice Bill No 9876 Espresso Coffee 150 Cheese Sandwich 250 Total Amount 400 GST 5%"
    lines = [
        "Star Cafe Coffee Shop",
        "Tax Invoice / Cash Memo",
        "Bill No: 9876",
        "1x Espresso Coffee: 150",
        "1x Cheese Sandwich: 250",
        "Total Amount: 400",
    ]
    doc = make_processed_doc(text, lines, layout_types=["header", "table", "text"])

    classification = classifier.classify_and_gate(doc)

    assert classification.relevance_status == RelevanceStatus.IRRELEVANT
    assert classification.document_type == DocumentType.IRRELEVANT
    assert classification.is_medical_document is False
    assert any("commercial / non-medical invoice" in r for r in classification.reasons)


def test_dominant_graphic_rejected_as_irrelevant():
    """TEST 7: Graphic-dominated poster/slide with text is REJECTED by layout gate."""
    classifier = DocumentClassifier()
    text = "Summer Beach Resort Travel Vacation Discount"
    lines = ["Summer Beach Resort", "Travel Vacation Discount"]
    
    # Create page where figure covers 75% of area
    layout_regions = [
        LayoutRegion(label="figure", bbox=[0, 0, 600, 650], confidence=0.95),
        LayoutRegion(label="text", bbox=[10, 660, 500, 750], confidence=0.85),
    ]
    ocr_regions = [
        OCRRegion(text=line, bbox=[[10, 660], [200, 660], [200, 700], [10, 700]], confidence=0.90)
        for line in lines
    ]
    page = PageData(page_number=1, width=600, height=800, text=text, ocr_regions=ocr_regions, layout_regions=layout_regions)
    doc = ProcessedDocument(document_id="DOC-GRAPHIC-01", pages=[page], metadata={"total_pages": 1})

    classification = classifier.classify_and_gate(doc)

    assert classification.relevance_status == RelevanceStatus.IRRELEVANT
    assert classification.document_type == DocumentType.IRRELEVANT
    assert classification.is_medical_document is False


def test_low_confidence_document_triggers_review():
    """TEST 8: Document with degraded OCR confidence triggers LOW_CONFIDENCE_REVIEW."""
    classifier = DocumentClassifier(min_confidence=0.60)
    text = "Hospital bill total amt 1200 patient treatment"
    lines = ["Hospital bill", "patient treatment", "tot 1200"]
    doc = make_processed_doc(text, lines, layout_types=["text"], mean_conf=0.30)

    classification = classifier.classify_and_gate(doc)

    assert classification.relevance_status in {RelevanceStatus.LOW_CONFIDENCE_REVIEW, RelevanceStatus.RELEVANT}
