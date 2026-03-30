package com.kumorai.nexo.academic.dto;

public record CurriculumSubjectResponse(
        Long id,
        String codigo,
        String nombre,
        int credits,
        Integer semester,
        Long studyPlanId
) {}
