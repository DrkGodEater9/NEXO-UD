package com.kumorai.nexo.academic.service;

import com.kumorai.nexo.academic.dto.StudyPlanResponse;
import com.kumorai.nexo.academic.entity.StudyPlan;
import com.kumorai.nexo.academic.repository.StudyPlanRepository;
import com.kumorai.nexo.shared.exception.NexoException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StudyPlanServiceImpl implements StudyPlanService {

    private final StudyPlanRepository studyPlanRepository;

    @Override
    @Transactional(readOnly = true)
    public List<StudyPlanResponse> listAll() {
        return studyPlanRepository.findAllOrderedByFacultyAndName()
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public StudyPlanResponse getById(Long id) {
        return toResponse(studyPlanRepository.findById(id)
                .orElseThrow(() -> NexoException.notFound("Plan de estudios no encontrado")));
    }

    @Override
    @Transactional(readOnly = true)
    public StudyPlanResponse getByCodigoPlan(String codigoPlan) {
        return toResponse(studyPlanRepository.findByCodigoPlan(codigoPlan)
                .orElseThrow(() -> NexoException.notFound("Plan de estudios no encontrado")));
    }

    private StudyPlanResponse toResponse(StudyPlan plan) {
        return new StudyPlanResponse(
                plan.getId(),
                plan.getCodigoPlan(),
                plan.getNombre(),
                plan.getFacultad()
        );
    }
}
