"""Unit tests proving guaranteed temporary file deletion upon success and error."""

import io
import os
import shutil
import pytest
from unittest.mock import patch
from fastapi import UploadFile
from app.core.exceptions import ProcessingException
from app.services.analysis_service import AnalysisService


REAL_COPYFILEOBJ = shutil.copyfileobj


@pytest.mark.asyncio
async def test_temporary_file_deleted_on_success(analysis_service, sample_pdf_content):
    """Verify temporary file is created and deleted after successful analysis."""
    created_temp_files = []

    def tracking_copyfileobj(fsrc, fdst, length=0):
        if hasattr(fdst, "name"):
            created_temp_files.append(fdst.name)
        if length:
            return REAL_COPYFILEOBJ(fsrc, fdst, length)
        return REAL_COPYFILEOBJ(fsrc, fdst)

    file_obj = io.BytesIO(sample_pdf_content)
    upload_file = UploadFile(filename="invoice.pdf", file=file_obj)

    with patch("shutil.copyfileobj", side_effect=tracking_copyfileobj):
        res = await analysis_service.analyze_document(upload_file, "INV-123")

    assert res.documentId == "INV-123"
    assert len(created_temp_files) == 1
    temp_path = created_temp_files[0]

    # PROOF: Temporary file MUST be deleted from disk
    assert not os.path.exists(temp_path), f"Temporary file '{temp_path}' was not deleted after success!"


@pytest.mark.asyncio
async def test_temporary_file_deleted_on_exception(analysis_service, sample_pdf_content):
    """Verify temporary file is deleted even if processing raises an unhandled exception."""
    created_temp_files = []

    def tracking_copyfileobj(fsrc, fdst, length=0):
        if hasattr(fdst, "name"):
            created_temp_files.append(fdst.name)
        if length:
            return REAL_COPYFILEOBJ(fsrc, fdst, length)
        return REAL_COPYFILEOBJ(fsrc, fdst)

    file_obj = io.BytesIO(sample_pdf_content)
    upload_file = UploadFile(filename="invoice.pdf", file=file_obj)

    # Force an exception inside analysis service after temp file creation by patching logger inside try block
    with patch("shutil.copyfileobj", side_effect=tracking_copyfileobj):
        with patch("app.services.analysis_service.logger.info", side_effect=[None, RuntimeError("Simulated processing crash")]):
            with pytest.raises(ProcessingException):
                await analysis_service.analyze_document(upload_file, "INV-999")

    assert len(created_temp_files) == 1
    temp_path = created_temp_files[0]

    # PROOF: Temporary file MUST be deleted from disk even after failure!
    assert not os.path.exists(temp_path), f"Temporary file '{temp_path}' was not deleted after exception!"
