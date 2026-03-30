package com.kumorai.nexo.user.dto;

public record UserSummaryResponse(
        Long id,
        String email,
        String nickname,
        boolean active
) {}
