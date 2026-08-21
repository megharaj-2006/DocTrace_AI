package com.doctrace.backend.repository;

import com.doctrace.backend.entity.AnalysisResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AnalysisResultRepository extends JpaRepository<AnalysisResult, Long> {

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"similarDocuments", "invoice"})
    Optional<AnalysisResult> findTopByInvoiceIdOrderByCreatedAtDesc(Long invoiceId);

    /** Full analysis history for an invoice, newest first. */
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"similarDocuments", "invoice"})
    List<AnalysisResult> findByInvoiceIdOrderByCreatedAtDesc(Long invoiceId);

    @Query("SELECT COUNT(ar) FROM AnalysisResult ar WHERE ar.riskLevel = com.doctrace.backend.entity.RiskLevel.RED")
    long countRedRisk();

    @Query("SELECT COUNT(ar) FROM AnalysisResult ar WHERE ar.riskLevel = com.doctrace.backend.entity.RiskLevel.AMBER")
    long countAmberRisk();

    @Query("SELECT COUNT(ar) FROM AnalysisResult ar WHERE ar.riskLevel = com.doctrace.backend.entity.RiskLevel.LOW")
    long countLowRisk();

    @Query("SELECT AVG(ar.fraudScore) FROM AnalysisResult ar")
    Double averageFraudScore();

    @Query("SELECT AVG(ar.confidence) FROM AnalysisResult ar")
    Double averageConfidence();

    @Query("""
            SELECT ar FROM AnalysisResult ar
            JOIN FETCH ar.similarDocuments
            WHERE ar.id = :id
            """)
    Optional<AnalysisResult> findByIdWithSimilarDocuments(@Param("id") Long id);

    @Query(value = "SELECT ar FROM AnalysisResult ar LEFT JOIN FETCH ar.similarDocuments LEFT JOIN FETCH ar.invoice",
           countQuery = "SELECT COUNT(ar) FROM AnalysisResult ar")
    org.springframework.data.domain.Page<AnalysisResult> findAll(org.springframework.data.domain.Pageable pageable);
}
