package com.doctrace.backend.dto.response;

public record SimilarDocumentResponse(
        Long id,
        String matchedDocumentId,
        Long matchedInvoiceId,
        double similarity
) {}
