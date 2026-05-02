package com.kumorai.nexo.content.dto;

import com.kumorai.nexo.content.entity.AnnouncementScope;
import com.kumorai.nexo.content.entity.AnnouncementType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AnnouncementRequest(
        @NotBlank @Size(max = 255) String title,
        @NotBlank @Size(max = 5000) String body,
        @NotNull AnnouncementScope scope,
        @NotNull AnnouncementType type,
        String faculty,
        String images
) {}
