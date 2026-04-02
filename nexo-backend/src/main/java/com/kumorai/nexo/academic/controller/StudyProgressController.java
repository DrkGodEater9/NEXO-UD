package com.kumorai.nexo.academic.controller;

import com.kumorai.nexo.user.dto.AcademicProgressResponse;
import com.kumorai.nexo.user.dto.SubjectProgressResponse;
import com.kumorai.nexo.user.dto.UpdateSubjectProgressRequest;
import com.kumorai.nexo.user.service.StudyProgressService;
import com.kumorai.nexo.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/progress")
@PreAuthorize("hasRole('ESTUDIANTE')")
@RequiredArgsConstructor
public class StudyProgressController {

    private final StudyProgressService studyProgressService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<AcademicProgressResponse>> listProgress(@AuthenticationPrincipal String email) {
        Long userId = userService.getMyProfile(email).id();
        return ResponseEntity.ok(studyProgressService.listByUser(userId));
    }

    @PostMapping
    public ResponseEntity<AcademicProgressResponse> enroll(@AuthenticationPrincipal String email,
                                                           @RequestBody Map<String, Long> body) {
        Long userId = userService.getMyProfile(email).id();
        Long studyPlanId = body.get("studyPlanId");
        return ResponseEntity.ok(studyProgressService.enroll(userId, studyPlanId));
    }

    @DeleteMapping("/{progressId}")
    public ResponseEntity<Void> unenroll(@AuthenticationPrincipal String email,
                                         @PathVariable Long progressId) {
        Long userId = userService.getMyProfile(email).id();
        studyProgressService.unenroll(progressId, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{progressId}/subjects")
    public ResponseEntity<AcademicProgressResponse> getSubjects(@AuthenticationPrincipal String email,
                                                                @PathVariable Long progressId) {
        Long userId = userService.getMyProfile(email).id();
        return ResponseEntity.ok(studyProgressService.getProgress(progressId, userId));
    }

    @PatchMapping("/{progressId}/subjects/{subjectProgressId}")
    public ResponseEntity<SubjectProgressResponse> updateSubjectStatus(
            @AuthenticationPrincipal String email,
            @PathVariable Long progressId,
            @PathVariable Long subjectProgressId,
            @Valid @RequestBody UpdateSubjectProgressRequest request) {
        Long userId = userService.getMyProfile(email).id();
        return ResponseEntity.ok(studyProgressService.updateSubjectStatus(progressId, subjectProgressId, userId, request));
    }

    @GetMapping("/{progressId}/summary")
    public ResponseEntity<AcademicProgressResponse> getSummary(@AuthenticationPrincipal String email,
                                                               @PathVariable Long progressId) {
        Long userId = userService.getMyProfile(email).id();
        return ResponseEntity.ok(studyProgressService.getProgress(progressId, userId));
    }
}
