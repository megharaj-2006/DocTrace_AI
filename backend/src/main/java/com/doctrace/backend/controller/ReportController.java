package com.doctrace.backend.controller;

import com.doctrace.backend.dto.response.ReportSummaryResponse;
import com.doctrace.backend.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Reports", description = "System reporting and analytics metrics")
@RestController
@RequestMapping("/api/v1/reports")
@org.springframework.transaction.annotation.Transactional(readOnly = true)
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @Operation(summary = "Get aggregated reporting and analytics summary")
    @GetMapping("/summary")
    public ResponseEntity<ReportSummaryResponse> getSummary() {
        return ResponseEntity.ok(reportService.getReportSummary());
    }
}
