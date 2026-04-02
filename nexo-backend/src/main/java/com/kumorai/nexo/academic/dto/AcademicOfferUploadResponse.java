package com.kumorai.nexo.academic.dto;

import java.time.LocalDateTime;
import java.util.List;

public record AcademicOfferUploadResponse(
        Long id,
        String semester,
        LocalDateTime uploadedAt,
        int facultades,
        int carreras,
        int materias,
        int grupos,
        int horarios,
        List<String> warnings
) {}
