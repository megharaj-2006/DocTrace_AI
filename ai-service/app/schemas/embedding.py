"""Domain representations for invoice page embeddings."""

import time
from typing import List, Optional
from pydantic import BaseModel, Field


class PageEmbedding(BaseModel):
    """Domain model capturing a page-level embedding representation."""

    document_id: str = Field(..., description="Application document identifier")
    page_number: int = Field(..., description="1-indexed page number within document")
    vector: List[float] = Field(..., description="768-D L2-normalized FP32 embedding vector for storage and search")
    raw_vector: Optional[List[float]] = Field(None, description="Optional raw un-normalized CLS token embedding vector")
    dimension: int = Field(768, description="Embedding vector dimensionality (must be 768)")
    model_name: str = Field("facebook/dinov2-base", description="Underlying vision model identifier")
    model_version: str = Field("dinov2-base-cls-v1", description="Model version tag for collection isolation")
    created_at: float = Field(default_factory=time.time, description="Unix timestamp of embedding creation")
