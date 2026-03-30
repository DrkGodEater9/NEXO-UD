package com.kumorai.nexo.auth.dto;

import java.util.List;

public record LoginResponse(
        String token,
        String email,
        String nickname,
        List<String> roles
) {}
