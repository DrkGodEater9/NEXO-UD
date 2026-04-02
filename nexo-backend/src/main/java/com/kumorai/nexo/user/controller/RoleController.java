package com.kumorai.nexo.user.controller;

import com.kumorai.nexo.user.dto.AssignRoleRequest;
import com.kumorai.nexo.user.dto.RoleResponse;
import com.kumorai.nexo.user.service.RoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/roles")
@PreAuthorize("hasRole('ADMINISTRADOR')")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    @GetMapping
    public ResponseEntity<List<String>> getAllRoles() {
        return ResponseEntity.ok(roleService.getAllRoleNames());
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<List<RoleResponse>> getRolesByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(roleService.getRolesByUser(userId));
    }

    @PostMapping("/users/{userId}")
    public ResponseEntity<Void> assignRole(@PathVariable Long userId,
                                           @Valid @RequestBody AssignRoleRequest request) {
        roleService.assignRole(userId, request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/users/{userId}/{roleId}")
    public ResponseEntity<Void> revokeRole(@PathVariable Long userId,
                                           @PathVariable Long roleId) {
        roleService.revokeRole(userId, roleId);
        return ResponseEntity.noContent().build();
    }
}
