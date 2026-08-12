package com.doctrace.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when a requested entity state transition is not valid
 * (e.g., analyzing an already-analyzed invoice, or resolving a dismissed alert).
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class InvalidStateTransitionException extends RuntimeException {

    public InvalidStateTransitionException(String message) {
        super(message);
    }

    public InvalidStateTransitionException(String entityName, String currentState, String requestedState) {
        super(String.format("Cannot transition %s from %s to %s", entityName, currentState, requestedState));
    }
}
