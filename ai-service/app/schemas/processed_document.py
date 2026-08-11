"""Internal ProcessedDocument representation for document intelligence pipeline output."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class LayoutRegion(BaseModel):
    """Structured layout region detected by PP-DocLayout-M."""

    label: str = Field(..., description="Region label/type (header, table, figure, text, etc.)")
    bbox: List[float] = Field(..., description="Bounding box coordinates [x1, y1, x2, y2]")
    confidence: float = Field(..., description="Detection confidence score between 0.0 and 1.0")
    order: Optional[int] = Field(None, description="Reading or layout order index if available")


class OCRRegion(BaseModel):
    """Structured OCR text line or region recognized by PaddleOCR."""

    text: str = Field(..., description="Recognized textual content")
    bbox: List[List[float]] = Field(..., description="Bounding polygon or box coordinates")
    confidence: float = Field(..., description="OCR recognition confidence score between 0.0 and 1.0")


class PageData(BaseModel):
    """Structured representation of an individual document page."""

    page_number: int = Field(..., description="1-indexed page number within the document")
    width: int = Field(..., description="Page width in pixels")
    height: int = Field(..., description="Page height in pixels")
    text: str = Field("", description="Concatenated textual content of the page")
    ocr_regions: List[OCRRegion] = Field(default_factory=list, description="List of recognized OCR text regions")
    layout_regions: List[LayoutRegion] = Field(default_factory=list, description="List of detected layout regions")


class ProcessedDocument(BaseModel):
    """Complete structured document representation output by Phase 1 DocumentProcessor."""

    document_id: str = Field(..., description="Application document identifier")
    pages: List[PageData] = Field(default_factory=list, description="List of processed document pages")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Processing metadata (format, runtime, etc.)")
