package com.kumorai.nexo.admin.controller;

import com.kumorai.nexo.academic.dto.CurriculumSubjectRequest;
import com.kumorai.nexo.academic.dto.CurriculumSubjectResponse;
import com.kumorai.nexo.academic.dto.StudyPlanResponse;
import com.kumorai.nexo.academic.service.CurriculumSubjectService;
import com.kumorai.nexo.academic.service.StudyPlanService;
import com.kumorai.nexo.campus.dto.CampusRequest;
import com.kumorai.nexo.campus.dto.CampusResponse;
import com.kumorai.nexo.campus.service.CampusService;
import com.kumorai.nexo.user.dto.SetActiveRequest;
import com.kumorai.nexo.user.dto.UserSummaryResponse;
import com.kumorai.nexo.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMINISTRADOR')")
@RequiredArgsConstructor
public class AdminContentController {

    private final UserService userService;
    private final CampusService campusService;
    private final StudyPlanService studyPlanService;
    private final CurriculumSubjectService curriculumSubjectService;

    // ── Gestión de usuarios ───────────────────────────────────────────────────

    @GetMapping("/users")
    public ResponseEntity<Page<UserSummaryResponse>> listUsers(
            @RequestParam(required = false) String email,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(userService.listAll(email, pageable));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<com.kumorai.nexo.user.dto.UserProfileResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getById(id));
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<Void> setUserStatus(@PathVariable Long id,
                                              @Valid @RequestBody SetActiveRequest request) {
        userService.setActive(id, request.active());
        return ResponseEntity.ok().build();
    }

    // ── Gestión de sedes ──────────────────────────────────────────────────────

    @PostMapping("/campus")
    public ResponseEntity<CampusResponse> createCampus(@Valid @RequestBody CampusRequest request) {
        return ResponseEntity.ok(campusService.create(request));
    }

    @DeleteMapping("/campus/{campusId}")
    public ResponseEntity<Void> deleteCampus(@PathVariable Long campusId) {
        campusService.delete(campusId);
        return ResponseEntity.noContent().build();
    }

    // ── Planes de estudio y materias curriculares ─────────────────────────────

    @GetMapping("/study-plans")
    public ResponseEntity<List<StudyPlanResponse>> listStudyPlans() {
        return ResponseEntity.ok(studyPlanService.listAll());
    }

    @GetMapping("/study-plans/{planId}/curriculum")
    public ResponseEntity<List<CurriculumSubjectResponse>> listCurriculum(@PathVariable Long planId) {
        return ResponseEntity.ok(curriculumSubjectService.listByStudyPlan(planId));
    }

    @PostMapping("/study-plans/{planId}/curriculum")
    public ResponseEntity<CurriculumSubjectResponse> addCurriculumSubject(
            @PathVariable Long planId,
            @Valid @RequestBody CurriculumSubjectRequest request) {
        return ResponseEntity.ok(curriculumSubjectService.create(planId, request));
    }

    @PutMapping("/study-plans/{planId}/curriculum/{subjectId}")
    public ResponseEntity<CurriculumSubjectResponse> updateCurriculumSubject(
            @PathVariable Long planId,
            @PathVariable Long subjectId,
            @Valid @RequestBody CurriculumSubjectRequest request) {
        return ResponseEntity.ok(curriculumSubjectService.update(planId, subjectId, request));
    }

    @DeleteMapping("/study-plans/{planId}/curriculum/{subjectId}")
    public ResponseEntity<Void> deleteCurriculumSubject(@PathVariable Long planId,
                                                        @PathVariable Long subjectId) {
        curriculumSubjectService.delete(planId, subjectId);
        return ResponseEntity.noContent().build();
    }
}
