"""Domain representations for page similarity evidence."""

from typing import Any, Dict, List
from pydantic import BaseModel, Field


class PageSimilarityMatch(BaseModel):
    """Domain model representing a single matched candidate page from vector search."""

    document_id: str = Field(..., description="Matched candidate document identifier")
    page_number: int = Field(..., description="Matched candidate page number")
    similarity_score: float = Field(..., description="Cosine similarity score (0.0 to 1.0)")
    threshold: float = Field(..., description="Similarity cutoff threshold used for comparison")
    above_threshold: bool = Field(..., description="True if similarity_score >= threshold")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Retrieved candidate metadata payload")


class SimilarityEvidence(BaseModel):
    """Domain model representing page-level similarity evidence returned by Phase 2A."""

    query_document_id: str = Field(..., description="Query document identifier")
    query_page_number: int = Field(..., description="Query page number")
    matches: List[PageSimilarityMatch] = Field(default_factory=list, description="List of matched candidate pages")
