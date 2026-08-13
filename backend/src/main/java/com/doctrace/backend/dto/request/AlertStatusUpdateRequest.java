package com.doctrace.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record AlertStatusUpdateRequest(
        @NotBlank(message = "Status is required")
        @Pattern(regexp = "^(UNDER_REVIEW|RESOLVED|DISMISSED)$", 
                 message = "Status must be UNDER_REVIEW, RESOLVED, or DISMISSED")
        String status,
        
        String resolutionNotes
) {}
