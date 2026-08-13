package com.doctrace.backend.dto.response;

import java.time.Instant;
import java.util.List;

public record AnalysisResultResponse(
        Long id,
        String documentId,
        double fraudScore,
        String riskLevel,
        double confidence,
        List<String> reasons,
        List<SimilarDocumentResponse> matchedDocuments,
        String errorMessage,
        Instant analyzedAt,
        Instant createdAt
) {}
