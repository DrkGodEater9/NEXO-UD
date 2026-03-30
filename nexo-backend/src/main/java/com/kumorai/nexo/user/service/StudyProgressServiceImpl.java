package com.kumorai.nexo.user.service;

import com.kumorai.nexo.academic.entity.CurriculumSubject;
import com.kumorai.nexo.academic.entity.StudyPlan;
import com.kumorai.nexo.academic.repository.CurriculumSubjectRepository;
import com.kumorai.nexo.academic.repository.StudyPlanRepository;
import com.kumorai.nexo.shared.exception.NexoException;
import com.kumorai.nexo.user.dto.AcademicProgressResponse;
import com.kumorai.nexo.user.dto.SubjectProgressResponse;
import com.kumorai.nexo.user.dto.UpdateSubjectProgressRequest;
import com.kumorai.nexo.user.entity.SubjectStatus;
import com.kumorai.nexo.user.entity.User;
import com.kumorai.nexo.user.entity.UserAcademicProgress;
import com.kumorai.nexo.user.entity.UserSubjectProgress;
import com.kumorai.nexo.user.repository.UserAcademicProgressRepository;
import com.kumorai.nexo.user.repository.UserRepository;
import com.kumorai.nexo.user.repository.UserSubjectProgressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StudyProgressServiceImpl implements StudyProgressService {

    private final UserAcademicProgressRepository progressRepository;
    private final UserSubjectProgressRepository subjectProgressRepository;
    private final UserRepository userRepository;
    private final StudyPlanRepository studyPlanRepository;
    private final CurriculumSubjectRepository curriculumSubjectRepository;

    @Override
    @Transactional(readOnly = true)
    public List<AcademicProgressResponse> listByUser(Long userId) {
        return progressRepository.findByUserId(userId)
                .stream().map(this::toProgressResponse).toList();
    }

    @Override
    @Transactional
    public AcademicProgressResponse enroll(Long userId, Long studyPlanId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> NexoException.notFound("Usuario no encontrado"));
        StudyPlan plan = studyPlanRepository.findById(studyPlanId)
                .orElseThrow(() -> NexoException.notFound("Plan de estudios no encontrado"));

        if (progressRepository.existsByUserIdAndStudyPlanId(userId, studyPlanId)) {
            throw NexoException.conflict("El usuario ya está inscrito en este plan de estudios");
        }

        UserAcademicProgress progress = UserAcademicProgress.builder()
                .user(user)
                .studyPlan(plan)
                .build();
        UserAcademicProgress saved = progressRepository.save(progress);

        // Initialize subject progress entries for all curriculum subjects
        List<CurriculumSubject> subjects = curriculumSubjectRepository.findByStudyPlanId(studyPlanId);
        List<UserSubjectProgress> subjectProgresses = subjects.stream()
                .map(subject -> UserSubjectProgress.builder()
                        .academicProgress(saved)
                        .curriculumSubject(subject)
                        .status(SubjectStatus.PENDIENTE)
                        .build())
                .toList();
        subjectProgressRepository.saveAll(subjectProgresses);

        return toProgressResponse(progressRepository.findById(saved.getId()).get());
    }

    @Override
    @Transactional(readOnly = true)
    public AcademicProgressResponse getProgress(Long progressId, Long userId) {
        return toProgressResponse(findOwned(progressId, userId));
    }

    @Override
    @Transactional
    public SubjectProgressResponse updateSubjectStatus(Long progressId, Long subjectProgressId, Long userId,
                                                       UpdateSubjectProgressRequest request) {
        findOwned(progressId, userId); // ownership check
        UserSubjectProgress sp = subjectProgressRepository.findByIdAndAcademicProgressId(subjectProgressId, progressId)
                .orElseThrow(() -> NexoException.notFound("Progreso de materia no encontrado"));
        sp.setStatus(request.status());
        sp.setGrade(request.grade());
        return toSubjectProgressResponse(subjectProgressRepository.save(sp));
    }

    @Override
    @Transactional
    public void unenroll(Long progressId, Long userId) {
        progressRepository.delete(findOwned(progressId, userId));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private UserAcademicProgress findOwned(Long progressId, Long userId) {
        return progressRepository.findByIdAndUserId(progressId, userId)
                .orElseThrow(() -> NexoException.notFound("Avance académico no encontrado"));
    }

    private AcademicProgressResponse toProgressResponse(UserAcademicProgress progress) {
        int approvedCredits = subjectProgressRepository
                .sumCreditsByProgressIdAndStatus(progress.getId(), SubjectStatus.APROBADA);
        int inProgressCredits = subjectProgressRepository
                .sumCreditsByProgressIdAndStatus(progress.getId(), SubjectStatus.CURSANDO);
        int totalCredits = curriculumSubjectRepository.sumCreditsByStudyPlanId(progress.getStudyPlan().getId());

        List<SubjectProgressResponse> subjects = subjectProgressRepository
                .findByAcademicProgressId(progress.getId())
                .stream().map(this::toSubjectProgressResponse).toList();

        return new AcademicProgressResponse(
                progress.getId(),
                progress.getStudyPlan().getId(),
                progress.getStudyPlan().getNombre(),
                progress.getStudyPlan().getCodigoPlan(),
                progress.getEnrolledAt(),
                totalCredits,
                approvedCredits,
                inProgressCredits,
                subjects
        );
    }

    private SubjectProgressResponse toSubjectProgressResponse(UserSubjectProgress sp) {
        CurriculumSubject cs = sp.getCurriculumSubject();
        return new SubjectProgressResponse(
                sp.getId(),
                cs.getId(),
                cs.getCodigo(),
                cs.getNombre(),
                cs.getCredits(),
                cs.getSemester(),
                sp.getStatus().name(),
                sp.getGrade()
        );
    }
}
