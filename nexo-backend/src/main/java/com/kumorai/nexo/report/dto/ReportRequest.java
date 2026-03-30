package com.kumorai.nexo.report.dto;

import com.kumorai.nexo.report.entity.ReportType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReportRequest(
        @NotNull ReportType reportType,
        @NotBlank @Size(max = 2000) String description,
        String evidenceUrl
) {}
