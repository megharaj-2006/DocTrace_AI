package com.doctrace.backend.controller;

import com.doctrace.backend.dto.request.AlertStatusUpdateRequest;
import com.doctrace.backend.dto.response.AlertResponse;
import com.doctrace.backend.entity.AlertStatus;
import com.doctrace.backend.entity.FraudAlert;
import com.doctrace.backend.entity.RiskLevel;
import com.doctrace.backend.entity.User;
import com.doctrace.backend.mapper.EntityMapper;
import com.doctrace.backend.service.AlertService;
import com.doctrace.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Alerts", description = "Fraud alert management and investigator workflow")
@RestController
@RequestMapping("/api/v1/alerts")
public class AlertController {

    private final AlertService alertService;
    private final UserService userService;
    private final EntityMapper entityMapper;

    public AlertController(AlertService alertService,
                           UserService userService,
                           EntityMapper entityMapper) {
        this.alertService = alertService;
        this.userService = userService;
        this.entityMapper = entityMapper;
    }

    @Operation(summary = "List all fraud alerts (paginated, optional filters)")
    @GetMapping
    public ResponseEntity<Page<AlertResponse>> list(
            @RequestParam(required = false) AlertStatus status,
            @RequestParam(required = false) RiskLevel riskLevel,
            @RequestParam(required = false) Long assignedTo,
            @PageableDefault(size = 20) Pageable pageable) {
        
        Page<FraudAlert> alerts;
        if (status != null) {
            alerts = alertService.findByStatus(status, pageable);
        } else if (riskLevel != null) {
            alerts = alertService.findByRiskLevel(riskLevel, pageable);
        } else if (assignedTo != null) {
            alerts = alertService.findByAssignedTo(assignedTo, pageable);
        } else {
            alerts = alertService.findAll(pageable);
        }
        
        return ResponseEntity.ok(alerts.map(entityMapper::toAlertResponse));
    }

    @Operation(summary = "Get alert details by ID")
    @GetMapping("/{id}")
    public ResponseEntity<AlertResponse> getById(@PathVariable Long id) {
        FraudAlert alert = alertService.findById(id);
        return ResponseEntity.ok(entityMapper.toAlertResponse(alert));
    }

    @Operation(summary = "Assign alert to current investigator")
    @PostMapping("/{id}/assign")
    public ResponseEntity<AlertResponse> assign(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User investigator = userService.findByEmail(userDetails.getUsername());
        FraudAlert alert = alertService.assignTo(id, investigator);
        return ResponseEntity.ok(entityMapper.toAlertResponse(alert));
    }

    @Operation(summary = "Update alert status (e.g., to RESOLVED or DISMISSED)")
    @PatchMapping("/{id}/status")
    public ResponseEntity<AlertResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody AlertStatusUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User investigator = userService.findByEmail(userDetails.getUsername());
        FraudAlert alert = alertService.updateStatus(id, request, investigator);
        return ResponseEntity.ok(entityMapper.toAlertResponse(alert));
    }

    @Operation(summary = "Mark an alert as resolved")
    @PostMapping("/{id}/resolve")
    public ResponseEntity<AlertResponse> resolve(
            @PathVariable Long id,
            @Valid @RequestBody com.doctrace.backend.dto.request.AlertResolveRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User investigator = userService.findByEmail(userDetails.getUsername());
        FraudAlert alert = alertService.resolveAlert(id, request, investigator);
        return ResponseEntity.ok(entityMapper.toAlertResponse(alert));
    }

    @Operation(summary = "Dismiss an alert as a false positive")
    @PostMapping("/{id}/dismiss")
    public ResponseEntity<AlertResponse> dismiss(
            @PathVariable Long id,
            @Valid @RequestBody com.doctrace.backend.dto.request.AlertDismissRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User investigator = userService.findByEmail(userDetails.getUsername());
        FraudAlert alert = alertService.dismissAlert(id, request, investigator);
        return ResponseEntity.ok(entityMapper.toAlertResponse(alert));
    }
}
