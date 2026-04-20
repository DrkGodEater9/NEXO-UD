package com.kumorai.nexo.content.controller;

import com.kumorai.nexo.content.dto.AnnouncementRequest;
import com.kumorai.nexo.content.dto.AnnouncementResponse;
import com.kumorai.nexo.content.entity.AnnouncementScope;
import com.kumorai.nexo.content.entity.AnnouncementType;
import com.kumorai.nexo.content.service.AnnouncementService;
import com.kumorai.nexo.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<AnnouncementResponse>> listAll(
            @RequestParam(required = false) AnnouncementScope scope,
            @RequestParam(required = false) AnnouncementType type,
            @RequestParam(required = false) String faculty) {
        return ResponseEntity.ok(announcementService.listAll(scope, type, faculty));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AnnouncementResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(announcementService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('RADICADOR_AVISOS') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<AnnouncementResponse> create(@Valid @RequestBody AnnouncementRequest request,
                                                       @AuthenticationPrincipal String email) {
        Long createdBy = userService.getMyProfile(email).id();
        return ResponseEntity.ok(announcementService.create(request, createdBy));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('RADICADOR_AVISOS') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<AnnouncementResponse> update(@PathVariable Long id,
                                                       @Valid @RequestBody AnnouncementRequest request) {
        return ResponseEntity.ok(announcementService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('RADICADOR_AVISOS') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        announcementService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
