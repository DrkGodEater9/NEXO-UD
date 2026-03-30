package com.kumorai.nexo.user.service;

import com.kumorai.nexo.shared.exception.NexoException;
import com.kumorai.nexo.user.dto.AssignRoleRequest;
import com.kumorai.nexo.user.dto.RoleResponse;
import com.kumorai.nexo.user.entity.Role;
import com.kumorai.nexo.user.entity.RoleName;
import com.kumorai.nexo.user.repository.RoleRepository;
import com.kumorai.nexo.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RoleServiceImpl implements RoleService {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<String> getAllRoleNames() {
        return Arrays.stream(RoleName.values())
                .map(Enum::name)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoleResponse> getRolesByUser(Long userId) {
        return roleRepository.findByUserId(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void assignRole(Long userId, AssignRoleRequest request) {
        if (!userRepository.existsById(userId)) {
            throw NexoException.notFound("Usuario no encontrado");
        }
        if (roleRepository.existsByUserIdAndRoleName(userId, request.roleName())) {
            throw NexoException.conflict("El usuario ya tiene ese rol asignado");
        }
        var user = userRepository.findById(userId).get();
        roleRepository.save(Role.builder()
                .user(user)
                .roleName(request.roleName())
                .build());
    }

    @Override
    @Transactional
    public void revokeRole(Long userId, Long roleId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> NexoException.notFound("Rol no encontrado"));
        if (!role.getUser().getId().equals(userId)) {
            throw NexoException.forbidden("El rol no pertenece al usuario indicado");
        }
        if (roleRepository.countByUserId(userId) <= 1) {
            throw NexoException.badRequest("El usuario debe tener al menos un rol");
        }
        roleRepository.delete(role);
    }

    private RoleResponse toResponse(Role role) {
        return new RoleResponse(role.getId(), role.getRoleName().name(), role.getAssignedAt());
    }
}
