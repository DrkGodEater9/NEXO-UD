package com.kumorai.nexo.content.dto;

import java.time.LocalDate;

public record CalendarEventResponse(
        Long id,
        String title,
        String description,
        String eventType,
        LocalDate startDate,
        LocalDate endDate,
        Long createdBy
) {}
