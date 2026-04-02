package com.kumorai.nexo.academic.controller;

import com.kumorai.nexo.academic.dto.AcademicOfferResponse;
import com.kumorai.nexo.academic.dto.AcademicOfferUploadResponse;
import com.kumorai.nexo.academic.service.AcademicOfferService;
import com.kumorai.nexo.user.dto.UserProfileResponse;
import com.kumorai.nexo.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/academic-offers")
@PreAuthorize("hasRole('ADMINISTRADOR')")
@RequiredArgsConstructor
public class AcademicOfferController {

    private final AcademicOfferService academicOfferService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<AcademicOfferResponse>> listAll() {
        return ResponseEntity.ok(academicOfferService.listAll());
    }

    @GetMapping("/active")
    public ResponseEntity<AcademicOfferResponse> getActive() {
        return ResponseEntity.ok(academicOfferService.getActive());
    }

    @PostMapping("/upload")
    public ResponseEntity<AcademicOfferUploadResponse> upload(@RequestParam("file") MultipartFile file,
                                                              @RequestParam("semester") String semester,
                                                              @AuthenticationPrincipal String email) {
        UserProfileResponse user = userService.getMyProfile(email);
        return ResponseEntity.ok(academicOfferService.upload(file, semester, user.id()));
    }

    @PatchMapping("/{offerId}/activate")
    public ResponseEntity<AcademicOfferResponse> activate(@PathVariable Long offerId) {
        return ResponseEntity.ok(academicOfferService.activate(offerId));
    }

    @DeleteMapping("/{offerId}")
    public ResponseEntity<Void> delete(@PathVariable Long offerId) {
        academicOfferService.delete(offerId);
        return ResponseEntity.noContent().build();
    }
}
