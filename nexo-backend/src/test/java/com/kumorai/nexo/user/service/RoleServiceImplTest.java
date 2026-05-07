package com.kumorai.nexo.user.service;

import com.kumorai.nexo.shared.exception.NexoException;
import com.kumorai.nexo.user.dto.AssignRoleRequest;
import com.kumorai.nexo.user.dto.RoleResponse;
import com.kumorai.nexo.user.entity.Role;
import com.kumorai.nexo.user.entity.RoleName;
import com.kumorai.nexo.user.entity.User;
import com.kumorai.nexo.user.repository.RoleRepository;
import com.kumorai.nexo.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RoleServiceImpl - Pruebas Unitarias")
class RoleServiceImplTest {

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private RoleServiceImpl roleService;

    private User usuario;
    private Role rolEstudiante;
    private Role rolAdmin;

    @BeforeEach
    void setUp() {
        usuario = User.builder()
                .id(1L)
                .email("test@nexo.edu")
                .nickname("testuser")
                .passwordHash("hash")
                .build();

        rolEstudiante = Role.builder()
                .id(10L)
                .roleName(RoleName.ESTUDIANTE)
                .assignedAt(LocalDateTime.now())
                .user(usuario)
                .build();

        rolAdmin = Role.builder()
                .id(11L)
                .roleName(RoleName.ADMINISTRADOR)
                .assignedAt(LocalDateTime.now())
                .user(usuario)
                .build();
    }

    // ─── getAllRoleNames ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("getAllRoleNames()")
    class GetAllRoleNames {

        @Test
        @DisplayName("Debe retornar todos los nombres del enum RoleName")
        void debeRetornarTodosLosNombres() {
            List<String> result = roleService.getAllRoleNames();

            assertThat(result).hasSize(RoleName.values().length);
            assertThat(result).contains(
                    "ADMINISTRADOR", "ESTUDIANTE",
                    "RADICADOR_AVISOS", "RADICADOR_BIENESTAR",
                    "RADICADOR_SEDES", "RADICADOR_CALENDARIO"
            );
        }

        @Test
        @DisplayName("No debe consultar la base de datos para listar nombres de roles")
        void noDebeConsultarBD() {
            roleService.getAllRoleNames();

            verifyNoInteractions(roleRepository, userRepository);
        }
    }

    // ─── getRolesByUser ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("getRolesByUser()")
    class GetRolesByUser {

        @Test
        @DisplayName("Debe retornar los roles asignados al usuario")
        void debeRetornarRoles_cuandoUsuarioTieneRoles() {
            when(roleRepository.findByUserId(1L)).thenReturn(List.of(rolEstudiante, rolAdmin));

            List<RoleResponse> result = roleService.getRolesByUser(1L);

            assertThat(result).hasSize(2);
            assertThat(result).extracting(RoleResponse::roleName)
                    .containsExactlyInAnyOrder("ESTUDIANTE", "ADMINISTRADOR");
        }

        @Test
        @DisplayName("Debe retornar lista vacía cuando el usuario no tiene roles")
        void debeRetornarVacio_cuandoSinRoles() {
            when(roleRepository.findByUserId(anyLong())).thenReturn(List.of());

            List<RoleResponse> result = roleService.getRolesByUser(99L);

            assertThat(result).isEmpty();
        }
    }

    // ─── assignRole ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("assignRole()")
    class AssignRole {

        @Test
        @DisplayName("Debe asignar el rol cuando el usuario existe y no tiene ese rol")
        void debeAsignarRol_cuandoEsValido() {
            when(userRepository.existsById(1L)).thenReturn(true);
            when(roleRepository.existsByUserIdAndRoleName(1L, RoleName.RADICADOR_AVISOS)).thenReturn(false);
            when(userRepository.findById(1L)).thenReturn(Optional.of(usuario));
            when(roleRepository.save(any(Role.class))).thenAnswer(inv -> inv.getArgument(0));

            roleService.assignRole(1L, new AssignRoleRequest(RoleName.RADICADOR_AVISOS));

            verify(roleRepository, times(1)).save(argThat(r ->
                    r.getRoleName() == RoleName.RADICADOR_AVISOS &&
                    r.getUser().getId().equals(1L)
            ));
        }

        @Test
        @DisplayName("Debe lanzar NexoException 404 cuando el usuario no existe")
        void debeLanzarExcepcion_cuandoUsuarioNoExiste() {
            when(userRepository.existsById(anyLong())).thenReturn(false);

            assertThatThrownBy(() -> roleService.assignRole(99L, new AssignRoleRequest(RoleName.ESTUDIANTE)))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));

            verify(roleRepository, never()).save(any());
        }

        @Test
        @DisplayName("Debe lanzar NexoException 409 cuando el usuario ya tiene ese rol")
        void debeLanzarExcepcion_cuandoYaTieneElRol() {
            when(userRepository.existsById(1L)).thenReturn(true);
            when(roleRepository.existsByUserIdAndRoleName(1L, RoleName.ESTUDIANTE)).thenReturn(true);

            assertThatThrownBy(() -> roleService.assignRole(1L, new AssignRoleRequest(RoleName.ESTUDIANTE)))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.CONFLICT));

            verify(roleRepository, never()).save(any());
        }
    }

    // ─── revokeRole ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("revokeRole()")
    class RevokeRole {

        @Test
        @DisplayName("Debe revocar el rol cuando existe y el usuario tiene más de uno")
        void debeRevocarRol_cuandoEsValido() {
            when(roleRepository.findById(10L)).thenReturn(Optional.of(rolEstudiante));
            when(roleRepository.countByUserId(1L)).thenReturn(2L);

            roleService.revokeRole(1L, 10L);

            verify(roleRepository, times(1)).delete(rolEstudiante);
        }

        @Test
        @DisplayName("Debe lanzar NexoException 404 cuando el rol no existe")
        void debeLanzarExcepcion_cuandoRolNoExiste() {
            when(roleRepository.findById(anyLong())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> roleService.revokeRole(1L, 99L))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));

            verify(roleRepository, never()).delete(any());
        }

        @Test
        @DisplayName("Debe lanzar NexoException 403 cuando el rol no pertenece al usuario indicado")
        void debeLanzarExcepcion_cuandoRolNoPerteneceAlUsuario() {
            // rolEstudiante pertenece a usuario con ID 1, pero se intenta revocar como si fuera del usuario 2
            when(roleRepository.findById(10L)).thenReturn(Optional.of(rolEstudiante));

            assertThatThrownBy(() -> roleService.revokeRole(2L, 10L))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));

            verify(roleRepository, never()).delete(any());
        }

        @Test
        @DisplayName("Debe lanzar NexoException 400 cuando es el último rol del usuario")
        void debeLanzarExcepcion_cuandoEsElUltimoRol() {
            when(roleRepository.findById(10L)).thenReturn(Optional.of(rolEstudiante));
            when(roleRepository.countByUserId(1L)).thenReturn(1L);

            assertThatThrownBy(() -> roleService.revokeRole(1L, 10L))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));

            verify(roleRepository, never()).delete(any());
        }
    }
}
