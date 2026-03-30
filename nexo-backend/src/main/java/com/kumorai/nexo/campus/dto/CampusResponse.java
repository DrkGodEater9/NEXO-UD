package com.kumorai.nexo.campus.dto;

import java.util.List;

public record CampusResponse(
        Long id,
        String name,
        String address,
        String faculty,
        Double latitude,
        Double longitude,
        String mapUrl,
        List<ClassroomResponse> classrooms
) {}
