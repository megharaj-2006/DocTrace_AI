"""Pydantic models matching the frozen backend-to-AI analysis API contract."""

from typing import List
from pydantic import BaseModel, Field


class MatchedDocument(BaseModel):
    """Details of a matched document sharing template similarity."""

    documentId: str = Field(..., description="Application identifier of the matched document")
    similarity: float = Field(..., description="Similarity score between 0.0 and 1.0")


class AnalysisResponse(BaseModel):
    """Response schema for POST /api/v1/analyze. Frozen API contract."""

    documentId: str = Field(..., description="Application identifier of the analyzed document")
    fraudScore: float = Field(..., description="Fraud/suspicion score between 0.0 and 1.0")
    riskLevel: str = Field(..., description="Risk level classification (LOW, AMBER, RED)")
    confidence: float = Field(..., description="Confidence score of the analysis between 0.0 and 1.0")
    matchedDocuments: List[MatchedDocument] = Field(
        default_factory=list,
        description="List of similar documents identified",
    )
    reasons: List[str] = Field(
        default_factory=list,
        description="List of reasons explaining the analysis result",
    )
