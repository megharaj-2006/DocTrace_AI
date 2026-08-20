package com.doctrace.backend.service;

import com.doctrace.backend.dto.response.ReportSummaryResponse;
import com.doctrace.backend.dto.response.ReportSummaryResponse.DailyDocStat;
import com.doctrace.backend.dto.response.ReportSummaryResponse.ProviderRiskStat;
import com.doctrace.backend.entity.AlertStatus;
import com.doctrace.backend.entity.AnalysisResult;
import com.doctrace.backend.entity.Invoice;
import com.doctrace.backend.entity.InvoiceStatus;
import com.doctrace.backend.entity.Provider;
import com.doctrace.backend.entity.RiskLevel;
import com.doctrace.backend.repository.AnalysisResultRepository;
import com.doctrace.backend.repository.FraudAlertRepository;
import com.doctrace.backend.repository.InvoiceRepository;
import com.doctrace.backend.repository.ProviderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final InvoiceRepository invoiceRepository;
    private final AnalysisResultRepository analysisResultRepository;
    private final FraudAlertRepository fraudAlertRepository;
    private final ProviderRepository providerRepository;

    public ReportService(InvoiceRepository invoiceRepository,
                         AnalysisResultRepository analysisResultRepository,
                         FraudAlertRepository fraudAlertRepository,
                         ProviderRepository providerRepository) {
        this.invoiceRepository = invoiceRepository;
        this.analysisResultRepository = analysisResultRepository;
        this.fraudAlertRepository = fraudAlertRepository;
        this.providerRepository = providerRepository;
    }

    @Transactional(readOnly = true)
    public ReportSummaryResponse getReportSummary() {
        long totalInvoices = invoiceRepository.count();
        long analyzedInvoices = invoiceRepository.countByStatus(InvoiceStatus.ANALYZED);
        long pendingInvoices = invoiceRepository.countByStatus(InvoiceStatus.ANALYZING)
                             + invoiceRepository.countByStatus(InvoiceStatus.UPLOADED);

        long totalAlerts = fraudAlertRepository.count();
        long resolvedAlerts = fraudAlertRepository.countByStatus(AlertStatus.RESOLVED);

        long redCount = analysisResultRepository.countRedRisk();
        long amberCount = analysisResultRepository.countAmberRisk();
        long lowCount = analysisResultRepository.countLowRisk();

        Double avgScore = analysisResultRepository.averageFraudScore();
        Double avgConf = analysisResultRepository.averageConfidence();

        List<AnalysisResult> allAnalyses = analysisResultRepository.findAll();

        // 1. Fraud score buckets
        Map<String, Long> scoreDist = new LinkedHashMap<>();
        scoreDist.put("0.0 - 0.2", 0L);
        scoreDist.put("0.2 - 0.4", 0L);
        scoreDist.put("0.4 - 0.6", 0L);
        scoreDist.put("0.6 - 0.8", 0L);
        scoreDist.put("0.8 - 1.0", 0L);

        for (AnalysisResult ar : allAnalyses) {
            double score = ar.getFraudScore();
            if (score <= 0.2) scoreDist.put("0.0 - 0.2", scoreDist.get("0.0 - 0.2") + 1);
            else if (score <= 0.4) scoreDist.put("0.2 - 0.4", scoreDist.get("0.2 - 0.4") + 1);
            else if (score <= 0.6) scoreDist.put("0.4 - 0.6", scoreDist.get("0.4 - 0.6") + 1);
            else if (score <= 0.8) scoreDist.put("0.6 - 0.8", scoreDist.get("0.6 - 0.8") + 1);
            else scoreDist.put("0.8 - 1.0", scoreDist.get("0.8 - 1.0") + 1);
        }

        // 2. Docs over time (last 7 days)
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM").withZone(ZoneId.of("UTC"));
        Map<String, Long> docsByDate = new LinkedHashMap<>();
        Instant now = Instant.now();
        for (int i = 6; i >= 0; i--) {
            Instant day = now.minus(i, ChronoUnit.DAYS);
            docsByDate.put(formatter.format(day), 0L);
        }

        List<Invoice> invoices = invoiceRepository.findAll();
        for (Invoice inv : invoices) {
            if (inv.getCreatedAt() != null) {
                String dStr = formatter.format(inv.getCreatedAt());
                docsByDate.put(dStr, docsByDate.getOrDefault(dStr, 0L) + 1);
            }
        }

        List<DailyDocStat> dailyStats = docsByDate.entrySet().stream()
                .map(e -> new DailyDocStat(e.getKey(), e.getValue()))
                .toList();

        // 3. Provider risk breakdown
        List<Provider> providers = providerRepository.findAll();
        List<ProviderRiskStat> providerStats = new ArrayList<>();
        for (Provider p : providers) {
            List<Invoice> pInvoices = invoiceRepository.findByProviderId(p.getId(), org.springframework.data.domain.Pageable.unpaged()).getContent();
            long pTotal = pInvoices.size();
            long pHighRisk = 0;
            double pScoreSum = 0;
            int scoreCount = 0;

            for (Invoice inv : pInvoices) {
                Optional<AnalysisResult> latestAnal = analysisResultRepository.findTopByInvoiceIdOrderByCreatedAtDesc(inv.getId());
                if (latestAnal.isPresent()) {
                    AnalysisResult ar = latestAnal.get();
                    if (ar.getRiskLevel() == RiskLevel.RED) pHighRisk++;
                    pScoreSum += ar.getFraudScore();
                    scoreCount++;
                }
            }

            Double pAvg = scoreCount > 0 ? (pScoreSum / scoreCount) : 0.0;
            providerStats.add(new ProviderRiskStat(p.getName(), pTotal, pHighRisk, pAvg));
        }

        return new ReportSummaryResponse(
                totalInvoices,
                analyzedInvoices,
                pendingInvoices,
                totalAlerts,
                resolvedAlerts,
                redCount,
                amberCount,
                lowCount,
                avgScore != null ? avgScore : 0.0,
                avgConf != null ? avgConf : 0.0,
                scoreDist,
                providerStats,
                dailyStats
        );
    }
}
