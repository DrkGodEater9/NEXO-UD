package com.kumorai.nexo.schedule.dto;

import com.kumorai.nexo.academic.entity.DayOfWeek;

import java.time.LocalTime;

public record ScheduleBlockRequest(
        Long groupId,
        Long subjectId,
        String color,
        boolean manual,
        String manualLabel,
        DayOfWeek manualDay,
        LocalTime manualStartTime,
        LocalTime manualEndTime
) {}
