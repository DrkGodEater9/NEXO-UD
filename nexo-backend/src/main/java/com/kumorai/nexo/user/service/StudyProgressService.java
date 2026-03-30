package com.kumorai.nexo.user.service;

import com.kumorai.nexo.user.dto.AcademicProgressResponse;
import com.kumorai.nexo.user.dto.SubjectProgressResponse;
import com.kumorai.nexo.user.dto.UpdateSubjectProgressRequest;

import java.util.List;

public interface StudyProgressService {
    List<AcademicProgressResponse> listByUser(Long userId);
    AcademicProgressResponse enroll(Long userId, Long studyPlanId);
    AcademicProgressResponse getProgress(Long progressId, Long userId);
    SubjectProgressResponse updateSubjectStatus(Long progressId, Long subjectProgressId, Long userId,
                                                UpdateSubjectProgressRequest request);
    void unenroll(Long progressId, Long userId);
}
