package com.kumorai.nexo.auth.controller;

import com.kumorai.nexo.auth.dto.EmailRequest;
import com.kumorai.nexo.auth.dto.LoginRequest;
import com.kumorai.nexo.auth.dto.LoginResponse;
import com.kumorai.nexo.auth.dto.RegisterRequest;
import com.kumorai.nexo.auth.dto.ResetPasswordRequest;
import com.kumorai.nexo.auth.dto.VerifyCodeRequest;
import com.kumorai.nexo.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<Void> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/verify-code")
    public ResponseEntity<Void> verifyCode(@Valid @RequestBody VerifyCodeRequest request) {
        authService.verifyCode(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/resend-code")
    public ResponseEntity<Void> resendCode(@Valid @RequestBody EmailRequest request) {
        authService.resendCode(request.email());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        // JWT is stateless; invalidation handled client-side or via token blacklist
        return ResponseEntity.ok().build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody EmailRequest request) {
        authService.forgotPassword(request.email());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok().build();
    }
}
