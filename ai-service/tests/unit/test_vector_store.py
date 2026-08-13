"""Unit tests for VectorStore abstraction and MockVectorStore implementation."""

import pytest
from app.vector_store.mock import MockVectorStore


@pytest.mark.asyncio
async def test_mock_vector_store_operations():
    """Verify add, search, delete, and health check in MockVectorStore."""
    store = MockVectorStore()

    # Health check
    assert await store.is_healthy() is True

    # Add vector
    doc_id = "INV-100"
    vec = [0.1, 0.2, 0.3, 0.4]
    meta = {"template_family": "T001"}

    added = await store.add_vector(doc_id, vec, meta)
    assert added is True

    # Search vector
    results = await store.search_similar(vec, top_k=5)
    assert len(results) == 1
    assert results[0]["documentId"] == doc_id
    assert results[0]["similarity"] == 0.94
    assert results[0]["metadata"]["template_family"] == "T001"

    # Delete vector
    deleted = await store.delete_vector(doc_id)
    assert deleted is True

    # Confirm deleted
    results_after = await store.search_similar(vec, top_k=5)
    assert len(results_after) == 0
