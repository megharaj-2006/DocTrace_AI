package com.doctrace.backend.entity;

/**
 * Lifecycle status of a fraud alert through the investigator workflow.
 */
public enum AlertStatus {
    /** Newly created alert, not yet reviewed. */
    NEW,
    /** An investigator is actively reviewing this alert. */
    UNDER_REVIEW,
    /** The investigator confirmed the alert and resolved it. */
    RESOLVED,
    /** The investigator dismissed the alert (false positive). */
    DISMISSED
}
