package com.kumorai.nexo.campus.dto;

import java.util.List;

public record RouteResponse(
        String encodedPolyline,
        String totalDuration,
        String totalDistance,
        List<RouteStep> steps
) {
    public record RouteStep(
            String instruction,
            String duration,
            String distance,
            String travelMode,
            String transitLine
    ) {}
}
