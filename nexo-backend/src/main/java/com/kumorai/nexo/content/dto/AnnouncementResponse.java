package com.kumorai.nexo.content.dto;

import java.time.LocalDateTime;

public record AnnouncementResponse(
        Long id,
        String title,
        String body,
        String scope,
        String type,
        String faculty,
        Long createdBy,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
