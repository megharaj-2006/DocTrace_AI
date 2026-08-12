package com.doctrace.backend.client.dto;

import java.util.List;

/**
 * Frozen response schema from the Python AI microservice.
 *
 * <p><strong>This DTO maps the authoritative AI contract exactly.</strong>
 * Do NOT add, rename, or change field types. The AI service owns this schema.</p>
 */
public record AiAnalysisResponse(
        String documentId,
        double fraudScore,
        String riskLevel,
        double confidence,
        List<AiMatchedDocument> matchedDocuments,
        List<String> reasons
) {

    /**
     * A single matched document from the AI similarity search.
     */
    public record AiMatchedDocument(
            String documentId,
            double similarity
    ) {}
}
