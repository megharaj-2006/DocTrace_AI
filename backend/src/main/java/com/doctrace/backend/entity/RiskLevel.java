package com.doctrace.backend.entity;

/**
 * Risk classification levels returned by the AI service.
 * Thresholds are determined by the ML validation process, not hardcoded.
 */
public enum RiskLevel {
    LOW,
    AMBER,
    RED
}
