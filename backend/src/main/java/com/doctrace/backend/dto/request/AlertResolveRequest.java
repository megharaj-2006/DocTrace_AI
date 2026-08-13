package com.doctrace.backend.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AlertResolveRequest(
        @NotBlank(message = "Resolution is required")
        String resolution
) {}
