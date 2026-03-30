package com.kumorai.nexo.content.dto;

import com.kumorai.nexo.content.entity.CalendarEventType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record CalendarEventRequest(
        @NotBlank String title,
        String description,
        @NotNull CalendarEventType eventType,
        @NotNull LocalDate startDate,
        LocalDate endDate
) {}
