"""Domain representations for structural layout normalization, variable fields, and structural embeddings."""

import time
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class NormalizedBBox(BaseModel):
    """Relative bounding box normalized to [0.0, 1.0] across page dimensions."""

    x1: float = Field(..., description="Top-left X normalized (0.0 to 1.0)")
    y1: float = Field(..., description="Top-left Y normalized (0.0 to 1.0)")
    x2: float = Field(..., description="Bottom-right X normalized (0.0 to 1.0)")
    y2: float = Field(..., description="Bottom-right Y normalized (0.0 to 1.0)")

    @property
    def width(self) -> float:
        return max(0.0, self.x2 - self.x1)

    @property
    def height(self) -> float:
        return max(0.0, self.y2 - self.y1)

    @property
    def center_x(self) -> float:
        return (self.x1 + self.x2) / 2.0

    @property
    def center_y(self) -> float:
        return (self.y1 + self.y2) / 2.0


class VariableField(BaseModel):
    """Detected variable claim field representation preserving structure without content lock."""

    field_type: str = Field(..., description="Abstract role (PATIENT_NAME, INVOICE_NO, DATE, AMOUNT, etc.)")
    normalized_bbox: NormalizedBBox = Field(..., description="Normalized spatial coordinate of field")
    confidence: float = Field(1.0, description="Field detection confidence")


class NormalizedPageTemplate(BaseModel):
    """Content-independent standardized template representation of a document page."""

    page_number: int = Field(..., description="Page number")
    aspect_ratio: float = Field(..., description="Width / Height aspect ratio")
    layout_regions: List[Dict[str, Any]] = Field(default_factory=list, description="Normalized layout regions")
    text_blocks: List[Dict[str, Any]] = Field(default_factory=list, description="Normalized text geometry blocks")
    variable_fields: List[VariableField] = Field(default_factory=list, description="Identified variable fields")
    table_count: int = Field(0, description="Count of detected table structures")
    header_count: int = Field(0, description="Count of detected header sections")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Structural statistics")


class StructuralEmbedding(BaseModel):
    """Fixed-dimension engineered structural fingerprint vector for cosine similarity search."""

    document_id: str = Field(..., description="Application document identifier")
    page_number: int = Field(..., description="1-indexed page number within document")
    vector: List[float] = Field(..., description="128-D L2-normalized FP32 structural vector")
    dimension: int = Field(128, description="Embedding vector dimensionality (must be 128)")
    model_version: str = Field("structural-layout-v1", description="Structural layout version tag")
    template_version: str = Field("template-v1", description="Template format version tag")
    created_at: float = Field(default_factory=time.time, description="Unix timestamp of embedding creation")
