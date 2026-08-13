"""Integration test proving EmbeddingService reproduces Member 5's exact DINOv2 embedding semantics."""

import pytest
import numpy as np
import torch
from PIL import Image
from transformers import AutoImageProcessor, AutoModel

from app.services.embedding_service import EmbeddingService


def test_member5_dinov2_model_contract_reproduction():
    """Verify EmbeddingService reproduces Member 5's exact Hugging Face DINOv2 inference contract:

    1. Model: facebook/dinov2-base
    2. Input: PIL RGB image
    3. Processor: AutoImageProcessor
    4. CLS Token extraction: outputs.last_hidden_state[:, 0, :]
    5. Output dimension: 768 FP32
    """
    model_name = "facebook/dinov2-base"

    # Reference implementation following Member 5's exact code semantics
    processor = AutoImageProcessor.from_pretrained(model_name)
    model = AutoModel.from_pretrained(model_name)
    model.eval()

    sample_img = Image.new("RGB", (224, 224), color=(120, 150, 200))

    # Reference extraction
    inputs = processor(images=sample_img, return_tensors="pt")
    with torch.no_grad():
        outputs = model(**inputs)
    raw_cls_tensor = outputs.last_hidden_state[:, 0, :]
    reference_raw = raw_cls_tensor.squeeze(0).cpu().numpy().astype("float32")

    assert reference_raw.shape == (768,)

    # AI Service EmbeddingService extraction
    embedding_service = EmbeddingService(model_name=model_name)
    page_embedding = embedding_service.generate_page_embedding(
        image_input=sample_img,
        document_id="MEMBER5-REF-001",
        page_number=1,
    )

    ai_service_raw = np.array(page_embedding.raw_vector, dtype=np.float32)

    # 1. Assert exact shape and dtype
    assert ai_service_raw.shape == (768,)
    assert ai_service_raw.dtype == np.float32

    # 2. Assert raw CLS vector matches reference within 1e-4 numerical tolerance
    np.testing.assert_allclose(ai_service_raw, reference_raw, rtol=1e-4, atol=1e-4)

    # 3. Assert L2-normalized vector copy matches reference normalized vector
    ref_norm = reference_raw / np.linalg.norm(reference_raw)
    ai_norm = np.array(page_embedding.vector, dtype=np.float32)
    np.testing.assert_allclose(ai_norm, ref_norm, rtol=1e-4, atol=1e-4)

    # 4. Assert PyTorch cosine similarity of identical image with itself is ~1.0
    t1 = torch.from_numpy(ai_service_raw).unsqueeze(0)
    t2 = torch.from_numpy(reference_raw).unsqueeze(0)
    sim = torch.nn.functional.cosine_similarity(t1, t2).item()
    assert pytest.approx(sim, abs=1e-4) == 1.0
