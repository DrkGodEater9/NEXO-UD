package com.kumorai.nexo.academic.service;

import com.kumorai.nexo.academic.dto.CurriculumSubjectRequest;
import com.kumorai.nexo.academic.dto.CurriculumSubjectResponse;
import com.kumorai.nexo.academic.entity.CurriculumSubject;
import com.kumorai.nexo.academic.entity.StudyPlan;
import com.kumorai.nexo.academic.repository.CurriculumSubjectRepository;
import com.kumorai.nexo.academic.repository.StudyPlanRepository;
import com.kumorai.nexo.shared.exception.NexoException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CurriculumSubjectServiceImpl implements CurriculumSubjectService {

    private final CurriculumSubjectRepository curriculumSubjectRepository;
    private final StudyPlanRepository studyPlanRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CurriculumSubjectResponse> listByStudyPlan(Long studyPlanId) {
        requireStudyPlan(studyPlanId);
        return curriculumSubjectRepository.findByStudyPlanId(studyPlanId)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CurriculumSubjectResponse getById(Long studyPlanId, Long subjectId) {
        return toResponse(findOwned(studyPlanId, subjectId));
    }

    @Override
    @Transactional
    public CurriculumSubjectResponse create(Long studyPlanId, CurriculumSubjectRequest request) {
        StudyPlan plan = requireStudyPlan(studyPlanId);
        if (curriculumSubjectRepository.existsByCodigoAndStudyPlanId(request.codigo(), studyPlanId)) {
            throw NexoException.conflict("Ya existe una materia con ese código en este plan");
        }
        CurriculumSubject subject = CurriculumSubject.builder()
                .codigo(request.codigo())
                .nombre(request.nombre())
                .credits(request.credits())
                .semester(request.semester())
                .studyPlan(plan)
                .build();
        return toResponse(curriculumSubjectRepository.save(subject));
    }

    @Override
    @Transactional
    public CurriculumSubjectResponse update(Long studyPlanId, Long subjectId, CurriculumSubjectRequest request) {
        CurriculumSubject subject = findOwned(studyPlanId, subjectId);
        if (!subject.getCodigo().equals(request.codigo()) &&
                curriculumSubjectRepository.existsByCodigoAndStudyPlanId(request.codigo(), studyPlanId)) {
            throw NexoException.conflict("Ya existe una materia con ese código en este plan");
        }
        subject.setCodigo(request.codigo());
        subject.setNombre(request.nombre());
        subject.setCredits(request.credits());
        subject.setSemester(request.semester());
        return toResponse(curriculumSubjectRepository.save(subject));
    }

    @Override
    @Transactional
    public void delete(Long studyPlanId, Long subjectId) {
        curriculumSubjectRepository.delete(findOwned(studyPlanId, subjectId));
    }

    @Override
    @Transactional(readOnly = true)
    public int getTotalCredits(Long studyPlanId) {
        requireStudyPlan(studyPlanId);
        return curriculumSubjectRepository.sumCreditsByStudyPlanId(studyPlanId);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private StudyPlan requireStudyPlan(Long studyPlanId) {
        return studyPlanRepository.findById(studyPlanId)
                .orElseThrow(() -> NexoException.notFound("Plan de estudios no encontrado"));
    }

    private CurriculumSubject findOwned(Long studyPlanId, Long subjectId) {
        return curriculumSubjectRepository.findByIdAndStudyPlanId(subjectId, studyPlanId)
                .orElseThrow(() -> NexoException.notFound("Materia no encontrada en este plan de estudios"));
    }

    private CurriculumSubjectResponse toResponse(CurriculumSubject subject) {
        return new CurriculumSubjectResponse(
                subject.getId(),
                subject.getCodigo(),
                subject.getNombre(),
                subject.getCredits(),
                subject.getSemester(),
                subject.getStudyPlan().getId()
        );
    }
}
