package com.kumorai.nexo.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
        @Pattern(regexp = "\\d{11}", message = "El código estudiantil debe tener 11 dígitos")
        String studentCode,

        @NotBlank
        @Pattern(regexp = "\\d{4}-(1|2)", message = "El semestre debe tener el formato YYYY-1 o YYYY-2")
        String entrySemester,

        @NotNull
        Long studyPlanId
) {}
