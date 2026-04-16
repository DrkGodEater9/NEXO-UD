package com.kumorai.nexo.academic.controller;

import com.kumorai.nexo.academic.dto.StudyPlanSimpleResponse;
import com.kumorai.nexo.academic.repository.StudyPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/study-plans")
@RequiredArgsConstructor
public class StudyPlanPublicController {

    private final StudyPlanRepository studyPlanRepository;

    @GetMapping
    public ResponseEntity<List<StudyPlanSimpleResponse>> listAll() {
        List<StudyPlanSimpleResponse> plans = studyPlanRepository
                .findAllOrderedByFacultyAndName()
                .stream()
                .map(sp -> new StudyPlanSimpleResponse(sp.getId(), sp.getCodigoPlan(), sp.getNombre(), sp.getFacultad()))
                .toList();
        return ResponseEntity.ok(plans);
    }
}
