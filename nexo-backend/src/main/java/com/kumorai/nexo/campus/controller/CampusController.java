package com.kumorai.nexo.campus.controller;

import com.kumorai.nexo.campus.dto.CampusRequest;
import com.kumorai.nexo.campus.dto.CampusResponse;
import com.kumorai.nexo.campus.dto.ClassroomRequest;
import com.kumorai.nexo.campus.dto.ClassroomResponse;
import com.kumorai.nexo.campus.service.CampusService;
import com.kumorai.nexo.shared.exception.NexoException;
import com.kumorai.nexo.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/campus")
@RequiredArgsConstructor
public class CampusController {

    private final CampusService campusService;
    private final UserService userService;

    @Value("${nexo.upload.dir}")
    private String uploadDir;

    // ── Campus ────────────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<CampusResponse>> listAll(@RequestParam(required = false) String faculty) {
        return ResponseEntity.ok(campusService.listAll(faculty));
    }

    @GetMapping("/{campusId}")
    public ResponseEntity<CampusResponse> getById(@PathVariable Long campusId) {
        return ResponseEntity.ok(campusService.getById(campusId));
    }

    @PutMapping("/{campusId}")
    @PreAuthorize("hasRole('RADICADOR_SEDES') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<CampusResponse> update(@PathVariable Long campusId,
                                                 @Valid @RequestBody CampusRequest request) {
        return ResponseEntity.ok(campusService.update(campusId, request));
    }

    @PostMapping
    @PreAuthorize("hasRole('RADICADOR_SEDES') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<CampusResponse> create(@Valid @RequestBody CampusRequest request) {
        return ResponseEntity.ok(campusService.create(request));
    }

    @DeleteMapping("/{campusId}")
    @PreAuthorize("hasRole('RADICADOR_SEDES') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> delete(@PathVariable Long campusId) {
        campusService.delete(campusId);
        return ResponseEntity.noContent().build();
    }

    // ── Classrooms ────────────────────────────────────────────────────────────

    @GetMapping("/{campusId}/classrooms")
    public ResponseEntity<List<ClassroomResponse>> listClassrooms(@PathVariable Long campusId) {
        return ResponseEntity.ok(campusService.listClassrooms(campusId));
    }

    @PostMapping("/{campusId}/classrooms")
    @PreAuthorize("hasRole('RADICADOR_SEDES') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<ClassroomResponse> addClassroom(@PathVariable Long campusId,
                                                          @Valid @RequestBody ClassroomRequest request) {
        return ResponseEntity.ok(campusService.addClassroom(campusId, request));
    }

    @PutMapping("/{campusId}/classrooms/{classroomId}")
    @PreAuthorize("hasRole('RADICADOR_SEDES') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<ClassroomResponse> updateClassroom(@PathVariable Long campusId,
                                                             @PathVariable Long classroomId,
                                                             @Valid @RequestBody ClassroomRequest request) {
        return ResponseEntity.ok(campusService.updateClassroom(campusId, classroomId, request));
    }

    @DeleteMapping("/{campusId}/classrooms/{classroomId}")
    @PreAuthorize("hasRole('RADICADOR_SEDES') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> deleteClassroom(@PathVariable Long campusId,
                                                @PathVariable Long classroomId) {
        campusService.deleteClassroom(campusId, classroomId);
        return ResponseEntity.noContent().build();
    }

    // ── Photos ────────────────────────────────────────────────────────────────

    @PostMapping("/{campusId}/classrooms/{classroomId}/photos")
    @PreAuthorize("hasRole('RADICADOR_SEDES') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<ClassroomResponse> addPhoto(@PathVariable Long campusId,
                                                      @PathVariable Long classroomId,
                                                      @RequestParam("photo") MultipartFile photo,
                                                      @AuthenticationPrincipal String email) {
        if (photo.isEmpty()) {
            throw NexoException.badRequest("El archivo de foto está vacío");
        }

        String ext = StringUtils.getFilenameExtension(photo.getOriginalFilename());
        String filename = UUID.randomUUID() + (ext != null ? "." + ext : "");
        Path dest = Paths.get(uploadDir).toAbsolutePath().resolve(filename);

        try {
            Files.createDirectories(dest.getParent());
            Files.copy(photo.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Error al guardar la foto", e);
        }

        Long uploadedBy = userService.getMyProfile(email).id();
        String photoUrl = uploadDir + "/" + filename;
        return ResponseEntity.ok(campusService.addPhoto(campusId, classroomId, photoUrl, uploadedBy));
    }

    @DeleteMapping("/{campusId}/classrooms/{classroomId}/photos/{photoId}")
    @PreAuthorize("hasRole('RADICADOR_SEDES') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> deletePhoto(@PathVariable Long campusId,
                                            @PathVariable Long classroomId,
                                            @PathVariable Long photoId) {
        campusService.deletePhoto(campusId, classroomId, photoId);
        return ResponseEntity.noContent().build();
    }
}
