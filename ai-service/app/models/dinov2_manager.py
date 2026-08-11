"""Singleton model manager for DINOv2-base image embeddings."""

import threading
from typing import Optional, Tuple
from PIL import Image

from app.core.config import settings
from app.core.exceptions import ProcessingException
from app.core.logging import logger

try:
    import torch
    from transformers import AutoImageProcessor, AutoModel
except ImportError:
    torch = None
    AutoImageProcessor = None
    AutoModel = None


class DINOv2Manager:
    """Manages loading, device placement, and inference for facebook/dinov2-base."""

    _instance: Optional["DINOv2Manager"] = None
    _lock: threading.Lock = threading.Lock()

    def __init__(self, model_name: Optional[str] = None, device_setting: Optional[str] = None):
        if torch is None or AutoModel is None:
            raise ProcessingException("torch and transformers packages are required for DINOv2 embeddings.")

        self.model_name = model_name or settings.EMBEDDING_MODEL
        self.device_setting = (device_setting or settings.EMBEDDING_DEVICE).lower()
        self.device = self._resolve_device(self.device_setting)

        logger.info(
            "Initializing DINOv2Manager with model='%s' on resolved device='%s' (requested='%s')",
            self.model_name,
            self.device,
            self.device_setting,
        )

        try:
            self.processor = AutoImageProcessor.from_pretrained(self.model_name)
            self.model = AutoModel.from_pretrained(self.model_name)
            self.model.to(self.device)
            self.model.eval()
            logger.info("DINOv2Manager successfully loaded model '%s'", self.model_name)
        except Exception as err:
            logger.error("Failed to load DINOv2 model '%s': %s", self.model_name, str(err), exc_info=True)
            raise ProcessingException(f"DINOv2 model initialization failed: {str(err)}") from err

    @classmethod
    def get_instance(cls) -> "DINOv2Manager":
        """Get or create singleton instance of DINOv2Manager."""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    @classmethod
    def reset_instance(cls) -> None:
        """Reset singleton instance (useful for unit testing)."""
        with cls._lock:
            cls._instance = None

    def _resolve_device(self, requested: str) -> str:
        """Resolve device string to torch device, validating CUDA availability if explicitly requested."""
        if requested == "cuda":
            if not torch.cuda.is_available():
                raise ProcessingException("CUDA device was explicitly requested in configuration but CUDA is unavailable.")
            return "cuda"
        elif requested == "cpu":
            return "cpu"
        elif requested == "auto":
            return "cuda" if torch.cuda.is_available() else "cpu"
        else:
            raise ProcessingException(f"Unsupported EMBEDDING_DEVICE setting: '{requested}'. Must be 'auto', 'cpu', or 'cuda'.")

    def extract_cls_embedding(self, image: Image.Image):
        """Extract 768-D CLS token embedding from PIL image using Hugging Face DINOv2.

        Returns:
            1D numpy array of shape (768,) and float32 dtype.
        """
        if not isinstance(image, Image.Image):
            raise ProcessingException("Input to DINOv2Manager must be a valid PIL Image instance.")

        try:
            # 1. Ensure RGB format
            rgb_image = image.convert("RGB")

            # 2. Preprocess image into tensor
            inputs = self.processor(images=rgb_image, return_tensors="pt")
            inputs = {k: v.to(self.device) for k, v in inputs.items()}

            # 3. Model forward pass in eval mode with no_grad
            with torch.no_grad():
                outputs = self.model(**inputs)

            # 4. Extract CLS token: outputs.last_hidden_state[:, 0, :]
            # Shape is [1, 257, 768] -> [1, 768]
            cls_tensor = outputs.last_hidden_state[:, 0, :]

            # 5. Convert to CPU float32 numpy array
            cls_array = cls_tensor.squeeze(0).cpu().detach().numpy().astype("float32")

            if cls_array.shape != (768,):
                raise ProcessingException(f"Unexpected CLS embedding shape: {cls_array.shape}, expected (768,)")

            return cls_array

        except Exception as err:
            logger.error("Error during DINOv2 embedding extraction: %s", str(err), exc_info=True)
            raise ProcessingException(f"DINOv2 embedding extraction failed: {str(err)}") from err
