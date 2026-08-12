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
}
