package com.doctrace.backend.service;

import com.doctrace.backend.entity.AuditLog;
import com.doctrace.backend.entity.User;
import com.doctrace.backend.repository.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

/**
 * Append-only audit logging for security and business events.
 * Never logs passwords, JWT tokens, or other sensitive data.
 */
@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(User user, String action, String entityType, String entityId, String details) {
        AuditLog entry = new AuditLog(user, action, entityType, entityId, details);
        auditLogRepository.save(entry);
    }

    public void log(User user, String action, String entityType, String entityId,
                    String details, String ipAddress) {
        AuditLog entry = new AuditLog(user, action, entityType, entityId, details);
        entry.setIpAddress(ipAddress);
        auditLogRepository.save(entry);
    }

    public Page<AuditLog> findAll(Pageable pageable) {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    public Page<AuditLog> findByUserId(Long userId, Pageable pageable) {
        return auditLogRepository.findByUserId(userId, pageable);
    }
}
