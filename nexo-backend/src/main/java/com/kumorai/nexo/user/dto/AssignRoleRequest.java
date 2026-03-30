package com.kumorai.nexo.user.dto;

import com.kumorai.nexo.user.entity.RoleName;
import jakarta.validation.constraints.NotNull;

public record AssignRoleRequest(
        @NotNull RoleName roleName
) {}
