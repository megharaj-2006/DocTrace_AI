package com.doctrace.backend.dto.response;

import java.time.Instant;

public record AlertResponse(
        Long id,
        String documentId,
        Long invoiceId,
        String riskLevel,
        String status,
        double fraudScore,
        double confidence,
        String assignedTo,
        String resolutionNotes,
        Instant resolvedAt,
        Instant createdAt,
        Instant updatedAt
) {}
