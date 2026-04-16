package com.kumorai.nexo.academic.dto;

public record StudyPlanSimpleResponse(
        Long id,
        String codigoPlan,
        String nombre,
        String facultad
) {}
