package com.doctrace.backend.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * A document found by the AI service to be similar to the analyzed invoice.
 * Maps to entries in the {@code matchedDocuments} array of the frozen AI response.
 */
@Entity
@Table(name = "similar_documents", indexes = {
        @Index(name = "idx_similar_documents_analysis", columnList = "analysis_result_id"),
        @Index(name = "idx_similar_documents_matched", columnList = "matched_document_id")
})
public class SimilarDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "analysis_result_id", nullable = false)
    private AnalysisResult analysisResult;

    /** The documentId of the matched invoice as returned by the AI service. */
    @Column(name = "matched_document_id", nullable = false, length = 50)
    private String matchedDocumentId;

    /**
     * Optional resolved FK to the Invoice table. Nullable because the matched
     * document might reference an invoice we haven't ingested yet.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "matched_invoice_id")
    private Invoice matchedInvoice;

    /** Cosine similarity score from the AI service. */
    @Column(nullable = false)
    private double similarity;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }

    protected SimilarDocument() {}

    public SimilarDocument(String matchedDocumentId, double similarity) {
        this.matchedDocumentId = matchedDocumentId;
        this.similarity = similarity;
    }

    // ── Accessors ───────────────────────────────────────────────────────────

    public Long getId() { return id; }

    public AnalysisResult getAnalysisResult() { return analysisResult; }
    public void setAnalysisResult(AnalysisResult analysisResult) { this.analysisResult = analysisResult; }

    public String getMatchedDocumentId() { return matchedDocumentId; }
    public void setMatchedDocumentId(String matchedDocumentId) { this.matchedDocumentId = matchedDocumentId; }

    public Invoice getMatchedInvoice() { return matchedInvoice; }
    public void setMatchedInvoice(Invoice matchedInvoice) { this.matchedInvoice = matchedInvoice; }

    public double getSimilarity() { return similarity; }
    public void setSimilarity(double similarity) { this.similarity = similarity; }

    public Instant getCreatedAt() { return createdAt; }
}
