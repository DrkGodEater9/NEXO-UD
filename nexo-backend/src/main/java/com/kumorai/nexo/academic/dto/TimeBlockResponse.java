package com.kumorai.nexo.academic.dto;

public record TimeBlockResponse(
        Long id,
        String dia,
        int horaInicio,
        int horaFin,
        String ubicacion
) {}
