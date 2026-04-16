package com.kumorai.nexo.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank
        @Email
        @Pattern(regexp = ".*@udistrital\\.edu\\.co$",
                 message = "Debe ser un correo institucional @udistrital.edu.co")
        String email,

        @NotBlank @Size(min = 3, max = 30)
        String nickname,

        @NotBlank @Size(min = 8)
        String password,

        @NotBlank
        @Pattern(regexp = "\\d{11}", message = "El código estudiantil debe tener exactamente 11 dígitos numéricos")
        String studentCode
) {}
