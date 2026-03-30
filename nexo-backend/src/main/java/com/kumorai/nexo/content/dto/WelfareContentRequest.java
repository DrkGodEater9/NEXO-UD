package com.kumorai.nexo.content.dto;

import com.kumorai.nexo.content.entity.WelfareCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record WelfareContentRequest(
        @NotBlank @Size(max = 255) String title,
        @NotBlank @Size(max = 5000) String description,
        @NotNull WelfareCategory category,
        String links
) {}
