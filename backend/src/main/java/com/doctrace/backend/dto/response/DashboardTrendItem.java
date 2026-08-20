package com.doctrace.backend.dto.response;

public record DashboardTrendItem(
        String date,
        long red,
        long amber,
        long low
) {}
