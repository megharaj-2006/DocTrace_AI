package com.doctrace.backend.controller;

import com.doctrace.backend.dto.response.DashboardSummaryResponse;
import com.doctrace.backend.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Dashboard", description = "System statistics and aggregates")
@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @Operation(summary = "Get aggregated system statistics")
    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryResponse> getSummary() {
        return ResponseEntity.ok(dashboardService.getSummary());
    }

    @Operation(summary = "Get recent fraud alerts")
    @GetMapping("/recent-alerts")
    public ResponseEntity<java.util.List<com.doctrace.backend.dto.response.AlertResponse>> getRecentAlerts() {
        return ResponseEntity.ok(dashboardService.getRecentAlerts());
    }

    @Operation(summary = "Get similarity statistics")
    @GetMapping("/similarity-statistics")
    public ResponseEntity<com.doctrace.backend.dto.response.SimilarityStatisticsResponse> getSimilarityStatistics() {
        return ResponseEntity.ok(dashboardService.getSimilarityStatistics());
    }

    @Operation(summary = "Get alerts and analysis trends over time")
    @GetMapping("/trends")
    public ResponseEntity<java.util.List<com.doctrace.backend.dto.response.DashboardTrendItem>> getTrends() {
        return ResponseEntity.ok(dashboardService.getTrends());
    }
}
