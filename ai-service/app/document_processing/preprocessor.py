"""Conservative image preprocessor for template structure preservation."""

from typing import Tuple
from PIL import Image, ImageOps
import numpy as np

MAX_DIMENSION: int = 2400  # Max dimension for CPU/RAM safety during inference


class Preprocessor:
    """Performs conservative image normalization while preserving template structure."""

    def __init__(self, max_dimension: int = MAX_DIMENSION):
        self.max_dimension = max_dimension

    def preprocess_image(self, image_path: str) -> Tuple[np.ndarray, Tuple[int, int]]:
        """Load, apply EXIF orientation fix, normalize RGB mode, and scale safely.

        Returns:
            Tuple containing:
            - Normalized OpenCV-compatible numpy array (RGB image)
            - Original (width, height) tuple
        """
        with Image.open(image_path) as img:
            # 1. EXIF orientation correction
            img = ImageOps.exif_transpose(img)

            # 2. RGB mode normalization
            if img.mode != "RGB":
                img = img.convert("RGB")

            orig_w, orig_h = img.size
            w, h = orig_w, orig_h

            # 3. Proportional scale down if dimension exceeds MAX_DIMENSION (to protect CPU/RAM)
            if max(w, h) > self.max_dimension:
                scale = self.max_dimension / float(max(w, h))
                new_w = max(1, int(w * scale))
                new_h = max(1, int(h * scale))
                img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

            # 4. Convert PIL Image to RGB NumPy array for PaddleOCR & layout models
            img_np = np.array(img)
            return img_np, (orig_w, orig_h)
