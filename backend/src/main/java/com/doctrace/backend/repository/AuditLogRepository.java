package com.doctrace.backend.repository;

import com.doctrace.backend.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = "user")
    Page<AuditLog> findByUserId(Long userId, Pageable pageable);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = "user")
    Page<AuditLog> findByAction(String action, Pageable pageable);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = "user")
    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
