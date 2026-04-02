package com.kumorai.nexo.content.controller;

import com.kumorai.nexo.content.dto.WelfareContentRequest;
import com.kumorai.nexo.content.dto.WelfareContentResponse;
import com.kumorai.nexo.content.entity.WelfareCategory;
import com.kumorai.nexo.content.service.WelfareService;
import com.kumorai.nexo.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/welfare")
@RequiredArgsConstructor
public class WelfareController {

    private final WelfareService welfareService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<WelfareContentResponse>> listAll(
            @RequestParam(required = false) WelfareCategory category) {
        return ResponseEntity.ok(welfareService.listAll(category));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WelfareContentResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(welfareService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('RADICADOR_BIENESTAR')")
    public ResponseEntity<WelfareContentResponse> create(@Valid @RequestBody WelfareContentRequest request,
                                                         @AuthenticationPrincipal String email) {
        Long createdBy = userService.getMyProfile(email).id();
        return ResponseEntity.ok(welfareService.create(request, createdBy));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('RADICADOR_BIENESTAR')")
    public ResponseEntity<WelfareContentResponse> update(@PathVariable Long id,
                                                         @Valid @RequestBody WelfareContentRequest request) {
        return ResponseEntity.ok(welfareService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('RADICADOR_BIENESTAR') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        welfareService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
