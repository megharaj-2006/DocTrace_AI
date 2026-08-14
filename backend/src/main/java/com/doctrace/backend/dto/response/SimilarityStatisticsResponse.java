package com.doctrace.backend.dto.response;

public record SimilarityStatisticsResponse(
        long highSimilarityCount,
        long mediumSimilarityCount,
        long lowSimilarityCount
) {}
