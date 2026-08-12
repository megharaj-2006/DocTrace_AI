package com.doctrace.backend.entity;

/**
 * Lifecycle status of an invoice through the analysis pipeline.
 */
public enum InvoiceStatus {
    /** Invoice has been uploaded but not yet sent for analysis. */
    UPLOADED,
    /** Invoice is currently being analyzed by the AI service. */
    ANALYZING,
    /** AI analysis completed successfully. */
    ANALYZED,
    /** AI analysis failed (network error, AI service error, etc.). */
    FAILED
}
