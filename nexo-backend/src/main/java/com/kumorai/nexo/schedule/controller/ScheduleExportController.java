package com.kumorai.nexo.schedule.controller;

import com.kumorai.nexo.schedule.service.ScheduleExportService;
import com.kumorai.nexo.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/schedules/{scheduleId}/export")
@PreAuthorize("hasRole('ESTUDIANTE')")
@RequiredArgsConstructor
public class ScheduleExportController {

    private final ScheduleExportService scheduleExportService;
    private final UserService userService;

    @GetMapping("/pdf")
    public ResponseEntity<byte[]> exportPdf(@PathVariable Long scheduleId,
                                            @AuthenticationPrincipal String email) {
        Long userId = userService.getMyProfile(email).id();
        byte[] pdf = scheduleExportService.generatePdf(scheduleId, userId);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"horario_" + scheduleId + ".pdf\"")
                .body(pdf);
    }

    @GetMapping("/image")
    public ResponseEntity<byte[]> exportImage(@PathVariable Long scheduleId,
                                              @AuthenticationPrincipal String email) {
        Long userId = userService.getMyProfile(email).id();
        byte[] image = scheduleExportService.generateImage(scheduleId, userId);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"horario_" + scheduleId + ".png\"")
                .body(image);
    }
}
