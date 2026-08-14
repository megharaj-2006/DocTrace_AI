package com.doctrace.backend.repository;

import com.doctrace.backend.entity.AlertStatus;
import com.doctrace.backend.entity.FraudAlert;
import com.doctrace.backend.entity.RiskLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FraudAlertRepository extends JpaRepository<FraudAlert, Long> {

    Page<FraudAlert> findByStatus(AlertStatus status, Pageable pageable);

    Page<FraudAlert> findByRiskLevel(RiskLevel riskLevel, Pageable pageable);

    Page<FraudAlert> findByAssignedToId(Long userId, Pageable pageable);

    List<FraudAlert> findTop10ByOrderByCreatedAtDesc();

    long countByStatus(AlertStatus status);

    long countByRiskLevel(RiskLevel riskLevel);
}
