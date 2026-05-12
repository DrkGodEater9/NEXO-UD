package com.kumorai.nexo.campus.dto;

import java.util.List;

public record RouteResponse(
        String encodedPolyline,
        List<List<Double>> coordinates,
        String totalDuration,
        String totalDistance,
        List<RouteStep> steps,
        List<RouteAlternative> alternatives,
        List<RouteModeSummary> modeSummaries
) {
    public record RouteStep(
            String instruction,
            String duration,
            String distance,
            String travelMode,
            String transitLine
    ) {}

    public record RouteAlternative(
            String label,
            String totalDuration,
            String totalDistance,
            List<List<Double>> coordinates,
            List<RouteStep> steps
    ) {}

    public record RouteModeSummary(
            String mode,
            String label,
            String duration,
            String distance
    ) {}
}
