package com.kumorai.nexo.schedule.controller;

import com.kumorai.nexo.academic.dto.SubjectResponse;
import com.kumorai.nexo.academic.service.AcademicOfferService;
import com.kumorai.nexo.schedule.dto.ScheduleRequest;
import com.kumorai.nexo.schedule.dto.ScheduleResponse;
import com.kumorai.nexo.schedule.service.ScheduleService;
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
@RequestMapping("/api/v1/schedules")
@RequiredArgsConstructor
public class SchedulePlannerController {

    private final ScheduleService scheduleService;
    private final AcademicOfferService academicOfferService;
    private final UserService userService;

    // ── Public: academic offer ────────────────────────────────────────────────

    @GetMapping("/offer/subjects")
    public ResponseEntity<List<SubjectResponse>> getOfferSubjects(
            @RequestParam(required = false) Long studyPlanId) {
        Long activeOfferId = academicOfferService.getActive().id();
        return ResponseEntity.ok(academicOfferService.getSubjectsByOffer(activeOfferId, studyPlanId));
    }

    @PostMapping("/validate-conflicts")
    public ResponseEntity<Map<String, Object>> validateConflicts(@RequestBody Map<String, List<Long>> body) {
        List<Long> groupIds = body.get("groupIds");
        return ResponseEntity.ok(scheduleService.validateConflicts(groupIds));
    }

    // ── Authenticated: saved schedules ────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public ResponseEntity<List<ScheduleResponse>> listMySchedules(@AuthenticationPrincipal String email) {
        Long userId = userService.getMyProfile(email).id();
        return ResponseEntity.ok(scheduleService.listByUser(userId));
    }

    @PostMapping
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public ResponseEntity<ScheduleResponse> create(@Valid @RequestBody ScheduleRequest request,
                                                   @AuthenticationPrincipal String email) {
        Long userId = userService.getMyProfile(email).id();
        return ResponseEntity.ok(scheduleService.create(request, userId));
    }

    @GetMapping("/{scheduleId}")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public ResponseEntity<ScheduleResponse> getById(@PathVariable Long scheduleId,
                                                    @AuthenticationPrincipal String email) {
        Long userId = userService.getMyProfile(email).id();
        return ResponseEntity.ok(scheduleService.getById(scheduleId, userId));
    }

    @PutMapping("/{scheduleId}")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public ResponseEntity<ScheduleResponse> update(@PathVariable Long scheduleId,
                                                   @Valid @RequestBody ScheduleRequest request,
                                                   @AuthenticationPrincipal String email) {
        Long userId = userService.getMyProfile(email).id();
        return ResponseEntity.ok(scheduleService.update(scheduleId, userId, request));
    }

    @DeleteMapping("/{scheduleId}")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public ResponseEntity<Void> delete(@PathVariable Long scheduleId,
                                       @AuthenticationPrincipal String email) {
        Long userId = userService.getMyProfile(email).id();
        scheduleService.delete(scheduleId, userId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{scheduleId}/archive")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public ResponseEntity<ScheduleResponse> archive(@PathVariable Long scheduleId,
                                                    @RequestBody Map<String, Boolean> body,
                                                    @AuthenticationPrincipal String email) {
        Long userId = userService.getMyProfile(email).id();
        boolean archived = Boolean.TRUE.equals(body.get("archived"));
        return ResponseEntity.ok(scheduleService.setArchived(scheduleId, userId, archived));
    }
}
