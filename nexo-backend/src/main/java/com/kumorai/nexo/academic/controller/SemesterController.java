package com.kumorai.nexo.academic.controller;

import com.kumorai.nexo.academic.dto.SemesterResponse;
import com.kumorai.nexo.academic.entity.Semester;
import com.kumorai.nexo.academic.repository.SemesterRepository;
import com.kumorai.nexo.shared.exception.NexoException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class SemesterController {

    private final SemesterRepository semesterRepository;

    // ── Public ────────────────────────────────────────────────────────────────

    @GetMapping("/api/v1/semesters/active")
    public ResponseEntity<SemesterResponse> getActiveSemester() {
        return semesterRepository.findByActiveTrue()
                .map(this::toResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    // ── Admin CRUD ────────────────────────────────────────────────────────────

    @GetMapping("/api/v1/admin/semesters")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<SemesterResponse>> listAll() {
        return ResponseEntity.ok(
                semesterRepository.findAllByOrderByCreatedAtDesc()
                        .stream().map(this::toResponse).toList()
        );
    }

    @PostMapping("/api/v1/admin/semesters")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Transactional
    public ResponseEntity<SemesterResponse> create(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        if (name == null || name.isBlank()) {
            throw NexoException.badRequest("El nombre del semestre es obligatorio");
        }
        name = name.trim();
        if (semesterRepository.findByName(name).isPresent()) {
            throw NexoException.badRequest("Ya existe un semestre con el nombre '" + name + "'");
        }
        Semester semester = semesterRepository.save(
                Semester.builder().name(name).active(false).build()
        );
        return ResponseEntity.ok(toResponse(semester));
    }

    @PatchMapping("/api/v1/admin/semesters/{id}/activate")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Transactional
    public ResponseEntity<SemesterResponse> activate(@PathVariable Long id) {
        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> NexoException.notFound("Semestre no encontrado"));
        semesterRepository.deactivateAll();
        semester.setActive(true);
        return ResponseEntity.ok(toResponse(semesterRepository.save(semester)));
    }

    @DeleteMapping("/api/v1/admin/semesters/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> NexoException.notFound("Semestre no encontrado"));
        if (semester.isActive()) {
            throw NexoException.badRequest("No se puede eliminar el semestre activo. Desactívalo primero.");
        }
        semesterRepository.delete(semester);
        return ResponseEntity.noContent().build();
    }

    // ── Mapper ────────────────────────────────────────────────────────────────

    private SemesterResponse toResponse(Semester s) {
        return new SemesterResponse(s.getId(), s.getName(), s.isActive(), s.getCreatedAt());
    }
}
