package com.kumorai.nexo.campus.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ClassroomRequest(
        @NotBlank String name,
        String building,
        String floor,
        @NotNull Boolean isLab
) {}
