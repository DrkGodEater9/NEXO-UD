package com.kumorai.nexo.user.service;

import com.kumorai.nexo.user.dto.CreateUserRequest;
import com.kumorai.nexo.user.dto.UpdateUserRequest;
import com.kumorai.nexo.user.dto.UserResponse;
import com.kumorai.nexo.user.entity.User;
import com.kumorai.nexo.user.entity.Role;
import com.kumorai.nexo.user.exception.UserAlreadyExistsException;
import com.kumorai.nexo.user.exception.UserNotFoundException;
import com.kumorai.nexo.user.mapper.UserMapper;
import com.kumorai.nexo.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Pruebas unitarias para UserServiceImpl.
 * Se mockean UserRepository y PasswordEncoder para aislar
 * la lógica de negocio del servicio sin tocar la BD real.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserServiceImpl - Pruebas Unitarias")
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private UserServiceImpl userService;

    // ─── Fixtures ─────────────────────────────────────────────────────────────

    private User userEstudiante;
    private User userDocente;
    private UserResponse userResponseEstudiante;

    @BeforeEach
    void setUp() {
        userEstudiante = User.builder()
                .id(1L)
                .nombre("Carlos Ramírez")
                .email("carlos.ramirez@nexo.edu")
                .password("hashedPassword123")
                .role(Role.ESTUDIANTE)
                .activo(true)
                .build();

        userDocente = User.builder()
                .id(2L)
                .nombre("Ana López")
                .email("ana.lopez@nexo.edu")
                .password("hashedPassword456")
                .role(Role.DOCENTE)
                .activo(true)
                .build();

        userResponseEstudiante = UserResponse.builder()
                .id(1L)
                .nombre("Carlos Ramírez")
                .email("carlos.ramirez@nexo.edu")
                .role(Role.ESTUDIANTE)
                .activo(true)
                .build();
    }

    // ─── findById ─────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("findById()")
    class FindById {

        @Test
        @DisplayName("Debe retornar el usuario cuando el ID existe")
        void debeRetornarUsuario_cuandoIdExiste() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(userEstudiante));
            when(userMapper.toResponse(userEstudiante)).thenReturn(userResponseEstudiante);

            UserResponse result = userService.findById(1L);

            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(1L);
            assertThat(result.getEmail()).isEqualTo("carlos.ramirez@nexo.edu");
            verify(userRepository, times(1)).findById(1L);
        }

        @Test
        @DisplayName("Debe lanzar UserNotFoundException cuando el ID no existe")
        void debeLanzarExcepcion_cuandoIdNoExiste() {
            when(userRepository.findById(anyLong())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.findById(99L))
                    .isInstanceOf(UserNotFoundException.class)
                    .hasMessageContaining("99");

            verify(userRepository, times(1)).findById(99L);
        }
    }

    // ─── findByEmail ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("findByEmail()")
    class FindByEmail {

        @Test
        @DisplayName("Debe retornar el usuario cuando el email existe")
        void debeRetornarUsuario_cuandoEmailExiste() {
            when(userRepository.findByEmail("carlos.ramirez@nexo.edu"))
                    .thenReturn(Optional.of(userEstudiante));
            when(userMapper.toResponse(userEstudiante)).thenReturn(userResponseEstudiante);

            UserResponse result = userService.findByEmail("carlos.ramirez@nexo.edu");

            assertThat(result.getEmail()).isEqualTo("carlos.ramirez@nexo.edu");
        }

        @Test
        @DisplayName("Debe lanzar UserNotFoundException cuando el email no existe")
        void debeLanzarExcepcion_cuandoEmailNoExiste() {
            when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.findByEmail("noexiste@nexo.edu"))
                    .isInstanceOf(UserNotFoundException.class);
        }
    }

    // ─── findAll ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("findAll()")
    class FindAll {

        @Test
        @DisplayName("Debe retornar lista de todos los usuarios activos")
        void debeRetornarListaUsuarios() {
            when(userRepository.findAllByActivoTrue())
                    .thenReturn(List.of(userEstudiante, userDocente));
            when(userMapper.toResponse(any(User.class))).thenReturn(userResponseEstudiante);

            List<UserResponse> result = userService.findAllActivos();

            assertThat(result).hasSize(2);
            verify(userRepository, times(1)).findAllByActivoTrue();
        }

        @Test
        @DisplayName("Debe retornar lista vacía cuando no hay usuarios activos")
        void debeRetornarListaVacia_cuandoNoHayUsuarios() {
            when(userRepository.findAllByActivoTrue()).thenReturn(List.of());

            List<UserResponse> result = userService.findAllActivos();

            assertThat(result).isEmpty();
        }
    }

    // ─── createUser ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("createUser()")
    class CreateUser {

        private CreateUserRequest createRequest;

        @BeforeEach
        void setUp() {
            createRequest = CreateUserRequest.builder()
                    .nombre("Nuevo Usuario")
                    .email("nuevo@nexo.edu")
                    .password("Password123!")
                    .role(Role.ESTUDIANTE)
                    .build();
        }

        @Test
        @DisplayName("Debe crear y retornar el usuario cuando los datos son válidos")
        void debeCrearUsuario_cuandoDatosSonValidos() {
            when(userRepository.existsByEmail(createRequest.getEmail())).thenReturn(false);
            when(passwordEncoder.encode(createRequest.getPassword())).thenReturn("encodedPassword");
            when(userRepository.save(any(User.class))).thenReturn(userEstudiante);
            when(userMapper.toResponse(userEstudiante)).thenReturn(userResponseEstudiante);

            UserResponse result = userService.createUser(createRequest);

            assertThat(result).isNotNull();
            verify(passwordEncoder, times(1)).encode(createRequest.getPassword());
            verify(userRepository, times(1)).save(any(User.class));
        }

        @Test
        @DisplayName("Debe lanzar UserAlreadyExistsException cuando el email ya está registrado")
        void debeLanzarExcepcion_cuandoEmailYaExiste() {
            when(userRepository.existsByEmail(createRequest.getEmail())).thenReturn(true);

            assertThatThrownBy(() -> userService.createUser(createRequest))
                    .isInstanceOf(UserAlreadyExistsException.class)
                    .hasMessageContaining(createRequest.getEmail());

            verify(userRepository, never()).save(any());
            verify(passwordEncoder, never()).encode(anyString());
        }

        @Test
        @DisplayName("La contraseña guardada debe estar encriptada, nunca en texto plano")
        void debeEncriptarPassword_antesDeGuardar() {
            when(userRepository.existsByEmail(anyString())).thenReturn(false);
            when(passwordEncoder.encode("Password123!")).thenReturn("$2a$10$hashedValue");
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
            when(userMapper.toResponse(any())).thenReturn(userResponseEstudiante);

            userService.createUser(createRequest);

            // Captura el usuario que se pasó al save y verifica que la password no sea el texto plano
            verify(userRepository).save(argThat(u ->
                    !u.getPassword().equals("Password123!") &&
                    u.getPassword().equals("$2a$10$hashedValue")
            ));
        }
    }

    // ─── updateUser ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("updateUser()")
    class UpdateUser {

        @Test
        @DisplayName("Debe actualizar el nombre del usuario cuando existe")
        void debeActualizarNombre_cuandoUsuarioExiste() {
            UpdateUserRequest updateRequest = UpdateUserRequest.builder()
                    .nombre("Carlos R. Actualizado")
                    .build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(userEstudiante));
            when(userRepository.save(any(User.class))).thenReturn(userEstudiante);
            when(userMapper.toResponse(any())).thenReturn(userResponseEstudiante);

            userService.updateUser(1L, updateRequest);

            verify(userRepository, times(1)).save(any(User.class));
        }

        @Test
        @DisplayName("Debe lanzar UserNotFoundException al intentar actualizar un usuario inexistente")
        void debeLanzarExcepcion_cuandoUsuarioNoExisteAlActualizar() {
            UpdateUserRequest updateRequest = UpdateUserRequest.builder()
                    .nombre("Nombre Nuevo")
                    .build();

            when(userRepository.findById(anyLong())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.updateUser(99L, updateRequest))
                    .isInstanceOf(UserNotFoundException.class);

            verify(userRepository, never()).save(any());
        }
    }

    // ─── deleteUser (soft delete) ─────────────────────────────────────────────

    @Nested
    @DisplayName("deleteUser() - Soft Delete")
    class DeleteUser {

        @Test
        @DisplayName("Debe desactivar el usuario (soft delete) en lugar de eliminarlo físicamente")
        void debeDesactivarUsuario_enLugarDeEliminarFisicamente() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(userEstudiante));
            when(userRepository.save(any(User.class))).thenReturn(userEstudiante);

            userService.deleteUser(1L);

            // Verifica que save fue llamado con activo = false
            verify(userRepository).save(argThat(u -> !u.isActivo()));
            // Verifica que deleteById NUNCA se llame (no es eliminación física)
            verify(userRepository, never()).deleteById(anyLong());
        }

        @Test
        @DisplayName("Debe lanzar UserNotFoundException al intentar eliminar un usuario inexistente")
        void debeLanzarExcepcion_cuandoUsuarioNoExisteAlEliminar() {
            when(userRepository.findById(anyLong())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.deleteUser(99L))
                    .isInstanceOf(UserNotFoundException.class);
        }
    }
}
