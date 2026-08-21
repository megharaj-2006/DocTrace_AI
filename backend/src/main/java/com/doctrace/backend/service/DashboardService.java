package com.doctrace.backend.service;

import com.doctrace.backend.dto.response.AlertResponse;
import com.doctrace.backend.dto.response.DashboardSummaryResponse;
import com.doctrace.backend.entity.AlertStatus;
import com.doctrace.backend.entity.InvoiceStatus;
import com.doctrace.backend.mapper.EntityMapper;
import com.doctrace.backend.repository.AnalysisResultRepository;
import com.doctrace.backend.repository.FraudAlertRepository;
import com.doctrace.backend.repository.InvoiceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Aggregates statistics across invoices, analyses, and alerts for the frontend dashboard.
 */
@Service
public class DashboardService {

    private final InvoiceRepository invoiceRepository;
    private final AnalysisResultRepository analysisResultRepository;
    private final FraudAlertRepository fraudAlertRepository;
    private final EntityMapper entityMapper;

    public DashboardService(InvoiceRepository invoiceRepository,
                            AnalysisResultRepository analysisResultRepository,
                            FraudAlertRepository fraudAlertRepository,
                            EntityMapper entityMapper) {
        this.invoiceRepository = invoiceRepository;
        this.analysisResultRepository = analysisResultRepository;
        this.fraudAlertRepository = fraudAlertRepository;
        this.entityMapper = entityMapper;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getSummary() {
        long totalInvoices = invoiceRepository.count();
        long pendingAnalysis = invoiceRepository.countByStatus(InvoiceStatus.ANALYZING) 
                             + invoiceRepository.countByStatus(InvoiceStatus.UPLOADED);
        long failedAnalysis = invoiceRepository.countByStatus(InvoiceStatus.FAILED);
        
        long totalAlerts = fraudAlertRepository.count();
        long unreviewedAlerts = fraudAlertRepository.countByStatus(AlertStatus.NEW);
        
        long redRiskCount = analysisResultRepository.countRedRisk();
        long amberRiskCount = analysisResultRepository.countAmberRisk();
        
        Double avgFraudScore = analysisResultRepository.averageFraudScore();
        Double avgConfidence = analysisResultRepository.averageConfidence();
        
        List<AlertResponse> recentAlerts = fraudAlertRepository.findTop10ByOrderByCreatedAtDesc()
                .stream()
                .map(entityMapper::toAlertResponse)
                .toList();
                
        return new DashboardSummaryResponse(
                totalInvoices,
                pendingAnalysis,
                failedAnalysis,
                totalAlerts,
                unreviewedAlerts,
                redRiskCount,
                amberRiskCount,
                avgFraudScore != null ? avgFraudScore : 0.0,
                avgConfidence != null ? avgConfidence : 0.0,
                recentAlerts
        );
    }

    @Transactional(readOnly = true)
    public List<AlertResponse> getRecentAlerts() {
        return fraudAlertRepository.findTop10ByOrderByCreatedAtDesc()
                .stream()
                .map(entityMapper::toAlertResponse)
                .toList();
    }

    public com.doctrace.backend.dto.response.SimilarityStatisticsResponse getSimilarityStatistics() {
        long high = analysisResultRepository.countRedRisk();
        long medium = analysisResultRepository.countAmberRisk();
        long low = analysisResultRepository.countLowRisk();
        return new com.doctrace.backend.dto.response.SimilarityStatisticsResponse(high, medium, low);
    }

    @Transactional(readOnly = true)
    public List<com.doctrace.backend.dto.response.DashboardTrendItem> getTrends() {
        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("dd MMM")
                .withZone(java.time.ZoneId.of("UTC"));

        java.util.Map<String, long[]> countsByDate = new java.util.LinkedHashMap<>();
        
        // Populate last 7 days keys with default 0s
        java.time.Instant now = java.time.Instant.now();
        for (int i = 6; i >= 0; i--) {
            java.time.Instant day = now.minus(i, java.time.temporal.ChronoUnit.DAYS);
            countsByDate.put(formatter.format(day), new long[]{0, 0, 0});
        }

        List<com.doctrace.backend.entity.AnalysisResult> results = analysisResultRepository.findAll();
        for (com.doctrace.backend.entity.AnalysisResult r : results) {
            if (r.getCreatedAt() != null) {
                String dateKey = formatter.format(r.getCreatedAt());
                long[] bucket = countsByDate.computeIfAbsent(dateKey, k -> new long[]{0, 0, 0});
                if (r.getRiskLevel() == com.doctrace.backend.entity.RiskLevel.RED) {
                    bucket[0]++;
                } else if (r.getRiskLevel() == com.doctrace.backend.entity.RiskLevel.AMBER) {
                    bucket[1]++;
                } else {
                    bucket[2]++;
                }
            }
        }

        return countsByDate.entrySet().stream()
                .map(e -> new com.doctrace.backend.dto.response.DashboardTrendItem(
                        e.getKey(), e.getValue()[0], e.getValue()[1], e.getValue()[2]))
                .toList();
    }
}
