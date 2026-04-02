package com.kumorai.nexo.campus.dto;

import jakarta.validation.constraints.NotBlank;

public record CampusRequest(
        @NotBlank String name,
        String address,
        @NotBlank String faculty,
        Double latitude,
        Double longitude,
        String mapUrl
) {}
