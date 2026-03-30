package com.kumorai.nexo.academic.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CurriculumSubjectRequest(
        @NotBlank String codigo,
        @NotBlank String nombre,
        @NotNull @Positive int credits,
        @Min(1) Integer semester
) {}
