"""Internal comprehensive structured AnalysisReport model and adapter to frozen AnalysisResponse."""

import time
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.schemas.analysis import AnalysisResponse, MatchedDocument
from app.schemas.document_understanding import DocumentType, ProviderInfo, RelevanceStatus


class MatchedCandidateDetail(BaseModel):
    """Detailed multi-signal match information for an individual historical candidate."""

    document_id: str = Field(..., description="Matched candidate document ID")
    visual_similarity: float = Field(0.0, description="DINOv2 visual cosine similarity (0.0 to 1.0)")
    structural_similarity: float = Field(0.0, description="Structural layout cosine similarity (0.0 to 1.0)")
    combined_similarity: float = Field(0.0, description="Weighted combined similarity score")
    candidate_provider: Optional[str] = Field(None, description="Historical candidate provider name if known")
    is_same_provider: bool = Field(False, description="True if query and candidate share same provider")
    template_family_id: Optional[str] = Field(None, description="Assigned template family identifier")
    signals: List[str] = Field(default_factory=list, description="Diagnostic similarity signals")


class AnalysisReport(BaseModel):
    """Internal comprehensive multi-signal analysis report."""

    document_id: str = Field(..., description="Application document identifier")
    relevance_status: RelevanceStatus = Field(..., description="Relevance gate outcome")
    document_type: DocumentType = Field(..., description="Document type classification")
    classification_confidence: float = Field(..., description="Relevance and classification confidence")
    provider_info: Optional[ProviderInfo] = Field(None, description="Extracted medical provider context")
    page_count: int = Field(1, description="Total pages processed")
    template_family_id: Optional[str] = Field(None, description="Template family ID assigned or matched")
    top_visual_similarity: float = Field(0.0, description="Highest visual similarity across candidates")
    top_structural_similarity: float = Field(0.0, description="Highest structural similarity across candidates")
    top_combined_similarity: float = Field(0.0, description="Highest multi-signal combined similarity")
    matched_candidates: List[MatchedCandidateDetail] = Field(default_factory=list, description="Detailed candidates")
    is_same_provider_reuse: bool = Field(False, description="True if template match corresponds to same provider")
    suspicious_signals: List[str] = Field(default_factory=list, description="Identified risk/suspicion signals")
    fraud_score: float = Field(0.0, description="Multi-signal risk/suspicion score (0.0 to 1.0)")
    risk_level: str = Field("LOW", description="Risk level (LOW, AMBER, RED)")
    confidence: float = Field(0.95, description="Overall confidence score (0.0 to 1.0)")
    reasons: List[str] = Field(default_factory=list, description="Human/investigator explainable reasons")
    processing_metadata: Dict[str, Any] = Field(default_factory=dict, description="Execution timing and metadata")
    created_at: float = Field(default_factory=time.time, description="Report generation timestamp")

    def to_analysis_response(self) -> AnalysisResponse:
        """Convert internal rich AnalysisReport to frozen external AnalysisResponse API contract."""
        matched_docs: List[MatchedDocument] = []
        for cand in self.matched_candidates:
            # Use the combined similarity score for the matched document summary
            score = round(cand.combined_similarity if cand.combined_similarity > 0 else cand.visual_similarity, 4)
            matched_docs.append(MatchedDocument(documentId=cand.document_id, similarity=score))

        matched_docs.sort(key=lambda m: m.similarity, reverse=True)

        return AnalysisResponse(
            documentId=self.document_id,
            fraudScore=round(self.fraud_score, 4),
            riskLevel=self.risk_level,
            confidence=round(self.confidence, 2),
            matchedDocuments=matched_docs,
            reasons=self.reasons,
        )
