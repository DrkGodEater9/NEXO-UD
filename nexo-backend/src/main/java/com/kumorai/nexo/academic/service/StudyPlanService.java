package com.kumorai.nexo.academic.service;

import com.kumorai.nexo.academic.dto.StudyPlanResponse;

import java.util.List;

public interface StudyPlanService {
    List<StudyPlanResponse> listAll();
    StudyPlanResponse getById(Long id);
    StudyPlanResponse getByCodigoPlan(String codigoPlan);
}
