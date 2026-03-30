package com.kumorai.nexo.user.dto;

import java.time.LocalDateTime;
import java.util.List;

public record AcademicProgressResponse(
        Long id,
        Long studyPlanId,
        String studyPlanNombre,
        String studyPlanCodigoPlan,
        LocalDateTime enrolledAt,
        int totalCredits,
        int approvedCredits,
        int inProgressCredits,
        List<SubjectProgressResponse> subjects
) {}
