package com.kumorai.nexo.user.service;

import com.kumorai.nexo.auth.entity.VerificationCode;
import com.kumorai.nexo.auth.repository.VerificationCodeRepository;
import com.kumorai.nexo.shared.exception.NexoException;
import com.kumorai.nexo.shared.util.EmailService;
import com.kumorai.nexo.user.dto.DeleteAccountRequest;
import com.kumorai.nexo.user.dto.UpdateNicknameRequest;
import com.kumorai.nexo.user.dto.UserProfileResponse;
import com.kumorai.nexo.user.dto.UserSummaryResponse;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserServiceImpl - Pruebas Unitarias")
class UserServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private VerificationCodeRepository verificationCodeRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private EmailService emailService;

    @InjectMocks private UserServiceImpl userService;

    private User user;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(userService, "codeTtlMinutes", 10);
        ReflectionTestUtils.setField(userService, "maxAttempts", 3);
        user = User.builder()
                .id(1L)
                .email("test@udistrital.edu.co")
                .nickname("nick")
                .passwordHash("hash")
                .studentCode("20251375001")
                .entrySemester("2025-1")
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Debe retornar perfil con roles")
    void debeRetornarPerfil() {
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(roleRepository.findByUserId(1L)).thenReturn(List.of(Role.builder().roleName(RoleName.ESTUDIANTE).user(user).build()));

        UserProfileResponse result = userService.getMyProfile(user.getEmail());

        assertThat(result.email()).isEqualTo(user.getEmail());
        assertThat(result.roles()).containsExactly("ESTUDIANTE");
    }

    @Test
    @DisplayName("Debe buscar resumen por email")
    void debeBuscarPorEmail() {
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));

        UserSummaryResponse result = userService.searchByEmail(user.getEmail());

        assertThat(result.nickname()).isEqualTo("nick");
    }

    @Nested
    @DisplayName("admin users")
    class AdminUsers {

        @Test
        @DisplayName("Debe listar todos cuando no hay filtro")
        void debeListarTodos() {
            when(userRepository.findAll(any(PageRequest.class))).thenReturn(new PageImpl<>(List.of(user)));

            Page<UserSummaryResponse> result = userService.listAll(null, PageRequest.of(0, 20));

            assertThat(result.getContent()).hasSize(1);
        }

        @Test
        @DisplayName("Debe listar por filtro de email")
        void debeListarPorFiltroEmail() {
            when(userRepository.findByEmailContainingIgnoreCase(eq("test"), any())).thenReturn(new PageImpl<>(List.of(user)));

            Page<UserSummaryResponse> result = userService.listAll("test", PageRequest.of(0, 20));

            assertThat(result.getContent()).hasSize(1);
            verify(userRepository).findByEmailContainingIgnoreCase(eq("test"), any());
        }

        @Test
        @DisplayName("Debe cambiar estado activo")
        void debeCambiarEstadoActivo() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(user));

            userService.setActive(1L, false);

            assertThat(user.isActive()).isFalse();
            verify(userRepository).save(user);
        }
    }

    @Test
    @DisplayName("Debe solicitar codigo para cambio de apodo")
    void debeSolicitarCodigoCambioApodo() {
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));

        userService.requestNicknameChangeCode(user.getEmail());

        verify(verificationCodeRepository).save(any(VerificationCode.class));
        verify(emailService).sendNicknameChangeCode(eq(user.getEmail()), anyString(), eq(10));
    }

    @Test
    @DisplayName("Debe actualizar apodo con codigo valido")
    void debeActualizarApodo() {
        VerificationCode code = VerificationCode.builder()
                .email(user.getEmail())
                .code("123456")
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .used(false)
                .attempts(0)
                .build();
        when(verificationCodeRepository.findTopByEmailOrderByCreatedAtDesc(user.getEmail())).thenReturn(Optional.of(code));
        when(userRepository.existsByNickname("nuevoNick")).thenReturn(false);
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));

        userService.updateNickname(user.getEmail(), new UpdateNicknameRequest("nuevoNick", "123456"));

        assertThat(user.getNickname()).isEqualTo("nuevoNick");
        assertThat(code.isUsed()).isTrue();
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("Debe eliminar cuenta cuando password coincide")
    void debeEliminarCuenta() {
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Password123!", "hash")).thenReturn(true);

        userService.deleteAccount(user.getEmail(), new DeleteAccountRequest("Password123!"));

        verify(userRepository).delete(user);
    }

    @Test
    @DisplayName("Debe lanzar error cuando usuario no existe")
    void debeLanzarNotFound() {
        when(userRepository.findByEmail("nadie@udistrital.edu.co")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getMyProfile("nadie@udistrital.edu.co"))
                .isInstanceOf(NexoException.class);
    }
}
