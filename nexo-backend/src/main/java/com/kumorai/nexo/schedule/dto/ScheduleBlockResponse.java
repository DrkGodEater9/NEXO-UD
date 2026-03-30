package com.kumorai.nexo.schedule.dto;

import java.time.LocalTime;

public record ScheduleBlockResponse(
        Long id,
        Long groupId,
        Long subjectId,
        String color,
        boolean manual,
        String manualLabel,
        String manualDay,
        LocalTime manualStartTime,
        LocalTime manualEndTime
) {}
