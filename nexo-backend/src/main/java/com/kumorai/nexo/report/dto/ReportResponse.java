package com.kumorai.nexo.report.dto;

import java.time.LocalDateTime;

public record ReportResponse(
        Long id,
        Long userId,
        String reportType,
        String description,
        String evidenceUrl,
        String status,
        LocalDateTime createdAt,
        LocalDateTime resolvedAt
) {}
