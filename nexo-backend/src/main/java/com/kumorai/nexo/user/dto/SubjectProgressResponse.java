package com.kumorai.nexo.user.dto;

public record SubjectProgressResponse(
        Long id,
        Long curriculumSubjectId,
        String codigo,
        String nombre,
        int credits,
        Integer semester,
        String status,
        Double grade
) {}
