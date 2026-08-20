"""Domain models for Document Understanding, Relevance Gating, and Document Classification."""

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class DocumentType(str, Enum):
    """Supported document classifications."""

    INVOICE = "INVOICE"
    PRESCRIPTION = "PRESCRIPTION"
    LAB_REPORT = "LAB_REPORT"
    OTHER_MEDICAL = "OTHER_MEDICAL"
    IRRELEVANT = "IRRELEVANT"


class RelevanceStatus(str, Enum):
    """Relevance gate decision status."""

    RELEVANT = "RELEVANT"
    IRRELEVANT = "IRRELEVANT"
    LOW_CONFIDENCE_REVIEW = "LOW_CONFIDENCE_REVIEW"


class ProviderInfo(BaseModel):
    """Extracted medical provider / institution context."""

    name: Optional[str] = Field(None, description="Raw detected provider or hospital name")
    normalized_name: Optional[str] = Field(None, description="Normalized canonical provider name")
    address: Optional[str] = Field(None, description="Detected address or location")
    phone: Optional[str] = Field(None, description="Detected phone or contact number")
    registration_id: Optional[str] = Field(None, description="Medical registration or license ID")
    tax_id: Optional[str] = Field(None, description="GST / Tax identifier if present")
    confidence: float = Field(0.0, description="Confidence score of provider extraction (0.0 to 1.0)")


class DocumentClassification(BaseModel):
    """Outcome of document classification and relevance gating."""

    document_type: DocumentType = Field(..., description="Classified document category")
    relevance_status: RelevanceStatus = Field(..., description="Relevance gate decision")
    confidence: float = Field(..., description="Classification and relevance confidence (0.0 to 1.0)")
    reasons: List[str] = Field(default_factory=list, description="Explanations for relevance and classification")
    detected_keywords: List[str] = Field(default_factory=list, description="Salient domain keywords detected")
    provider_info: Optional[ProviderInfo] = Field(None, description="Extracted provider information")
    is_medical_document: bool = Field(False, description="True if document belongs to medical claim domain")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Diagnostic metrics")
