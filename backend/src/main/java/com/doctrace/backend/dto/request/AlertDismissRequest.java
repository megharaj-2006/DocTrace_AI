package com.doctrace.backend.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AlertDismissRequest(
        @NotBlank(message = "Reason is required")
        String reason
) {}
