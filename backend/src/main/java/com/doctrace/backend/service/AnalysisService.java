package com.doctrace.backend.service;

import com.doctrace.backend.client.AiServiceClient;
import com.doctrace.backend.client.dto.AiAnalysisResponse;
import com.doctrace.backend.dto.response.AnalysisResultResponse;
import com.doctrace.backend.entity.*;
import com.doctrace.backend.exception.AiServiceException;
import com.doctrace.backend.exception.InvalidStateTransitionException;
import com.doctrace.backend.exception.ResourceNotFoundException;
import com.doctrace.backend.mapper.EntityMapper;
import com.doctrace.backend.repository.AnalysisResultRepository;
import com.doctrace.backend.repository.FraudAlertRepository;
import com.doctrace.backend.repository.InvoiceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;

/**
 * Orchestrates the invoice analysis workflow:
 * load invoice → call AI service → persist results → create alerts.
 *
 * <p>The transaction is NOT held open during the AI HTTP call. The invoice
 * status is updated in a separate transaction before the call, and the
 * results are persisted in a new transaction afterwards.</p>
 */
@Service
public class AnalysisService {

    private static final Logger log = LoggerFactory.getLogger(AnalysisService.class);

    private final InvoiceRepository invoiceRepository;
    private final AnalysisResultRepository analysisResultRepository;
    private final FraudAlertRepository fraudAlertRepository;
    private final com.doctrace.backend.repository.ProviderRepository providerRepository;
    private final AiServiceClient aiServiceClient;
    private final FileStorageService fileStorageService;
    private final AuditLogService auditLogService;
    private final EntityMapper entityMapper;

    public AnalysisService(InvoiceRepository invoiceRepository,
                           AnalysisResultRepository analysisResultRepository,
                           FraudAlertRepository fraudAlertRepository,
                           com.doctrace.backend.repository.ProviderRepository providerRepository,
                           AiServiceClient aiServiceClient,
                           FileStorageService fileStorageService,
                           AuditLogService auditLogService,
                           EntityMapper entityMapper) {
        this.invoiceRepository = invoiceRepository;
        this.analysisResultRepository = analysisResultRepository;
        this.fraudAlertRepository = fraudAlertRepository;
        this.providerRepository = providerRepository;
        this.aiServiceClient = aiServiceClient;
        this.fileStorageService = fileStorageService;
        this.auditLogService = auditLogService;
        this.entityMapper = entityMapper;
    }

    /**
     * Analyze an invoice via the AI service.
     * The workflow: mark ANALYZING → call AI → persist result → create alert if needed → mark ANALYZED.
     * The uploaded invoice binary is preserved in storage for subsequent investigator download and audit.
     */
    public AnalysisResultResponse analyzeInvoice(Long invoiceId, User requestedBy) {
        return analyzeInvoice(String.valueOf(invoiceId), requestedBy);
    }

    public AnalysisResultResponse analyzeInvoice(String invoiceIdentifier, User requestedBy) {
        Invoice invoice = findInvoiceByIdentifier(invoiceIdentifier);

        validateAccess(invoice, requestedBy);

        // Validate state transition
        if (invoice.getStatus() == InvoiceStatus.ANALYZING) {
            throw new InvalidStateTransitionException(
                    "Invoice", invoice.getStatus().name(), "ANALYZING");
        }

        // Mark as ANALYZING
        invoice.setStatus(InvoiceStatus.ANALYZING);
        invoiceRepository.save(invoice);

        try {
            // Read file bytes (outside transaction to avoid holding DB connection)
            byte[] fileBytes = readInvoiceFile(invoice);

            // Call AI service (synchronous, can take seconds)
            AiAnalysisResponse aiResponse = aiServiceClient.analyze(
                    fileBytes,
                    invoice.getOriginalFilename(),
                    invoice.getContentType(),
                    invoice.getDocumentId()
            );

            // Persist results & auto-link provider if extracted
            return persistAnalysisResult(invoice, aiResponse, requestedBy);

        } catch (AiServiceException e) {
            // Mark as FAILED and persist error
            markFailed(invoice, e.getMessage());
            throw e;
        } catch (Exception e) {
            markFailed(invoice, e.getMessage());
            throw new AiServiceException("Analysis failed: " + e.getMessage(), e);
        }
    }

    public Invoice findInvoiceByIdentifier(String identifier) {
        try {
            Long id = Long.parseLong(identifier);
            return invoiceRepository.findById(id)
                    .orElseGet(() -> invoiceRepository.findByDocumentId(identifier)
                            .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", identifier)));
        } catch (NumberFormatException e) {
            return invoiceRepository.findByDocumentId(identifier)
                    .orElseThrow(() -> new ResourceNotFoundException("Invoice", "documentId", identifier));
        }
    }

    private void validateAccess(Invoice invoice, User user) {
        if (user.getRole() == Role.ADMIN || user.getRole() == Role.INVESTIGATOR) {
            return;
        }

        if (invoice.getUploadedBy() == null || !invoice.getUploadedBy().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Invoice", "id", invoice.getId());
        }
    }

    @Transactional
    protected AnalysisResultResponse persistAnalysisResult(
            Invoice invoice, AiAnalysisResponse aiResponse, User requestedBy) {

        RiskLevel riskLevel = RiskLevel.valueOf(aiResponse.riskLevel());

        AnalysisResult result = new AnalysisResult();
        result.setInvoice(invoice);
        result.setFraudScore(aiResponse.fraudScore());
        result.setRiskLevel(riskLevel);
        result.setConfidence(aiResponse.confidence());
        result.setReasons(aiResponse.reasons() != null ? aiResponse.reasons() : List.of());
        result.setAnalyzedAt(Instant.now());

        // Extract and auto-link provider if identified in reasons
        if (aiResponse.reasons() != null) {
            for (String reason : aiResponse.reasons()) {
                if (reason != null && reason.contains("Detected healthcare provider: '")) {
                    int start = reason.indexOf("Detected healthcare provider: '") + 31;
                    int end = reason.indexOf("'", start);
                    if (start > 0 && end > start) {
                        String provName = reason.substring(start, end).trim();
                        if (!provName.isEmpty()) {
                            Provider provider = providerRepository.findFirstByNameIgnoreCase(provName)
                                    .orElseGet(() -> providerRepository.save(new Provider(provName)));
                            invoice.setProvider(provider);
                            break;
                        }
                    }
                }
            }
        }

        // Add matched documents
        if (aiResponse.matchedDocuments() != null) {
            for (var matched : aiResponse.matchedDocuments()) {
                SimilarDocument simDoc = new SimilarDocument(
                        matched.documentId(), matched.similarity());

                // Try to resolve the matched document FK
                invoiceRepository.findByDocumentId(matched.documentId())
                        .ifPresent(simDoc::setMatchedInvoice);

                result.addSimilarDocument(simDoc);
            }
        }

        result = analysisResultRepository.save(result);

        // Update invoice status
        invoice.setStatus(InvoiceStatus.ANALYZED);
        invoiceRepository.save(invoice);

        // Create fraud alert if risk is AMBER or RED
        if (riskLevel == RiskLevel.AMBER || riskLevel == RiskLevel.RED) {
            createFraudAlert(result, invoice, riskLevel);
        }

        auditLogService.log(requestedBy, "ANALYSIS_COMPLETED", "Invoice",
                invoice.getId().toString(),
                "Risk: " + riskLevel + ", Score: " + aiResponse.fraudScore());

        log.info("Analysis persisted: invoiceId={}, riskLevel={}, fraudScore={}",
                invoice.getId(), riskLevel, aiResponse.fraudScore());

        return entityMapper.toAnalysisResultResponse(result);
    }

    private void createFraudAlert(AnalysisResult result, Invoice invoice, RiskLevel riskLevel) {
        FraudAlert alert = new FraudAlert();
        alert.setAnalysisResult(result);
        alert.setInvoice(invoice);
        alert.setRiskLevel(riskLevel);
        alert.setStatus(AlertStatus.NEW);
        fraudAlertRepository.save(alert);

        log.info("Fraud alert created: invoiceId={}, riskLevel={}", invoice.getId(), riskLevel);
    }

    private void markFailed(Invoice invoice, String errorMessage) {
        invoice.setStatus(InvoiceStatus.FAILED);
        invoiceRepository.save(invoice);
        log.warn("Analysis failed for invoice {}: {}", invoice.getId(), errorMessage);
    }

    private byte[] readInvoiceFile(Invoice invoice) {
        Path filePath = fileStorageService.getUploadDir()
                .resolve(invoice.getStoredFilename()).normalize();
        try {
            return Files.readAllBytes(filePath);
        } catch (IOException e) {
            throw new AiServiceException("Failed to read invoice file for analysis", e);
        }
    }

    @Transactional(readOnly = true)
    public AnalysisResultResponse getLatestAnalysis(Long invoiceId, User user) {
        return getLatestAnalysis(String.valueOf(invoiceId), user);
    }

    @Transactional(readOnly = true)
    public AnalysisResultResponse getLatestAnalysis(String invoiceIdentifier, User user) {
        Invoice invoice = findInvoiceByIdentifier(invoiceIdentifier);
        validateAccess(invoice, user);

        AnalysisResult result = analysisResultRepository
                .findTopByInvoiceIdOrderByCreatedAtDesc(invoice.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No analysis found for invoice " + invoiceIdentifier));

        // Eagerly fetch similar documents for the response
        result = analysisResultRepository.findByIdWithSimilarDocuments(result.getId())
                .orElse(result);

        return entityMapper.toAnalysisResultResponse(result);
    }

    @Transactional(readOnly = true)
    public List<AnalysisResultResponse> getAnalysisHistory(Long invoiceId, User user) {
        return getAnalysisHistory(String.valueOf(invoiceId), user);
    }

    @Transactional(readOnly = true)
    public List<AnalysisResultResponse> getAnalysisHistory(String invoiceIdentifier, User user) {
        Invoice invoice = findInvoiceByIdentifier(invoiceIdentifier);
        validateAccess(invoice, user);

        return analysisResultRepository.findByInvoiceIdOrderByCreatedAtDesc(invoice.getId())
                .stream()
                .map(entityMapper::toAnalysisResultResponse)
                .toList();
    }
}
