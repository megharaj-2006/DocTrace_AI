package com.doctrace.backend.exception;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.List;

/**
 * Consistent JSON error response returned by all API error paths.
 *
 * <p>Never includes stack traces, internal implementation details, or
 * sensitive information such as database credentials or JWT secrets.</p>
 *
 * @param timestamp ISO-8601 instant when the error occurred
 * @param status    HTTP status code
 * @param error     HTTP status reason phrase
 * @param message   human-readable error description (safe to show to clients)
 * @param path      request URI that caused the error
 * @param errors    optional list of field-level validation errors
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        List<FieldError> errors
) {

    /**
     * Convenience factory for simple error responses without field-level detail.
     */
    public static ErrorResponse of(int status, String error, String message, String path) {
        return new ErrorResponse(Instant.now(), status, error, message, path, null);
    }

    /**
     * Factory for validation errors that include per-field detail.
     */
    public static ErrorResponse ofValidation(String message, String path, List<FieldError> errors) {
        return new ErrorResponse(Instant.now(), 400, "Bad Request", message, path, errors);
    }

    /**
     * Individual field validation error.
     *
     * @param field   the field name that failed validation
     * @param message the validation failure message
     */
    public record FieldError(String field, String message) {}
}
