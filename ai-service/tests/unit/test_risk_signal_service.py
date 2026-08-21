"""Unit tests for RiskSignalService (multi-signal scoring, legitimate reuse, cross-provider detection)."""

import pytest
from app.schemas.document_understanding import DocumentClassification, DocumentType, ProviderInfo, RelevanceStatus
from app.schemas.report import MatchedCandidateDetail
from app.schemas.similarity import PageSimilarityMatch
from app.services.risk_signal_service import RiskSignalService


def make_classification(provider_name: str = "City Care Hospital") -> DocumentClassification:
    """Helper to create DocumentClassification with provider context."""
    return DocumentClassification(
        document_type=DocumentType.INVOICE,
        relevance_status=RelevanceStatus.RELEVANT,
        confidence=0.95,
        reasons=["Identified as medical invoice."],
        provider_info=ProviderInfo(
            name=provider_name,
            normalized_name="CITY CARE HOSPITAL",
            confidence=0.85,
        ),
        is_medical_document=True,
    )


def test_legitimate_same_provider_template_reuse_is_not_red():
    """TEST 23/24: Same provider + same template + different patient is NOT automatically RED."""
    risk_service = RiskSignalService()
    classification = make_classification(provider_name="City Care Hospital")

    # Matched candidate is from the SAME hospital (e.g. City Care Hospital) with 0.98 similarity
    candidate = MatchedCandidateDetail(
        document_id="INV-HISTORICAL-001",
        visual_similarity=0.98,
        structural_similarity=0.97,
        combined_similarity=0.975,
        candidate_provider="City Care Hospital",
        is_same_provider=True,
        template_family_id="TF-CITYCARE-01",
        signals=["Matching provider institution: 'City Care Hospital'"],
    )

    report = risk_service.evaluate_risk(
        document_id="INV-NEW-002",
        classification=classification,
        templates=[],
        matched_candidates=[candidate],
        processing_metadata={},
    )

    # Must be LOW risk level because same-provider template reuse is expected in genuine hospitals!
    assert report.risk_level == "LOW", f"Expected LOW for legitimate same-provider reuse, got {report.risk_level}"
    assert report.fraud_score <= 0.35, f"Expected low fraudScore for legitimate reuse, got {report.fraud_score}"
    assert any("Legitimate template consistency" in r for r in report.reasons)
    assert report.is_same_provider_reuse is True


def test_same_provider_layout_deviation_triggers_warning():
    """Verify that same provider name alone does NOT force LOW if visual/structural layout deviates."""
    risk_service = RiskSignalService()
    classification = make_classification(provider_name="City Care Hospital")

    # Matched candidate has same provider name, but structural similarity is altered/deviating (e.g. 0.72)
    candidate = MatchedCandidateDetail(
        document_id="INV-HISTORICAL-001",
        visual_similarity=0.88,
        structural_similarity=0.72,
        combined_similarity=0.816,
        candidate_provider="City Care Hospital",
        is_same_provider=True,
        template_family_id="TF-CITYCARE-01",
        signals=["Matching provider institution: 'City Care Hospital'"],
    )

    report = risk_service.evaluate_risk(
        document_id="INV-NEW-MODIFIED-002",
        classification=classification,
        templates=[],
        matched_candidates=[candidate],
        processing_metadata={},
    )

    # Must NOT be forced to LOW; must generate warning (AMBER or RED) due to template layout alteration
    assert report.risk_level in {"AMBER", "RED"}, f"Expected warning for layout deviation, got {report.risk_level}"
    assert report.fraud_score >= 0.70
    assert any("Suspicious template deviation" in r for r in report.reasons)


def test_cross_provider_template_imitation_is_amber_or_red():
    """TEST 28: Cross-provider template reuse (Doc A from Apollo matches Doc B from Fortis) raises suspicion."""
    risk_service = RiskSignalService()
    # Current invoice claims to be from Fortis Clinic
    classification = DocumentClassification(
        document_type=DocumentType.INVOICE,
        relevance_status=RelevanceStatus.RELEVANT,
        confidence=0.95,
        reasons=["Identified as medical invoice."],
        provider_info=ProviderInfo(
            name="Fortis Clinic",
            normalized_name="FORTIS CLINIC",
            confidence=0.85,
        ),
        is_medical_document=True,
    )

    # Historical template was issued by Apollo Hospital
    candidate = MatchedCandidateDetail(
        document_id="INV-APOLLO-001",
        visual_similarity=0.95,
        structural_similarity=0.92,
        combined_similarity=0.935,
        candidate_provider="Apollo Hospital",
        is_same_provider=False,
        template_family_id="TF-APOLLO-01",
        signals=["Cross-provider disparity: query='Fortis Clinic', candidate='Apollo Hospital'"],
    )

    report = risk_service.evaluate_risk(
        document_id="INV-FORTIS-002",
        classification=classification,
        templates=[],
        matched_candidates=[candidate],
        processing_metadata={},
    )

    # Must be AMBER or RED because cross-provider template reuse is highly suspicious!
    assert report.risk_level in {"AMBER", "RED"}, f"Expected AMBER or RED for cross-provider reuse, got {report.risk_level}"
    assert report.fraud_score >= 0.70
    assert any("Cross-provider template" in r for r in report.reasons)


def test_near_duplicate_clone_triggers_red_alert():
    """TEST 28: Near-duplicate claim clone (visual > 0.992 and structural > 0.985) triggers RED alert."""
    risk_service = RiskSignalService()
    classification = make_classification()

    candidate = MatchedCandidateDetail(
        document_id="INV-CLONE-001",
        visual_similarity=0.996,
        structural_similarity=0.992,
        combined_similarity=0.994,
        candidate_provider="City Care Hospital",
        is_same_provider=True,
        template_family_id="TF-001",
        signals=["High visual match", "High structural match"],
    )

    report = risk_service.evaluate_risk(
        document_id="INV-CLONE-002",
        classification=classification,
        templates=[],
        matched_candidates=[candidate],
        processing_metadata={},
    )

    assert report.risk_level == "RED"
    assert report.fraud_score >= 0.90
    assert any("Near-duplicate" in s for s in report.suspicious_signals)


def test_empty_corpus_produces_clean_low_risk_report():
    """TEST 34: When corpus is empty, report is clean LOW risk with fraudScore=0.0."""
    risk_service = RiskSignalService()
    classification = make_classification()

    report = risk_service.evaluate_risk(
        document_id="INV-FIRST-001",
        classification=classification,
        templates=[],
        matched_candidates=[],
        processing_metadata={},
    )

    assert report.risk_level == "LOW"
    assert report.fraud_score == 0.0
    assert len(report.matched_candidates) == 0
    assert report.confidence == 0.95
    resp = report.to_analysis_response()
    assert resp.documentId == "INV-FIRST-001"
    assert resp.fraudScore == 0.0
    assert resp.riskLevel == "LOW"
