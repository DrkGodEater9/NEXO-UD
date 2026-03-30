package com.kumorai.nexo.user.dto;

import com.kumorai.nexo.user.entity.SubjectStatus;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record UpdateSubjectProgressRequest(
        @NotNull SubjectStatus status,
        @DecimalMin("0.0") @DecimalMax("5.0") Double grade
) {}
