package com.kumorai.nexo.academic.service;

import com.kumorai.nexo.academic.dto.CurriculumSubjectRequest;
import com.kumorai.nexo.academic.dto.CurriculumSubjectResponse;

import java.util.List;

public interface CurriculumSubjectService {
    List<CurriculumSubjectResponse> listByStudyPlan(Long studyPlanId);
    CurriculumSubjectResponse getById(Long studyPlanId, Long subjectId);
    CurriculumSubjectResponse create(Long studyPlanId, CurriculumSubjectRequest request);
    CurriculumSubjectResponse update(Long studyPlanId, Long subjectId, CurriculumSubjectRequest request);
    void delete(Long studyPlanId, Long subjectId);
    int getTotalCredits(Long studyPlanId);
}
