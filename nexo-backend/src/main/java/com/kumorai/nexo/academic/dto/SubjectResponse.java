package com.kumorai.nexo.academic.dto;

import java.util.List;

public record SubjectResponse(
        Long id,
        String codigo,
        String nombre,
        Long studyPlanId,
        List<SubjectGroupResponse> grupos
) {}
