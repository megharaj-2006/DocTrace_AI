"""Unit tests for StructuralFingerprintService (128-D structural layout fingerprinting)."""

import numpy as np
import pytest

from app.schemas.processed_document import LayoutRegion, OCRRegion, PageData
from app.schemas.structural import NormalizedPageTemplate
from app.services.fingerprint_service import StructuralFingerprintService
from app.services.template_extraction_service import TemplateExtractionService


def cosine_sim(v1: list, v2: list) -> float:
    """Compute cosine similarity between two float vectors."""
    a = np.array(v1, dtype=np.float32)
    b = np.array(v2, dtype=np.float32)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def make_sample_page(
    patient_name: str = "Ramesh Kumar",
    amount: str = "45000",
    inv_no: str = "INV-001",
    width: int = 600,
    height: int = 800,
    layout_type: str = "standard_invoice",
) -> PageData:
    """Construct PageData with specific variable content and resolution."""
    scale_x = width / 600.0
    scale_y = height / 800.0

    if layout_type == "standard_invoice":
        ocr_regions = [
            OCRRegion(text="City Hospital", bbox=[[50 * scale_x, 30 * scale_y], [300 * scale_x, 30 * scale_y], [300 * scale_x, 70 * scale_y], [50 * scale_x, 70 * scale_y]], confidence=0.95),
            OCRRegion(text=f"Invoice No: {inv_no}", bbox=[[400 * scale_x, 40 * scale_y], [550 * scale_x, 40 * scale_y], [550 * scale_x, 70 * scale_y], [400 * scale_x, 70 * scale_y]], confidence=0.95),
            OCRRegion(text=f"Patient Name: {patient_name}", bbox=[[50 * scale_x, 120 * scale_y], [300 * scale_x, 120 * scale_y], [300 * scale_x, 150 * scale_y], [50 * scale_x, 150 * scale_y]], confidence=0.95),
            OCRRegion(text="Date: 2026-08-19", bbox=[[400 * scale_x, 120 * scale_y], [550 * scale_x, 120 * scale_y], [550 * scale_x, 150 * scale_y], [400 * scale_x, 150 * scale_y]], confidence=0.95),
            OCRRegion(text="Room Charges", bbox=[[50 * scale_x, 250 * scale_y], [250 * scale_x, 250 * scale_y], [250 * scale_x, 280 * scale_y], [50 * scale_x, 280 * scale_y]], confidence=0.95),
            OCRRegion(text="Medicine Fee", bbox=[[50 * scale_x, 300 * scale_y], [250 * scale_x, 300 * scale_y], [250 * scale_x, 330 * scale_y], [50 * scale_x, 330 * scale_y]], confidence=0.95),
            OCRRegion(text=f"Total Amount: Rs {amount}", bbox=[[350 * scale_x, 600 * scale_y], [550 * scale_x, 600 * scale_y], [550 * scale_x, 640 * scale_y], [350 * scale_x, 640 * scale_y]], confidence=0.95),
        ]
        layout_regions = [
            LayoutRegion(label="header", bbox=[40 * scale_x, 20 * scale_y, 560 * scale_x, 90 * scale_y], confidence=0.95),
            LayoutRegion(label="form", bbox=[40 * scale_x, 110 * scale_y, 560 * scale_x, 180 * scale_y], confidence=0.90),
            LayoutRegion(label="table", bbox=[40 * scale_x, 220 * scale_y, 560 * scale_x, 550 * scale_y], confidence=0.92),
            LayoutRegion(label="footer", bbox=[40 * scale_x, 580 * scale_y, 560 * scale_x, 680 * scale_y], confidence=0.88),
        ]
    else:
        # Radically different layout: 2-column prescription without table
        ocr_regions = [
            OCRRegion(text="Dr Sharma Clinic", bbox=[[200 * scale_x, 40 * scale_y], [450 * scale_x, 40 * scale_y], [450 * scale_x, 80 * scale_y], [200 * scale_x, 80 * scale_y]], confidence=0.95),
            OCRRegion(text="Rx Tab Paracetamol", bbox=[[50 * scale_x, 300 * scale_y], [280 * scale_x, 300 * scale_y], [280 * scale_x, 350 * scale_y], [50 * scale_x, 350 * scale_y]], confidence=0.95),
            OCRRegion(text="Dosage 1-0-1", bbox=[[320 * scale_x, 300 * scale_y], [550 * scale_x, 300 * scale_y], [550 * scale_x, 350 * scale_y], [320 * scale_x, 350 * scale_y]], confidence=0.95),
        ]
        layout_regions = [
            LayoutRegion(label="header", bbox=[180 * scale_x, 30 * scale_y, 480 * scale_x, 100 * scale_y], confidence=0.90),
            LayoutRegion(label="text", bbox=[40 * scale_x, 250 * scale_y, 560 * scale_x, 500 * scale_y], confidence=0.85),
        ]

    return PageData(
        page_number=1,
        width=width,
        height=height,
        text=" ".join(r.text for r in ocr_regions),
        ocr_regions=ocr_regions,
        layout_regions=layout_regions,
    )


def test_structural_fingerprint_dimension_and_normalization():
    """TEST 11/12: Structural fingerprint is exactly 128 dimensions and L2-normalized."""
    extractor = TemplateExtractionService()
    service = StructuralFingerprintService()

    page = make_sample_page()
    template = extractor.extract_page_template(page)
    emb = service.generate_structural_embedding(template, "INV-STRUCT-001")

    assert emb.dimension == 128
    assert len(emb.vector) == 128
    norm = np.linalg.norm(np.array(emb.vector))
    assert pytest.approx(norm, rel=1e-4) == 1.0


def test_same_template_different_patient_remains_structurally_similar():
    """TEST 15: Documents sharing the same template with different patient data yield high structural similarity."""
    extractor = TemplateExtractionService()
    service = StructuralFingerprintService()

    # Document A: Patient Ramesh Kumar, Rs 45000, INV-001
    page_a = make_sample_page(patient_name="Ramesh Kumar", amount="45000", inv_no="INV-001")
    template_a = extractor.extract_page_template(page_a)
    emb_a = service.generate_structural_embedding(template_a, "INV-DOC-A")

    # Document B: Patient Sunita Sharma, Rs 92000, INV-987
    page_b = make_sample_page(patient_name="Sunita Sharma", amount="92000", inv_no="INV-987")
    template_b = extractor.extract_page_template(page_b)
    emb_b = service.generate_structural_embedding(template_b, "INV-DOC-B")

    similarity = cosine_sim(emb_a.vector, emb_b.vector)
    assert similarity > 0.95, f"Expected high structural similarity for same template, got {similarity:.4f}"


def test_resolution_invariance():
    """TEST 16: Same template layout rendered at 600x800 vs 1200x1600 produces identical/high similarity."""
    extractor = TemplateExtractionService()
    service = StructuralFingerprintService()

    page_low_res = make_sample_page(width=600, height=800)
    template_low_res = extractor.extract_page_template(page_low_res)
    emb_low = service.generate_structural_embedding(template_low_res, "INV-LOW-RES")

    page_high_res = make_sample_page(width=1200, height=1600)
    template_high_res = extractor.extract_page_template(page_high_res)
    emb_high = service.generate_structural_embedding(template_high_res, "INV-HIGH-RES")

    similarity = cosine_sim(emb_low.vector, emb_high.vector)
    assert similarity > 0.98, f"Expected resolution invariance (>0.98), got {similarity:.4f}"


def test_different_layout_produces_lower_similarity():
    """TEST 17: Distinct document layouts produce significantly lower structural similarity."""
    extractor = TemplateExtractionService()
    service = StructuralFingerprintService()

    page_inv = make_sample_page(layout_type="standard_invoice")
    tpl_inv = extractor.extract_page_template(page_inv)
    emb_inv = service.generate_structural_embedding(tpl_inv, "INV-TABLE")

    page_rx = make_sample_page(layout_type="prescription_clinic")
    tpl_rx = extractor.extract_page_template(page_rx)
    emb_rx = service.generate_structural_embedding(tpl_rx, "INV-RX")

    similarity = cosine_sim(emb_inv.vector, emb_rx.vector)
    assert similarity < 0.70, f"Expected lower similarity for distinct layouts, got {similarity:.4f}"
