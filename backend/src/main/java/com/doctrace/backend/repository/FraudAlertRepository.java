package com.doctrace.backend.repository;

import com.doctrace.backend.entity.AlertStatus;
import com.doctrace.backend.entity.FraudAlert;
import com.doctrace.backend.entity.RiskLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FraudAlertRepository extends JpaRepository<FraudAlert, Long> {

    @Override
    @EntityGraph(attributePaths = {"invoice", "analysisResult", "assignedTo"})
    Optional<FraudAlert> findById(Long id);

    @Override
    @EntityGraph(attributePaths = {"invoice", "analysisResult", "assignedTo"})
    Page<FraudAlert> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"invoice", "analysisResult", "assignedTo"})
    Page<FraudAlert> findByStatus(AlertStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"invoice", "analysisResult", "assignedTo"})
    Page<FraudAlert> findByRiskLevel(RiskLevel riskLevel, Pageable pageable);

    @EntityGraph(attributePaths = {"invoice", "analysisResult", "assignedTo"})
    Page<FraudAlert> findByAssignedToId(Long userId, Pageable pageable);

    @EntityGraph(attributePaths = {"invoice", "analysisResult", "assignedTo"})
    List<FraudAlert> findTop10ByOrderByCreatedAtDesc();

    long countByStatus(AlertStatus status);

    long countByRiskLevel(RiskLevel riskLevel);
}

