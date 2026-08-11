"""SimilarityService evaluating candidate page similarity scores into similarity evidence."""

from typing import List, Optional
from app.core.config import settings
from app.core.logging import logger
from app.schemas.similarity import PageSimilarityMatch, SimilarityEvidence


class SimilarityService:
    """Interprets vector search match candidates and evaluates baseline similarity thresholding."""

    def __init__(self, threshold: Optional[float] = None):
        self.threshold = threshold if threshold is not None else settings.SIMILARITY_THRESHOLD

    def evaluate_similarity(
        self,
        query_document_id: str,
        query_page_number: int,
        raw_matches: List[PageSimilarityMatch],
    ) -> SimilarityEvidence:
        """Evaluate raw page vector search matches into structured SimilarityEvidence.

        Computes above_threshold flag based on configurable similarity cutoff (default 0.955).
        """
        evaluated_matches: List[PageSimilarityMatch] = []

        for match in raw_matches:
            above_thresh = match.similarity_score >= self.threshold
            evaluated_match = PageSimilarityMatch(
                document_id=match.document_id,
                page_number=match.page_number,
                similarity_score=match.similarity_score,
                threshold=self.threshold,
                above_threshold=above_thresh,
                metadata=match.metadata,
            )
            evaluated_matches.append(evaluated_match)

        evidence = SimilarityEvidence(
            query_document_id=query_document_id,
            query_page_number=query_page_number,
            matches=evaluated_matches,
        )

        logger.debug(
            "SimilarityService evaluated %d matches for query docId='%s' page=%d (threshold=%.4f, matches above threshold=%d)",
            len(evaluated_matches),
            query_document_id,
            query_page_number,
            self.threshold,
            sum(1 for m in evaluated_matches if m.above_threshold),
        )
        return evidence
