package com.doctrace.backend.dto.response;

import java.util.List;
import java.util.Map;

public record ReportSummaryResponse(
        long totalInvoices,
        long analyzedInvoices,
        long pendingInvoices,
        long totalAlerts,
        long resolvedAlerts,
        long redRiskCount,
        long amberRiskCount,
        long lowRiskCount,
        Double averageFraudScore,
        Double averageConfidence,
        Map<String, Long> fraudScoreDistribution,
        List<ProviderRiskStat> topProviders,
        List<DailyDocStat> docsOverTime
) {
    public record ProviderRiskStat(
            String name,
            long totalDocs,
            long highRiskDocs,
            Double avgScore
    ) {}

    public record DailyDocStat(
            String date,
            long docs
    ) {}
}
