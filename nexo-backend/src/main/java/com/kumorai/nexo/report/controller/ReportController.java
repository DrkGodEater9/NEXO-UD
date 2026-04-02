package com.kumorai.nexo.report.controller;

import com.kumorai.nexo.report.dto.ReportRequest;
import com.kumorai.nexo.report.dto.ReportResponse;
import com.kumorai.nexo.report.dto.UpdateReportStatusRequest;
import com.kumorai.nexo.report.entity.ReportStatus;
import com.kumorai.nexo.report.entity.ReportType;
import com.kumorai.nexo.report.service.ReportService;
import com.kumorai.nexo.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final UserService userService;

    @PostMapping
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public ResponseEntity<ReportResponse> create(@Valid @RequestBody ReportRequest request,
                                                 @AuthenticationPrincipal String email) {
        Long userId = userService.getMyProfile(email).id();
        return ResponseEntity.ok(reportService.create(request, userId));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public ResponseEntity<List<ReportResponse>> listMyReports(@AuthenticationPrincipal String email) {
        Long userId = userService.getMyProfile(email).id();
        return ResponseEntity.ok(reportService.listByUser(userId));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<ReportResponse>> listAll(
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(required = false) ReportType reportType) {
        return ResponseEntity.ok(reportService.listAll(status, reportType));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ReportResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(reportService.getByIdAdmin(id));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ReportResponse> updateStatus(@PathVariable Long id,
                                                       @Valid @RequestBody UpdateReportStatusRequest request) {
        return ResponseEntity.ok(reportService.updateStatus(id, request));
    }
}
