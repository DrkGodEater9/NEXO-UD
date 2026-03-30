package com.kumorai.nexo.campus.dto;

import java.util.List;

public record ClassroomResponse(
        Long id,
        String name,
        String building,
        String floor,
        boolean isLab,
        List<String> photoUrls
) {}
