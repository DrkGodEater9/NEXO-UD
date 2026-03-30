package com.kumorai.nexo.academic.dto;

import java.util.List;

public record SubjectGroupResponse(
        Long id,
        String grupoCode,
        int inscritos,
        String docente,
        List<TimeBlockResponse> horarios
) {}
