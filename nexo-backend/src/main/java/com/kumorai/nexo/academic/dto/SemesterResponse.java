package com.kumorai.nexo.academic.dto;

import java.time.LocalDateTime;

public record SemesterResponse(
        Long id,
        String name,
        boolean active,
        LocalDateTime createdAt
) {}
