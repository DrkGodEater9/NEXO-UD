package com.kumorai.nexo.schedule.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record ScheduleRequest(
        @NotBlank String name,
        @NotBlank String semester,
        String notes,
        @NotNull List<ScheduleBlockRequest> blocks
) {}
