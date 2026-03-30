package com.kumorai.nexo.user.dto;

import java.time.LocalDateTime;

public record RoleResponse(
        Long id,
        String roleName,
        LocalDateTime assignedAt
) {}
