package com.kumorai.nexo.user.controller;

import com.kumorai.nexo.user.dto.DeleteAccountRequest;
import com.kumorai.nexo.user.dto.UpdateNicknameRequest;
import com.kumorai.nexo.user.dto.UserProfileResponse;
import com.kumorai.nexo.user.dto.UserSummaryResponse;
import com.kumorai.nexo.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMyProfile(@AuthenticationPrincipal String email) {
        return ResponseEntity.ok(userService.getMyProfile(email));
    }

    @PostMapping("/me/nickname/request-code")
    public ResponseEntity<Void> requestNicknameChangeCode(@AuthenticationPrincipal String email) {
        userService.requestNicknameChangeCode(email);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/me/nickname")
    public ResponseEntity<Void> updateNickname(@AuthenticationPrincipal String email,
                                               @Valid @RequestBody UpdateNicknameRequest request) {
        userService.updateNickname(email, request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/me")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public ResponseEntity<Void> deleteAccount(@AuthenticationPrincipal String email,
                                              @Valid @RequestBody DeleteAccountRequest request) {
        userService.deleteAccount(email, request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<UserProfileResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getById(id));
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<UserSummaryResponse> searchByEmail(@RequestParam String email) {
        return ResponseEntity.ok(userService.searchByEmail(email));
    }
}
