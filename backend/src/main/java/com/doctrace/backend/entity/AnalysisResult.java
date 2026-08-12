package com.doctrace.backend.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Persisted result of an AI analysis for an invoice.
 *
 * <p>All fraud-scoring fields ({@code fraudScore}, {@code riskLevel},
 * {@code confidence}, {@code reasons}) are received from the AI service
 * and stored verbatim. Spring Boot never calculates these values.</p>
 */
@Entity
@Table(name = "analysis_results", indexes = {
        @Index(name = "idx_analysis_results_invoice", columnList = "invoice_id"),
        @Index(name = "idx_analysis_results_risk_level", columnList = "risk_level")
})
public class AnalysisResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    /** Fraud score from AI service, range [0, 1]. */
    @Column(name = "fraud_score", nullable = false)
    private double fraudScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", nullable = false, length = 10)
    private RiskLevel riskLevel;

    /** Model confidence from AI service, range [0, 1]. */
    @Column(nullable = false)
    private double confidence;

    /** JSON array of explanation strings from the AI service. */
    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "TEXT")
    private List<String> reasons = new ArrayList<>();

    /** Error message when the analysis failed. */
    @Column(name = "error_message", length = 1000)
    private String errorMessage;

    @Column(name = "analyzed_at")
    private Instant analyzedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "analysisResult", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SimilarDocument> similarDocuments = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        if (this.analyzedAt == null) {
            this.analyzedAt = this.createdAt;
        }
    }

    public AnalysisResult() {}

    // ── Accessors ───────────────────────────────────────────────────────────

    public Long getId() { return id; }

    public Invoice getInvoice() { return invoice; }
    public void setInvoice(Invoice invoice) { this.invoice = invoice; }

    public double getFraudScore() { return fraudScore; }
    public void setFraudScore(double fraudScore) { this.fraudScore = fraudScore; }

    public RiskLevel getRiskLevel() { return riskLevel; }
    public void setRiskLevel(RiskLevel riskLevel) { this.riskLevel = riskLevel; }

    public double getConfidence() { return confidence; }
    public void setConfidence(double confidence) { this.confidence = confidence; }

    public List<String> getReasons() { return reasons; }
    public void setReasons(List<String> reasons) { this.reasons = reasons; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public Instant getAnalyzedAt() { return analyzedAt; }
    public void setAnalyzedAt(Instant analyzedAt) { this.analyzedAt = analyzedAt; }

    public Instant getCreatedAt() { return createdAt; }

    public List<SimilarDocument> getSimilarDocuments() { return similarDocuments; }
    public void setSimilarDocuments(List<SimilarDocument> similarDocuments) {
        this.similarDocuments = similarDocuments;
    }

    public void addSimilarDocument(SimilarDocument doc) {
        similarDocuments.add(doc);
        doc.setAnalysisResult(this);
    }
}
