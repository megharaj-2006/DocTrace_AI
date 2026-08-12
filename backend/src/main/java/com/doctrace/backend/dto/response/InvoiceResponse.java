package com.doctrace.backend.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record InvoiceResponse(
        Long id,
        String documentId,
        Long uploadedById,
        Long providerId,
        String providerName,
        String originalFilename,
        String contentType,
        long fileSize,
        String invoiceNumber,
        LocalDate invoiceDate,
        BigDecimal amount,
        String patientName,
        String status,
        Instant createdAt,
        Instant updatedAt
) {}
