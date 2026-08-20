"""End-to-end integration tests for the multi-signal AI pipeline and relevance gating protection."""

import io
import pytest
from PIL import Image, ImageDraw

from app.schemas.analysis import AnalysisResponse
from app.services.analysis_service import AnalysisService
from app.vector_store.mock import MockVectorStore


def create_invoice_image_bytes(hospital_name: str = "City Care Hospital", amount: str = "45000") -> bytes:
    """Generate a realistic synthetic medical invoice PNG with clear text and table layout."""
    img = Image.new("RGB", (600, 800), color="white")
    draw = ImageDraw.Draw(img)

    # Header section
    draw.rectangle([40, 20, 560, 80], outline="black", width=2)
    draw.text((60, 35), f"{hospital_name} - Tax Invoice", fill="black")

    # Patient & Meta Section
    draw.rectangle([40, 100, 560, 180], outline="black", width=1)
    draw.text((60, 115), "Patient Name: Ramesh Kumar", fill="black")
    draw.text((350, 115), "Bill No: INV-2026-001", fill="black")
    draw.text((60, 145), "Date: 19-08-2026", fill="black")
    draw.text((350, 145), "Doctor: Dr A Sharma", fill="black")

    # Table section
    draw.rectangle([40, 200, 560, 550], outline="black", width=2)
    draw.line([40, 240, 560, 240], fill="black", width=2)
    draw.text((60, 215), "Description", fill="black")
    draw.text((450, 215), "Amount (INR)", fill="black")
    draw.text((60, 260), "ICU Bed Charges", fill="black")
    draw.text((450, 260), "25,000", fill="black")
    draw.text((60, 300), "Surgical Fees", fill="black")
    draw.text((450, 300), "15,000", fill="black")
    draw.text((60, 340), "Pharmacy Medicine", fill="black")
    draw.text((450, 340), "5,000", fill="black")

    # Total Footer
    draw.rectangle([40, 570, 560, 640], outline="black", width=1)
    draw.text((60, 590), f"Total Net Payable: INR {amount}", fill="black")
    draw.text((60, 615), "GSTIN: 27ABCDE1234F1Z5", fill="black")

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def create_cow_image_bytes() -> bytes:
    """Generate a blank/photo-like non-document image representing a random animal or photo."""
    img = Image.new("RGB", (400, 400), color=(139, 195, 74))  # Green pasture color
    draw = ImageDraw.Draw(img)
    # Draw simple landscape/animal shapes with NO text
    draw.ellipse([100, 100, 300, 250], fill=(245, 245, 245), outline=(50, 50, 50))  # Cow body
    draw.ellipse([70, 120, 120, 180], fill=(245, 245, 245), outline=(50, 50, 50))   # Cow head
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@pytest.mark.asyncio
async def test_irrelevant_cow_image_protection_and_corpus_isolation(client, mock_vector_store):
    """TEST 7/8/9/16: Irrelevant image is rejected, does NOT enter Qdrant, and uploading twice NEVER becomes RED."""
    headers = {"X-Internal-API-Key": "dev-internal-secret-key-12345"}
    cow_bytes = create_cow_image_bytes()

    # Upload 1: Random cow image
    files_1 = {"file": ("cow_image_1.png", io.BytesIO(cow_bytes), "image/png")}
    data_1 = {"documentId": "COW-IMG-001"}

    resp_1 = client.post("/api/v1/analyze", files=files_1, data=data_1, headers=headers)
    assert resp_1.status_code == 200, resp_1.text
    body_1 = resp_1.json()

    assert body_1["documentId"] == "COW-IMG-001"
    assert body_1["fraudScore"] == 0.0
    assert body_1["riskLevel"] == "LOW"
    assert body_1["confidence"] == 0.0
    assert len(body_1["matchedDocuments"]) == 0
    assert any("irrelevant" in r.lower() or "rejected" in r.lower() for r in body_1["reasons"])

    # PROOF: Irrelevant document MUST NOT exist in vector store
    assert "COW-IMG-001:1" not in mock_vector_store._page_store
    assert "COW-IMG-001:1" not in mock_vector_store._structural_store

    # Upload 2: Upload the EXACT SAME cow image again tomorrow
    files_2 = {"file": ("cow_image_2.png", io.BytesIO(cow_bytes), "image/png")}
    data_2 = {"documentId": "COW-IMG-002"}

    resp_2 = client.post("/api/v1/analyze", files=files_2, data=data_2, headers=headers)
    assert resp_2.status_code == 200, resp_2.text
    body_2 = resp_2.json()

    # PROOF: Must NOT become RED, must still be LOW with matchedDocuments = []
    assert body_2["documentId"] == "COW-IMG-002"
    assert body_2["fraudScore"] == 0.0
    assert body_2["riskLevel"] == "LOW"
    assert len(body_2["matchedDocuments"]) == 0
    assert any("irrelevant" in r.lower() or "rejected" in r.lower() for r in body_2["reasons"])


@pytest.mark.asyncio
async def test_relevant_invoice_analysis_and_matching(client, mock_vector_store):
    """TEST 10/18/19/20: Relevant invoice passes relevance gate, registers in Qdrant, and second invoice matches it."""
    from unittest.mock import patch
    from app.schemas.document_understanding import DocumentClassification, DocumentType, RelevanceStatus, ProviderInfo
    from app.document_processing.document_classifier import DocumentClassifier

    headers = {"X-Internal-API-Key": "dev-internal-secret-key-12345"}
    invoice_bytes_1 = create_invoice_image_bytes(hospital_name="Apex Hospital", amount="35000")

    mock_classification = DocumentClassification(
        relevance_status=RelevanceStatus.RELEVANT,
        document_type=DocumentType.INVOICE,
        confidence=0.98,
        provider=ProviderInfo(
            name="Apex Hospital",
            normalized_name="APEX HOSPITAL",
            phone="9876543210",
            tax_id="27ABCDE1234F1Z5",
        ),
        page_count=1,
    )

    with patch.object(DocumentClassifier, "classify_and_gate", return_value=mock_classification):
        # Document 1: Initial upload of Apex Hospital invoice (empty corpus)
        files_1 = {"file": ("invoice_apex_1.png", io.BytesIO(invoice_bytes_1), "image/png")}
        data_1 = {"documentId": "INV-APEX-001"}

        resp_1 = client.post("/api/v1/analyze", files=files_1, data=data_1, headers=headers)
        assert resp_1.status_code == 200, resp_1.text
        body_1 = resp_1.json()

        assert body_1["documentId"] == "INV-APEX-001"
        assert body_1["riskLevel"] == "LOW"
        assert len(body_1["matchedDocuments"]) == 0  # Corpus was empty before analysis

        # PROOF: Relevant document DOES enter vector store
        assert "INV-APEX-001:1" in mock_vector_store._page_store
        assert "INV-APEX-001:1" in mock_vector_store._structural_store

        # Document 2: Second invoice on identical template
        invoice_bytes_2 = create_invoice_image_bytes(hospital_name="Apex Hospital", amount="78000")
        files_2 = {"file": ("invoice_apex_2.png", io.BytesIO(invoice_bytes_2), "image/png")}
        data_2 = {"documentId": "INV-APEX-002"}

        resp_2 = client.post("/api/v1/analyze", files=files_2, data=data_2, headers=headers)
        assert resp_2.status_code == 200, resp_2.text
        body_2 = resp_2.json()

        assert body_2["documentId"] == "INV-APEX-002"
        # Document 2 must find Document 1 in corpus
        assert len(body_2["matchedDocuments"]) >= 1
        top_match = body_2["matchedDocuments"][0]
        assert top_match["documentId"] == "INV-APEX-001"
        assert top_match["similarity"] > 0.80

        # Self-exclusion proof: Document 2 must not match itself
        matched_ids = [m["documentId"] for m in body_2["matchedDocuments"]]
        assert "INV-APEX-002" not in matched_ids


def create_prescription_image_bytes(doctor_name: str = "Dr. S K Gupta", clinic_name: str = "Apollo Health Clinic") -> bytes:
    """Generate a synthetic medical prescription PNG with clinical medication text."""
    img = Image.new("RGB", (600, 800), color="white")
    draw = ImageDraw.Draw(img)
    draw.rectangle([40, 20, 560, 80], outline="black", width=2)
    draw.text((60, 35), f"{clinic_name} - Prescription", fill="black")
    draw.text((60, 100), f"Doctor: {doctor_name}, MD (Physician)", fill="black")
    draw.text((60, 130), "Patient Name: Amit Verma (Age: 35, Male)", fill="black")
    draw.text((60, 170), "Rx / Medication Prescribed:", fill="black")
    draw.text((60, 200), "1. Tab Paracetamol 650mg - 1-0-1 after meals (5 days)", fill="black")
    draw.text((60, 230), "2. Cap Amoxicillin 500mg - 1-0-1 after meals (7 days)", fill="black")
    draw.text((60, 260), "3. Syrup Cough Relief 10ml - thrice daily (5 days)", fill="black")
    draw.text((60, 310), "Diagnosis: Acute Bronchitis. Review after 1 week.", fill="black")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def create_lab_report_image_bytes(lab_name: str = "Metropolis Diagnostics") -> bytes:
    """Generate a synthetic laboratory diagnostic report PNG with test results."""
    img = Image.new("RGB", (600, 800), color="white")
    draw = ImageDraw.Draw(img)
    draw.rectangle([40, 20, 560, 80], outline="black", width=2)
    draw.text((60, 35), f"{lab_name} - Pathology Laboratory", fill="black")
    draw.text((60, 100), "Investigation: Complete Blood Count (CBC)", fill="black")
    draw.text((60, 130), "Patient Name: Sunita Patel (Age: 42, Female)", fill="black")
    draw.rectangle([40, 170, 560, 350], outline="black", width=1)
    draw.text((60, 185), "Test Name          Observed Value     Reference Range    Units", fill="black")
    draw.text((60, 215), "Haemoglobin        13.5               12.0 - 15.5        g/dL", fill="black")
    draw.text((60, 245), "WBC Total Count    7,200              4,000 - 11,000     /cumm", fill="black")
    draw.text((60, 275), "Platelet Count     250,000            150,000 - 450,000  /cumm", fill="black")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@pytest.mark.asyncio
async def test_cross_document_type_isolation_and_filtering(client, mock_vector_store):
    """TEST 10: Verify Invoice, Prescription, and Lab Report are partitioned and do not cross-match."""
    headers = {"X-Internal-API-Key": "dev-internal-secret-key-12345"}

    # 1. Upload Invoice 1
    inv_bytes = create_invoice_image_bytes(hospital_name="City Hospital", amount="50000")
    files_inv = {"file": ("invoice.png", io.BytesIO(inv_bytes), "image/png")}
    resp_inv = client.post("/api/v1/analyze", files=files_inv, data={"documentId": "DOC-INVOICE-001"}, headers=headers)
    assert resp_inv.status_code == 200

    # 2. Upload Prescription 1
    rx_bytes = create_prescription_image_bytes(clinic_name="City Hospital Clinic")
    files_rx = {"file": ("rx.png", io.BytesIO(rx_bytes), "image/png")}
    resp_rx = client.post("/api/v1/analyze", files=files_rx, data={"documentId": "DOC-RX-001"}, headers=headers)
    assert resp_rx.status_code == 200

    # 3. Upload Lab Report 1
    lab_bytes = create_lab_report_image_bytes(lab_name="City Hospital Lab")
    files_lab = {"file": ("lab.png", io.BytesIO(lab_bytes), "image/png")}
    resp_lab = client.post("/api/v1/analyze", files=files_lab, data={"documentId": "DOC-LAB-001"}, headers=headers)
    assert resp_lab.status_code == 200

    # 4. Upload Invoice 2 (should only match Invoice 1, NOT Rx or Lab Report)
    inv_bytes_2 = create_invoice_image_bytes(hospital_name="City Hospital", amount="75000")
    files_inv_2 = {"file": ("invoice2.png", io.BytesIO(inv_bytes_2), "image/png")}
    resp_inv_2 = client.post("/api/v1/analyze", files=files_inv_2, data={"documentId": "DOC-INVOICE-002"}, headers=headers)
    assert resp_inv_2.status_code == 200
    body_inv_2 = resp_inv_2.json()

    matched_ids = [m["documentId"] for m in body_inv_2["matchedDocuments"]]
    assert "DOC-INVOICE-001" in matched_ids
    assert "DOC-RX-001" not in matched_ids, "Invoice must NOT match Prescription"
    assert "DOC-LAB-001" not in matched_ids, "Invoice must NOT match Lab Report"

