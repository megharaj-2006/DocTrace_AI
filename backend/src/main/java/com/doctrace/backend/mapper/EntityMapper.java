package com.doctrace.backend.mapper;

import com.doctrace.backend.dto.response.*;
import com.doctrace.backend.entity.*;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Centralized entity-to-DTO mapping. Keeps conversion logic
 * out of services and controllers.
 */
@Component
public class EntityMapper {

    public UserResponse toUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole().name(),
                user.isEnabled(),
                user.getCreatedAt()
        );
    }

    public InvoiceResponse toInvoiceResponse(Invoice invoice) {
        return new InvoiceResponse(
                invoice.getId(),
                invoice.getDocumentId(),
                invoice.getUploadedBy().getId(),
                invoice.getProvider() != null ? invoice.getProvider().getId() : null,
                invoice.getProvider() != null ? invoice.getProvider().getName() : null,
                invoice.getOriginalFilename(),
                invoice.getContentType(),
                invoice.getFileSize(),
                invoice.getInvoiceNumber(),
                invoice.getInvoiceDate(),
                invoice.getAmount(),
                invoice.getPatientName(),
                invoice.getStatus().name(),
                invoice.getCreatedAt(),
                invoice.getUpdatedAt()
        );
    }

    public AnalysisResultResponse toAnalysisResultResponse(AnalysisResult result) {
        List<SimilarDocumentResponse> matchedDocs = result.getSimilarDocuments()
                .stream()
                .map(this::toSimilarDocumentResponse)
                .toList();

        return new AnalysisResultResponse(
                result.getId(),
                result.getInvoice().getDocumentId(),
                result.getFraudScore(),
                result.getRiskLevel().name(),
                result.getConfidence(),
                result.getReasons(),
                matchedDocs,
                result.getErrorMessage(),
                result.getAnalyzedAt(),
                result.getCreatedAt()
        );
    }

    public SimilarDocumentResponse toSimilarDocumentResponse(SimilarDocument doc) {
        return new SimilarDocumentResponse(
                doc.getId(),
                doc.getMatchedDocumentId(),
                doc.getMatchedInvoice() != null ? doc.getMatchedInvoice().getId() : null,
                doc.getSimilarity()
        );
    }

    public AlertResponse toAlertResponse(FraudAlert alert) {
        return new AlertResponse(
                alert.getId(),
                alert.getInvoice().getDocumentId(),
                alert.getInvoice().getId(),
                alert.getRiskLevel().name(),
                alert.getStatus().name(),
                alert.getAnalysisResult().getFraudScore(),
                alert.getAnalysisResult().getConfidence(),
                alert.getAssignedTo() != null ? alert.getAssignedTo().getFullName() : null,
                alert.getResolutionNotes(),
                alert.getResolvedAt(),
                alert.getCreatedAt(),
                alert.getUpdatedAt()
        );
    }

    public ProviderResponse toProviderResponse(Provider provider) {
        return new ProviderResponse(
                provider.getId(),
                provider.getName(),
                provider.getRegistrationNumber(),
                provider.getAddress(),
                provider.getPhone(),
                provider.getEmail(),
                provider.getCreatedAt(),
                provider.getUpdatedAt()
        );
    }
}
