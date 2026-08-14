package com.doctrace.backend.dto.response;

import java.util.List;

public record DashboardSummaryResponse(
        long totalInvoices,
        long pendingAnalysis,
        long failedAnalysis,
        long totalAlerts,
        long unreviewedAlerts,
        long redRiskCount,
        long amberRiskCount,
        Double averageFraudScore,
        Double averageConfidence,
        List<AlertResponse> recentAlerts
) {}
