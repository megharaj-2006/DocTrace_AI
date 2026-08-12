package com.doctrace.backend.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Immutable audit log entry for security-critical and business-critical events.
 * Entries are append-only — never updated or deleted.
 */
@Entity
@Table(name = "audit_logs", indexes = {
        @Index(name = "idx_audit_logs_user_created", columnList = "user_id, created_at"),
        @Index(name = "idx_audit_logs_action", columnList = "action"),
        @Index(name = "idx_audit_logs_entity", columnList = "entity_type, entity_id")
})
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** User who performed the action; null for system-initiated events. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    /** Action name (e.g. "INVOICE_UPLOADED", "ALERT_RESOLVED"). */
    @Column(nullable = false, length = 100)
    private String action;

    /** Entity type affected (e.g. "Invoice", "FraudAlert"). */
    @Column(name = "entity_type", length = 50)
    private String entityType;

    /** Identifier of the affected entity. */
    @Column(name = "entity_id", length = 50)
    private String entityId;

    /** Additional context (free-text, no sensitive data). */
    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }

    protected AuditLog() {}

    public AuditLog(User user, String action, String entityType, String entityId, String details) {
        this.user = user;
        this.action = action;
        this.entityType = entityType;
        this.entityId = entityId;
        this.details = details;
    }

    // ── Accessors ───────────────────────────────────────────────────────────

    public Long getId() { return id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getAction() { return action; }

    public String getEntityType() { return entityType; }

    public String getEntityId() { return entityId; }

    public String getDetails() { return details; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public Instant getCreatedAt() { return createdAt; }
}
