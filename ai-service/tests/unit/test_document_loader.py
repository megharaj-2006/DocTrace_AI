"""Unit tests for DocumentLoader component."""

import os
import tempfile
from PIL import Image
from app.document_processing.document_loader import DocumentLoader


def test_load_single_image_page():
    """Verify loading single image creates a page entry and temp file."""
    loader = DocumentLoader()

    # Create dummy PNG
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        path = tmp.name
        img = Image.new("RGB", (200, 300), color="white")
        img.save(path, format="PNG")

    try:
        pages, temp_files = loader.load_document_pages(path)
        assert len(pages) == 1
        assert pages[0][0] == 1  # 1-indexed page
        assert os.path.exists(pages[0][1])
    finally:
        os.remove(path)
        loader.cleanup_temp_files(temp_files)


def test_document_loader_temp_cleanup():
    """Verify cleanup_temp_files deletes created page images."""
    loader = DocumentLoader()
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        path = tmp.name

    assert os.path.exists(path)
    loader.cleanup_temp_files([path])
    assert not os.path.exists(path)
