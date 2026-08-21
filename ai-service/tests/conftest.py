"""Pytest fixtures for unit and integration testing."""

import io
import tempfile
import pytest
from fastapi.testclient import TestClient
from PIL import Image

try:
    import pypdfium2 as pdfium
except ImportError:
    pdfium = None

from app.main import app
from app.services.analysis_service import AnalysisService
from app.vector_store.mock import MockVectorStore


@pytest.fixture(autouse=True)
def setup_test_dependency_overrides(mock_vector_store):
    """Automatically override AnalysisService with MockVectorStore for all tests to isolate from external vector DBs."""
    from app.api.routes.analysis import get_analysis_service
    app.dependency_overrides[get_analysis_service] = lambda: AnalysisService(vector_store=mock_vector_store)
    yield mock_vector_store
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    """FastAPI TestClient fixture."""
    with TestClient(app) as c:
        yield c


@pytest.fixture
def mock_vector_store():
    """MockVectorStore fixture."""
    return MockVectorStore()


@pytest.fixture
def analysis_service(mock_vector_store):
    """AnalysisService fixture initialized with MockVectorStore."""
    return AnalysisService(vector_store=mock_vector_store)


@pytest.fixture
def sample_pdf_content():
    """Valid minimal 1-page PDF binary fixture generated via pypdfium2."""
    if pdfium is not None:
        pdf = pdfium.PdfDocument.new()
        pdf.new_page(600, 800)
        buf = io.BytesIO()
        pdf.save(buf)
        pdf.close()
        return buf.getvalue()
    else:
        return b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 600 800]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000102 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n162\n%%EOF"


@pytest.fixture
def sample_png_content():
    """Valid PNG image content fixture with medical invoice layout."""
    from PIL import ImageDraw
    img = Image.new("RGB", (600, 800), color="white")
    draw = ImageDraw.Draw(img)
    draw.text((50, 40), "City Care Hospital - Tax Invoice", fill="black")
    draw.text((50, 100), "Patient Name: Ramesh Kumar", fill="black")
    draw.text((50, 130), "Invoice No: INV-2026-001", fill="black")
    draw.text((50, 160), "Date: 19-08-2026", fill="black")
    draw.text((50, 250), "Room Charges: INR 15,000", fill="black")
    draw.text((50, 300), "Medicine Charges: INR 20,000", fill="black")
    draw.text((50, 600), "Total Amount: INR 35,000", fill="black")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture
def temp_dir():
    """Isolated temporary directory fixture."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield tmpdir

