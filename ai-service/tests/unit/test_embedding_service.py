"""Unit tests for EmbeddingService and DINOv2 model management."""

import pytest
import numpy as np
from PIL import Image

from app.core.exceptions import InvalidInputException, ProcessingException
from app.models.dinov2_manager import DINOv2Manager
from app.schemas.embedding import PageEmbedding
from app.services.embedding_service import EmbeddingService


def test_dinov2_manager_cpu_resolution():
    """Verify DINOv2Manager correctly resolves CPU device."""
    DINOv2Manager.reset_instance()
    manager = DINOv2Manager(device_setting="cpu")
    assert manager.device == "cpu"
    DINOv2Manager.reset_instance()


def test_dinov2_manager_cuda_unavailable_raises():
    """Verify requesting CUDA when unavailable raises ProcessingException clearly."""
    DINOv2Manager.reset_instance()
    # Mock torch.cuda.is_available to return False
    import torch
    original_is_available = torch.cuda.is_available
    torch.cuda.is_available = lambda: False

    try:
        with pytest.raises(ProcessingException, match="CUDA device was explicitly requested"):
            DINOv2Manager(device_setting="cuda")
    finally:
        torch.cuda.is_available = original_is_available
        DINOv2Manager.reset_instance()


def test_generate_page_embedding_valid_image():
    """Verify generating page embedding from valid PIL image produces 768-D float32 L2-normalized vector."""
    service = EmbeddingService()
    img = Image.new("RGB", (224, 224), color="blue")

    embedding = service.generate_page_embedding(
        image_input=img,
        document_id="INV-TEST-001",
        page_number=1,
    )

    assert isinstance(embedding, PageEmbedding)
    assert embedding.document_id == "INV-TEST-001"
    assert embedding.page_number == 1
    assert embedding.dimension == 768
    assert len(embedding.vector) == 768
    assert len(embedding.raw_vector) == 768

    # Verify L2 normalization: ||v_norm||_2 == 1.0
    l2_norm = np.linalg.norm(embedding.vector)
    assert pytest.approx(l2_norm, abs=1e-4) == 1.0


def test_rgb_conversion_for_grayscale_and_rgba():
    """Verify images in L (grayscale) or RGBA mode are converted to RGB prior to embedding extraction."""
    service = EmbeddingService()

    gray_img = Image.new("L", (200, 200), color=128)
    rgba_img = Image.new("RGBA", (200, 200), color=(255, 0, 0, 128))

    emb_gray = service.generate_page_embedding(gray_img, "DOC-GRAY", 1)
    emb_rgba = service.generate_page_embedding(rgba_img, "DOC-RGBA", 1)

    assert len(emb_gray.vector) == 768
    assert len(emb_rgba.vector) == 768


def test_model_reuse_across_sequential_calls():
    """Verify model manager instance is reused across sequential page embedding calls."""
    service = EmbeddingService()
    manager_1 = service.manager
    manager_2 = service.manager

    assert manager_1 is manager_2

    img1 = Image.new("RGB", (100, 100), color="white")
    img2 = Image.new("RGB", (100, 100), color="black")

    emb1 = service.generate_page_embedding(img1, "DOC-SEQ", 1)
    emb2 = service.generate_page_embedding(img2, "DOC-SEQ", 2)

    assert emb1.page_number == 1
    assert emb2.page_number == 2


def test_embedding_service_invalid_inputs():
    """Verify input validation handles empty document_id, invalid page_number, or malformed image paths."""
    service = EmbeddingService()
    img = Image.new("RGB", (100, 100))

    with pytest.raises(InvalidInputException, match="document_id must be a non-empty string"):
        service.generate_page_embedding(img, "", 1)

    with pytest.raises(InvalidInputException, match="page_number must be 1 or greater"):
        service.generate_page_embedding(img, "DOC-1", 0)

    with pytest.raises(InvalidInputException, match="Failed to open image file"):
        service.generate_page_embedding("non_existent_image_path_12345.png", "DOC-1", 1)
