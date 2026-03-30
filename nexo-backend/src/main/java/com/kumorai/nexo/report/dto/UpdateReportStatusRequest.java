package com.kumorai.nexo.report.dto;

import com.kumorai.nexo.report.entity.ReportStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateReportStatusRequest(
        @NotNull ReportStatus status
) {}
