package com.doctrace.backend.controller;

import com.doctrace.backend.dto.response.AnalysisResultResponse;
import com.doctrace.backend.dto.response.SimilarDocumentResponse;
import com.doctrace.backend.entity.User;
import com.doctrace.backend.service.AnalysisService;
import com.doctrace.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Analysis", description = "Invoice AI analysis and similarity results")
@RestController
@RequestMapping("/api/v1/invoices/{invoiceId}")
public class AnalysisController {

    private final AnalysisService analysisService;
    private final UserService userService;

    public AnalysisController(AnalysisService analysisService, UserService userService) {
        this.analysisService = analysisService;
        this.userService = userService;
    }

    @Operation(summary = "Trigger AI analysis for an invoice")
    @PostMapping("/analyze")
    public ResponseEntity<AnalysisResultResponse> analyze(
            @PathVariable String invoiceId,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userService.findByEmail(userDetails.getUsername());
        AnalysisResultResponse result = analysisService.analyzeInvoice(invoiceId, user);
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "Get the latest analysis result for an invoice")
    @GetMapping("/analysis")
    @Transactional(readOnly = true)
    public ResponseEntity<AnalysisResultResponse> getAnalysis(
            @PathVariable String invoiceId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername());
        return ResponseEntity.ok(analysisService.getLatestAnalysis(invoiceId, user));
    }

    @Operation(summary = "Get full analysis history for an invoice")
    @GetMapping("/analysis/history")
    @Transactional(readOnly = true)
    public ResponseEntity<List<AnalysisResultResponse>> getHistory(
            @PathVariable String invoiceId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername());
        return ResponseEntity.ok(analysisService.getAnalysisHistory(invoiceId, user));
    }

    @Operation(summary = "Get similar documents from the latest analysis")
    @GetMapping("/similar")
    @Transactional(readOnly = true)
    public ResponseEntity<List<SimilarDocumentResponse>> getSimilar(
            @PathVariable String invoiceId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername());
        AnalysisResultResponse result = analysisService.getLatestAnalysis(invoiceId, user);
        return ResponseEntity.ok(result.matchedDocuments());
    }
}

