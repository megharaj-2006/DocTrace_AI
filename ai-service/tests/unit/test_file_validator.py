"""Unit tests for FileValidator component."""

import os
import tempfile
import pytest
from app.core.exceptions import InvalidInputException
from app.document_processing.file_validator import FileValidator


def test_validator_valid_extensions():
    """Verify validator accepts supported extensions."""
    val = FileValidator()
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(b"%PDF-1.4 content")
        path = tmp.name

    try:
        ext = val.validate_file(path)
        assert ext == ".pdf"
    finally:
        os.remove(path)


def test_validator_unsupported_extension():
    """Verify validator rejects unsupported extensions."""
    val = FileValidator()
    with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as tmp:
        tmp.write(b"dummy text")
        path = tmp.name

    try:
        with pytest.raises(InvalidInputException) as exc_info:
            val.validate_file(path)
        assert "unsupported" in str(exc_info.value).lower()
    finally:
        os.remove(path)


def test_validator_empty_file():
    """Verify validator rejects empty 0-byte file."""
    val = FileValidator()
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        path = tmp.name

    try:
        with pytest.raises(InvalidInputException) as exc_info:
            val.validate_file(path)
        assert "empty" in str(exc_info.value).lower()
    finally:
        os.remove(path)


def test_validator_nonexistent_file():
    """Verify validator handles missing file path."""
    val = FileValidator()
    with pytest.raises(InvalidInputException):
        val.validate_file("/nonexistent/path/doc.jpg")
