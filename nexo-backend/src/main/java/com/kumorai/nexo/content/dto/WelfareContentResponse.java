package com.kumorai.nexo.content.dto;

import java.time.LocalDateTime;

public record WelfareContentResponse(
        Long id,
        String title,
        String description,
        String category,
        String links,
        String images,
        Long createdBy,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
