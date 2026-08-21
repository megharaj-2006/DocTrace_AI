package com.doctrace.backend.service;

import com.doctrace.backend.dto.request.AlertStatusUpdateRequest;
import com.doctrace.backend.entity.AlertStatus;
import com.doctrace.backend.entity.FraudAlert;
import com.doctrace.backend.entity.RiskLevel;
import com.doctrace.backend.entity.User;
import com.doctrace.backend.exception.InvalidStateTransitionException;
import com.doctrace.backend.exception.ResourceNotFoundException;
import com.doctrace.backend.repository.FraudAlertRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Manages the investigator workflow for fraud alerts.
 */
@Service
@Transactional(readOnly = true)
public class AlertService {

    private static final Logger log = LoggerFactory.getLogger(AlertService.class);

    private final FraudAlertRepository fraudAlertRepository;
    private final AuditLogService auditLogService;

    public AlertService(FraudAlertRepository fraudAlertRepository,
                        AuditLogService auditLogService) {
        this.fraudAlertRepository = fraudAlertRepository;
        this.auditLogService = auditLogService;
    }

    public FraudAlert findById(Long id) {
        return fraudAlertRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FraudAlert", "id", id));
    }

    public Page<FraudAlert> findAll(Pageable pageable) {
        return fraudAlertRepository.findAll(pageable);
    }

    public Page<FraudAlert> findByStatus(AlertStatus status, Pageable pageable) {
        return fraudAlertRepository.findByStatus(status, pageable);
    }
    
    public Page<FraudAlert> findByRiskLevel(RiskLevel riskLevel, Pageable pageable) {
        return fraudAlertRepository.findByRiskLevel(riskLevel, pageable);
    }
    
    public Page<FraudAlert> findByAssignedTo(Long userId, Pageable pageable) {
        return fraudAlertRepository.findByAssignedToId(userId, pageable);
    }

    @Transactional
    public FraudAlert assignTo(Long alertId, User investigator) {
        FraudAlert alert = findById(alertId);
        
        if (alert.getStatus() == AlertStatus.RESOLVED || alert.getStatus() == AlertStatus.DISMISSED) {
            throw new InvalidStateTransitionException("FraudAlert", alert.getStatus().name(), "UNDER_REVIEW");
        }
        
        alert.setAssignedTo(investigator);
        if (alert.getStatus() == AlertStatus.NEW) {
            alert.setStatus(AlertStatus.UNDER_REVIEW);
        }
        
        alert = fraudAlertRepository.save(alert);
        
        auditLogService.log(investigator, "ALERT_ASSIGNED", "FraudAlert", 
                alert.getId().toString(), "Assigned to " + investigator.getEmail());
                
        return alert;
    }

    @Transactional
    public FraudAlert updateStatus(Long alertId, AlertStatusUpdateRequest request, User investigator) {
        FraudAlert alert = findById(alertId);
        AlertStatus newStatus = AlertStatus.valueOf(request.status());
        
        if (alert.getStatus() == AlertStatus.RESOLVED || alert.getStatus() == AlertStatus.DISMISSED) {
            throw new InvalidStateTransitionException("FraudAlert", alert.getStatus().name(), newStatus.name());
        }
        
        // Auto-assign if not already assigned
        if (alert.getAssignedTo() == null) {
            alert.setAssignedTo(investigator);
        }
        
        alert.setStatus(newStatus);
        
        if (newStatus == AlertStatus.RESOLVED || newStatus == AlertStatus.DISMISSED) {
            alert.setResolvedAt(Instant.now());
            if (request.resolutionNotes() != null) {
                alert.setResolutionNotes(request.resolutionNotes());
            }
        }
        
        alert = fraudAlertRepository.save(alert);
        
        auditLogService.log(investigator, "ALERT_STATUS_UPDATED", "FraudAlert", 
                alert.getId().toString(), "Status changed to " + newStatus.name());
                
        return alert;
    }

    @Transactional
    public FraudAlert resolveAlert(Long alertId, com.doctrace.backend.dto.request.AlertResolveRequest request, User investigator) {
        String notes = request != null ? request.getEffectiveResolution() : "Claim verified and resolved by investigator.";
        return updateStatus(alertId, new AlertStatusUpdateRequest("RESOLVED", notes), investigator);
    }

    @Transactional
    public FraudAlert dismissAlert(Long alertId, com.doctrace.backend.dto.request.AlertDismissRequest request, User investigator) {
        String reason = (request != null && request.reason() != null && !request.reason().isBlank()) 
                ? request.reason() : "False positive template similarity.";
        return updateStatus(alertId, new AlertStatusUpdateRequest("DISMISSED", reason), investigator);
    }
}
