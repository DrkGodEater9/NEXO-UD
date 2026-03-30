package com.kumorai.nexo.user.service;

import com.kumorai.nexo.user.dto.AssignRoleRequest;
import com.kumorai.nexo.user.dto.RoleResponse;

import java.util.List;

public interface RoleService {
    List<String> getAllRoleNames();
    List<RoleResponse> getRolesByUser(Long userId);
    void assignRole(Long userId, AssignRoleRequest request);
    void revokeRole(Long userId, Long roleId);
}
