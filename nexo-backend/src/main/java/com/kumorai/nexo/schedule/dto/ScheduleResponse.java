package com.kumorai.nexo.schedule.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ScheduleResponse(
        Long id,
        Long userId,
        String name,
        String semester,
        String notes,
        int totalCredits,
        boolean archived,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<ScheduleBlockResponse> blocks
) {}
