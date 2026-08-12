package com.doctrace.backend.dto.response;

import java.time.Instant;

/**
 * User information exposed through APIs.
 * Never includes the password hash.
 */
public record UserResponse(
        Long id,
        String email,
        String fullName,
        String role,
        boolean enabled,
        Instant createdAt
) {}
