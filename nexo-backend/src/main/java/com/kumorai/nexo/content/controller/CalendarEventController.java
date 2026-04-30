package com.kumorai.nexo.content.controller;

import com.kumorai.nexo.content.dto.CalendarEventRequest;
import com.kumorai.nexo.content.dto.CalendarEventResponse;
import com.kumorai.nexo.content.entity.CalendarEventType;
import com.kumorai.nexo.content.service.CalendarEventService;
import com.kumorai.nexo.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/calendar")
@RequiredArgsConstructor
public class CalendarEventController {

    private final CalendarEventService calendarEventService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<CalendarEventResponse>> listAll(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) CalendarEventType eventType) {
        return ResponseEntity.ok(calendarEventService.listAll(from, to, eventType));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CalendarEventResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(calendarEventService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR') or hasRole('RADICADOR_CALENDARIO')")
    public ResponseEntity<CalendarEventResponse> create(@Valid @RequestBody CalendarEventRequest request,
                                                        @AuthenticationPrincipal String email) {
        Long createdBy = userService.getMyProfile(email).id();
        return ResponseEntity.ok(calendarEventService.create(request, createdBy));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR') or hasRole('RADICADOR_CALENDARIO')")
    public ResponseEntity<CalendarEventResponse> update(@PathVariable Long id,
                                                        @Valid @RequestBody CalendarEventRequest request) {
        return ResponseEntity.ok(calendarEventService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR') or hasRole('RADICADOR_CALENDARIO')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        calendarEventService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
