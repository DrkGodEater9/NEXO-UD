package com.kumorai.nexo.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateNicknameRequest(
        @NotBlank @Size(min = 3, max = 30) String newNickname,
        @NotBlank @Size(min = 6, max = 6) String verificationCode
) {}
