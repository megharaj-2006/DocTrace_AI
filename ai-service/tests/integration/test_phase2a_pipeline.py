"""Integration test for combined Phase 1 + Phase 2A document intelligence & vector search pipeline."""

import pytest
from PIL import Image

from app.document_processing.processor import DocumentProcessor
from app.services.vector_intelligence_service import VectorIntelligenceService
from app.vector_store.mock import MockVectorStore


@pytest.mark.asyncio
async def test_end_to_end_phase1_and_phase2a_pipeline(sample_png_content, temp_dir):
    """Verify loading document via Phase 1 DocumentProcessor and executing Phase 2A vector similarity search."""
    import os

    temp_img_path = os.path.join(temp_dir, "sample_invoice.png")
    with open(temp_img_path, "wb") as f:
        f.write(sample_png_content)

    # 1. Phase 1 Document Processing
    processor = DocumentProcessor()
    processed_doc = processor.process(temp_img_path, "INV-E2E-001")

    assert processed_doc.document_id == "INV-E2E-001"
    assert len(processed_doc.pages) == 1

    # 2. Phase 2A Vector Intelligence Registration & Search Workflows
    vector_store = MockVectorStore()
    vi_service = VectorIntelligenceService(vector_store=vector_store)

    # Register target page
    with Image.open(temp_img_path) as img:
        await vi_service.register_page_embedding(
            image_input=img,
            document_id="REF-INV-001",
            page_number=1,
        )

        # Search query page (excluding query document ID)
        evidence = await vi_service.analyze_page_similarity(
            image_input=img,
            document_id="QUERY-INV-001",
            page_number=1,
            top_k=5,
            exclude_self=True,
        )

    assert evidence.query_document_id == "QUERY-INV-001"
    assert len(evidence.matches) == 1
    assert evidence.matches[0].document_id == "REF-INV-001"
    assert evidence.matches[0].similarity_score > 0.95
    assert evidence.matches[0].above_threshold is True
