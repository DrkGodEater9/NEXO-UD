package com.kumorai.nexo.campus.dto;

import jakarta.validation.constraints.NotNull;

public record RouteRequest(
        @NotNull Double originLat,
        @NotNull Double originLng,
        @NotNull Double destLat,
        @NotNull Double destLng
) {}
