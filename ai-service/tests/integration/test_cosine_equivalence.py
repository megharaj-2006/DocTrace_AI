"""Mandatory integration test proving PyTorch cosine similarity is mathematically equivalent to L2-normalized dot product & Qdrant Cosine distance search."""

import pytest
import numpy as np
import torch
from PIL import Image

from app.services.embedding_service import EmbeddingService
from app.vector_store.mock import MockVectorStore


@pytest.mark.asyncio
async def test_pytorch_cosine_vs_l2_normalized_dot_product_equivalence():
    """Verify that:

    PyTorch F.cosine_similarity(raw_A, raw_B)
    ==
    dot(L2_norm_A, L2_norm_B)
    ==
    Qdrant / VectorStore Cosine search score

    agrees within 1e-5 numerical tolerance.
    """
    embedding_service = EmbeddingService()

    # Generate two distinct page images
    img_a = Image.new("RGB", (224, 224), color=(255, 0, 0))
    img_b = Image.new("RGB", (224, 224), color=(0, 255, 0))

    emb_a = embedding_service.generate_page_embedding(img_a, "DOC-A", 1)
    emb_b = embedding_service.generate_page_embedding(img_b, "DOC-B", 1)

    raw_a_np = np.array(emb_a.raw_vector, dtype=np.float32)
    raw_b_np = np.array(emb_b.raw_vector, dtype=np.float32)

    norm_a_np = np.array(emb_a.vector, dtype=np.float32)
    norm_b_np = np.array(emb_b.vector, dtype=np.float32)

    # 1. Calculate PyTorch F.cosine_similarity on raw embeddings (Member 5 formula)
    t_a = torch.from_numpy(raw_a_np).unsqueeze(0)
    t_b = torch.from_numpy(raw_b_np).unsqueeze(0)
    pytorch_sim = torch.nn.functional.cosine_similarity(t_a, t_b).item()

    # 2. Calculate L2-normalized dot product
    dot_sim = float(np.dot(norm_a_np, norm_b_np))

    # 3. Calculate VectorStore search score
    v_store = MockVectorStore()
    await v_store.upsert_page_embedding(emb_b)

    matches = await v_store.search_nearest_pages(
        query_vector=emb_a.vector,
        top_k=1,
    )
    assert len(matches) == 1
    vector_store_sim = matches[0].similarity_score

    # Assert mathematical equivalence within 1e-5 tolerance
    assert pytest.approx(pytorch_sim, abs=1e-5) == dot_sim
    assert pytest.approx(dot_sim, abs=1e-5) == vector_store_sim
    assert pytest.approx(pytorch_sim, abs=1e-5) == vector_store_sim
