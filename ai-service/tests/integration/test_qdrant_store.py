"""Integration tests for VectorStore page search, upsert, self-match exclusion, and idempotent registration."""

import pytest
import numpy as np
from PIL import Image

from app.schemas.embedding import PageEmbedding
from app.services.embedding_service import EmbeddingService
from app.services.vector_intelligence_service import VectorIntelligenceService
from app.vector_store.mock import MockVectorStore


@pytest.mark.asyncio
async def test_vector_store_upsert_and_search():
    """Verify upserting page embeddings and executing nearest neighbor search returns correct matches."""
    vector_store = MockVectorStore()
    embedding_service = EmbeddingService()

    img1 = Image.new("RGB", (200, 200), color="red")
    img2 = Image.new("RGB", (200, 200), color="blue")

    emb1 = embedding_service.generate_page_embedding(img1, "DOC-RED", 1)
    emb2 = embedding_service.generate_page_embedding(img2, "DOC-BLUE", 1)

    await vector_store.upsert_page_embedding(emb1)
    await vector_store.upsert_page_embedding(emb2)

    matches = await vector_store.search_nearest_pages(
        query_vector=emb1.vector,
        top_k=2,
    )

    assert len(matches) == 2
    assert matches[0].document_id == "DOC-RED"
    assert pytest.approx(matches[0].similarity_score, abs=1e-4) == 1.0


@pytest.mark.asyncio
async def test_self_match_prevention_filter():
    """Verify passing exclude_document_id prevents the query document from matching itself."""
    vector_store = MockVectorStore()
    embedding_service = EmbeddingService()

    img = Image.new("RGB", (200, 200), color="yellow")

    emb_target = embedding_service.generate_page_embedding(img, "QUERY-DOC", 1)
    emb_other = embedding_service.generate_page_embedding(img, "OTHER-DOC", 1)

    await vector_store.upsert_page_embedding(emb_target)
    await vector_store.upsert_page_embedding(emb_other)

    # Search with self-match exclusion filter
    matches = await vector_store.search_nearest_pages(
        query_vector=emb_target.vector,
        top_k=5,
        exclude_document_id="QUERY-DOC",
    )

    assert len(matches) == 1
    assert matches[0].document_id == "OTHER-DOC"
    assert not any(m.document_id == "QUERY-DOC" for m in matches)


@pytest.mark.asyncio
async def test_search_and_registration_workflows_independence():
    """Verify VectorIntelligenceService keeps search/analysis and registration workflows distinct.

    Analysis does NOT auto-register embeddings into vector store.
    """
    vector_store = MockVectorStore()
    vi_service = VectorIntelligenceService(vector_store=vector_store)
    img = Image.new("RGB", (200, 200), color="green")

    # 1. Search workflow on new document
    evidence = await vi_service.analyze_page_similarity(
        image_input=img,
        document_id="SEARCH-ONLY-DOC",
        page_number=1,
    )
    assert len(evidence.matches) == 0

    # Verify SEARCH-ONLY-DOC was NOT auto-registered into store
    matches_after_search = await vector_store.search_nearest_pages(
        query_vector=[0.0] * 768,
        top_k=5,
    )
    assert not any(m.document_id == "SEARCH-ONLY-DOC" for m in matches_after_search)

    # 2. Explicit registration workflow
    await vi_service.register_page_embedding(
        image_input=img,
        document_id="REGISTERED-DOC",
        page_number=1,
    )

    # Verify REGISTERED-DOC is now present in store
    emb = vi_service.embedding_service.generate_page_embedding(img, "TEMP", 1)
    matches_registered = await vector_store.search_nearest_pages(
        query_vector=emb.vector,
        top_k=5,
    )
    assert any(m.document_id == "REGISTERED-DOC" for m in matches_registered)

