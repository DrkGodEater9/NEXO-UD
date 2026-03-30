package com.kumorai.nexo.academic.dto;

import java.time.LocalDateTime;

public record AcademicOfferResponse(
        Long id,
        String semester,
        boolean active,
        LocalDateTime uploadedAt,
        Long uploadedBy
) {}
