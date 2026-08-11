"""Unit tests for SimilarityService threshold interpretation."""

from app.schemas.similarity import PageSimilarityMatch, SimilarityEvidence
from app.services.similarity_service import SimilarityService


def test_evaluate_similarity_default_threshold():
    """Verify SimilarityService accurately evaluates matches against default baseline threshold 0.955."""
    service = SimilarityService(threshold=0.955)

    raw_matches = [
        PageSimilarityMatch(
            document_id="INV-HIGH",
            page_number=1,
            similarity_score=0.98,
            threshold=0.955,
            above_threshold=False,
            metadata={},
        ),
        PageSimilarityMatch(
            document_id="INV-EXACT",
            page_number=1,
            similarity_score=0.955,
            threshold=0.955,
            above_threshold=False,
            metadata={},
        ),
        PageSimilarityMatch(
            document_id="INV-LOW",
            page_number=1,
            similarity_score=0.92,
            threshold=0.955,
            above_threshold=False,
            metadata={},
        ),
    ]

    evidence: SimilarityEvidence = service.evaluate_similarity(
        query_document_id="QUERY-001",
        query_page_number=1,
        raw_matches=raw_matches,
    )

    assert evidence.query_document_id == "QUERY-001"
    assert evidence.query_page_number == 1
    assert len(evidence.matches) == 3

    assert evidence.matches[0].document_id == "INV-HIGH"
    assert evidence.matches[0].above_threshold is True

    assert evidence.matches[1].document_id == "INV-EXACT"
    assert evidence.matches[1].above_threshold is True

    assert evidence.matches[2].document_id == "INV-LOW"
    assert evidence.matches[2].above_threshold is False


def test_evaluate_similarity_configurable_threshold():
    """Verify custom similarity threshold setting behaves as configured."""
    service = SimilarityService(threshold=0.80)

    raw_matches = [
        PageSimilarityMatch(
            document_id="INV-MID",
            page_number=1,
            similarity_score=0.85,
            threshold=0.80,
            above_threshold=False,
            metadata={},
        ),
        PageSimilarityMatch(
            document_id="INV-LOW",
            page_number=1,
            similarity_score=0.75,
            threshold=0.80,
            above_threshold=False,
            metadata={},
        ),
    ]

    evidence = service.evaluate_similarity("QUERY-002", 1, raw_matches)

    assert evidence.matches[0].above_threshold is True
    assert evidence.matches[1].above_threshold is False
