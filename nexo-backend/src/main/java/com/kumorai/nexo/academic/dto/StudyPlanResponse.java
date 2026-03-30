package com.kumorai.nexo.academic.dto;

public record StudyPlanResponse(
        Long id,
        String codigoPlan,
        String nombre,
        String facultad
) {}
