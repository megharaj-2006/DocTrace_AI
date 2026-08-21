package com.doctrace.backend.dto.request;

public record AlertResolveRequest(
        String resolution,
        String resolutionNotes
) {
    public String getEffectiveResolution() {
        if (resolution != null && !resolution.isBlank()) return resolution;
        if (resolutionNotes != null && !resolutionNotes.isBlank()) return resolutionNotes;
        return "Claim verified and resolved by investigator.";
    }
}

