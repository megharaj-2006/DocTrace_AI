package com.doctrace.backend.dto.response;

import java.time.Instant;

public record ProviderResponse(
        Long id,
        String name,
        String registrationNumber,
        String address,
        String phone,
        String email,
        Instant createdAt,
        Instant updatedAt
) {}
