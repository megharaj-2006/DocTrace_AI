"""Unit tests for Preprocessor component."""

import os
import tempfile
from PIL import Image
from app.document_processing.preprocessor import Preprocessor


def test_preprocess_image_converts_to_rgb_and_tracks_size():
    """Verify preprocessor converts mode to RGB and returns original size."""
    prep = Preprocessor(max_dimension=2000)

    # Create RGBA image
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        path = tmp.name
        img = Image.new("RGBA", (500, 600), color=(255, 0, 0, 128))
        img.save(path, format="PNG")

    try:
        img_np, (orig_w, orig_h) = prep.preprocess_image(path)
        assert orig_w == 500
        assert orig_h == 600
        assert img_np.ndim == 3
        assert img_np.shape[2] == 3  # RGB channels
    finally:
        os.remove(path)


def test_preprocess_image_scales_oversized_dimension():
    """Verify oversized image dimensions scale down proportionally."""
    prep = Preprocessor(max_dimension=1000)

    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        path = tmp.name
        img = Image.new("RGB", (3000, 1500), color="white")
        img.save(path, format="JPEG")

    try:
        img_np, (orig_w, orig_h) = prep.preprocess_image(path)
        assert orig_w == 3000
        assert orig_h == 1500
        # Scaled max dimension should be <= 1000
        assert max(img_np.shape[0], img_np.shape[1]) == 1000
    finally:
        os.remove(path)
