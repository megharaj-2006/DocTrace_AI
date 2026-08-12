package com.doctrace.backend.controller;

import com.doctrace.backend.entity.AuditLog;
import com.doctrace.backend.service.AuditLogService;
import com.doctrace.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Admin", description = "System administration endpoints")
@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final AuditLogService auditLogService;
    private final UserService userService;
    private final com.doctrace.backend.service.DashboardService dashboardService;
    private final com.doctrace.backend.mapper.EntityMapper entityMapper;

    public AdminController(AuditLogService auditLogService, UserService userService,
                           com.doctrace.backend.service.DashboardService dashboardService,
                           com.doctrace.backend.mapper.EntityMapper entityMapper) {
        this.auditLogService = auditLogService;
        this.userService = userService;
        this.dashboardService = dashboardService;
        this.entityMapper = entityMapper;
    }

    @Operation(summary = "View system audit logs (ADMIN only)")
    @GetMapping("/audit-logs")
    public ResponseEntity<Page<AuditLog>> getAuditLogs(@PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(auditLogService.findAll(pageable));
    }
    
    @Operation(summary = "Update a user's role (ADMIN only)")
    @PatchMapping("/users/{id}/role")
    public ResponseEntity<Void> updateUserRole(
            @PathVariable Long id,
            @RequestParam String role) {
        userService.updateRole(id, role);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "List all users (ADMIN only)")
    @GetMapping("/users")
    public ResponseEntity<Page<com.doctrace.backend.dto.response.UserResponse>> getUsers(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(userService.findAll(pageable).map(entityMapper::toUserResponse));
    }
    
    @Operation(summary = "Get system-wide statistics (ADMIN only)")
    @GetMapping("/statistics")
    public ResponseEntity<com.doctrace.backend.dto.response.DashboardSummaryResponse> getStatistics() {
        return ResponseEntity.ok(dashboardService.getSummary());
    }
}
