"""EmbeddingService handling page image embedding extraction and L2 normalization."""

from typing import Optional, Union
import numpy as np
from PIL import Image

from app.core.config import settings
from app.core.exceptions import InvalidInputException, ProcessingException
from app.core.logging import logger
from app.models.dinov2_manager import DINOv2Manager
from app.schemas.embedding import PageEmbedding


class EmbeddingService:
    """Generates page-level raw and L2-normalized embeddings using DINOv2-base."""

    def __init__(
        self,
        dinov2_manager: Optional[DINOv2Manager] = None,
        model_name: Optional[str] = None,
        model_version: Optional[str] = None,
    ):
        self.model_name = model_name or settings.EMBEDDING_MODEL
        self.model_version = model_version or settings.EMBEDDING_VERSION
        self._manager = dinov2_manager

    @property
    def manager(self) -> DINOv2Manager:
        """Lazy-load or return configured DINOv2Manager instance."""
        if self._manager is None:
            self._manager = DINOv2Manager.get_instance()
        return self._manager

    def generate_page_embedding(
        self,
        image_input: Union[Image.Image, str],
        document_id: str,
        page_number: int,
    ) -> PageEmbedding:
        """Generate 768-D page embedding for an image or image file path.

        Computes exact raw DINOv2 CLS embedding and an L2-normalized copy for vector search.
        """
        if not document_id or not document_id.strip():
            raise InvalidInputException("document_id must be a non-empty string.")

        if page_number < 1:
            raise InvalidInputException("page_number must be 1 or greater.")

        pil_image: Optional[Image.Image] = None
        should_close = False

        try:
            if isinstance(image_input, str):
                try:
                    pil_image = Image.open(image_input)
                    should_close = True
                except Exception as img_err:
                    raise InvalidInputException(f"Failed to open image file '{image_input}': {str(img_err)}") from img_err
            elif isinstance(image_input, Image.Image):
                pil_image = image_input
            else:
                raise InvalidInputException("image_input must be a PIL Image or valid image file path.")

            # 1. Extract raw 768-D CLS embedding using DINOv2
            raw_array = self.manager.extract_cls_embedding(pil_image)

            if len(raw_array) != 768:
                raise ProcessingException(f"Embedding dimension mismatch: expected 768, got {len(raw_array)}")

            # 2. Compute L2 normalization: v_norm = v / ||v||_2
            l2_norm = float(np.linalg.norm(raw_array))
            if l2_norm > 0:
                normalized_array = raw_array / l2_norm
            else:
                normalized_array = raw_array.copy()

            raw_list = [float(x) for x in raw_array]
            normalized_list = [float(x) for x in normalized_array]

            # 3. Assemble domain PageEmbedding model
            embedding = PageEmbedding(
                document_id=document_id,
                page_number=page_number,
                vector=normalized_list,
                raw_vector=raw_list,
                dimension=768,
                model_name=self.model_name,
                model_version=self.model_version,
            )

            logger.debug(
                "Generated 768-D embedding for docId='%s' page=%d (L2 norm=%.4f)",
                document_id,
                page_number,
                l2_norm,
            )
            return embedding

        finally:
            if should_close and pil_image is not None:
                try:
                    pil_image.close()
                except Exception:
                    pass
