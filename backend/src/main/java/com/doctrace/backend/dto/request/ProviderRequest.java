package com.doctrace.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProviderRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 255)
        String name,
        
        @NotBlank(message = "Registration number is required")
        @Size(max = 100)
        String registrationNumber,
        
        @Size(max = 500)
        String address,
        
        @Size(max = 50)
        String phone,
        
        @Size(max = 255)
        String email
) {}
