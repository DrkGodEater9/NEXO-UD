package com.kumorai.nexo.auth.service;

import com.kumorai.nexo.academic.entity.StudyPlan;
import com.kumorai.nexo.academic.repository.StudyPlanRepository;
import com.kumorai.nexo.auth.dto.LoginRequest;
import com.kumorai.nexo.auth.dto.LoginResponse;
import com.kumorai.nexo.auth.dto.RegisterRequest;
import com.kumorai.nexo.auth.dto.ResetPasswordRequest;
import com.kumorai.nexo.auth.dto.VerifyCodeRequest;
import com.kumorai.nexo.auth.entity.VerificationCode;
import com.kumorai.nexo.auth.repository.VerificationCodeRepository;
import com.kumorai.nexo.shared.exception.NexoException;
import com.kumorai.nexo.shared.util.EmailService;
import com.kumorai.nexo.shared.util.JwtService;
import com.kumorai.nexo.user.entity.Role;
import com.kumorai.nexo.user.entity.RoleName;
import com.kumorai.nexo.user.entity.User;
import com.kumorai.nexo.user.repository.RoleRepository;
import com.kumorai.nexo.user.repository.UserAcademicProgressRepository;
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
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthServiceImpl - Pruebas Unitarias")
class AuthServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private VerificationCodeRepository verificationCodeRepository;
    @Mock private UserAcademicProgressRepository academicProgressRepository;
    @Mock private StudyPlanRepository studyPlanRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private EmailService emailService;

    @InjectMocks private AuthServiceImpl authService;

    private User user;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "codeTtlMinutes", 10);
        ReflectionTestUtils.setField(authService, "maxAttempts", 3);
        user = User.builder()
                .id(1L)
                .email("test@udistrital.edu.co")
                .nickname("nick")
                .passwordHash("hash")
                .studentCode("20251375001")
                .entrySemester("2025-1")
                .active(true)
                .build();
    }

    @Nested
    @DisplayName("register()")
    class Register {

        @Test
        @DisplayName("Debe crear usuario, rol, progreso y codigo de verificacion")
        void debeRegistrarUsuarioValido() {
            RegisterRequest request = new RegisterRequest("test@udistrital.edu.co", "nick", "Password123!", "20251375001");
            when(userRepository.existsByEmail(request.email())).thenReturn(false);
            when(userRepository.existsByNickname(request.nickname())).thenReturn(false);
            when(userRepository.existsByStudentCode(request.studentCode())).thenReturn(false);
            when(studyPlanRepository.findByCodigoPlan("375")).thenReturn(Optional.of(StudyPlan.builder().id(1L).codigoPlan("375").nombre("Sistemas").facultad("Ingenieria").build()));
            when(passwordEncoder.encode(request.password())).thenReturn("hash");
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            authService.register(request);

            verify(userRepository).save(argThat(saved -> saved.getEmail().equals(request.email()) && !saved.isActive()));
            verify(roleRepository).save(argThat(role -> role.getRoleName() == RoleName.ESTUDIANTE));
            verify(academicProgressRepository).save(any());
            verify(verificationCodeRepository).save(any(VerificationCode.class));
            verify(emailService).sendVerificationCode(eq(request.email()), anyString(), eq(10));
        }

        @Test
        @DisplayName("Debe lanzar conflicto cuando el correo ya existe")
        void debeLanzarConflicto_cuandoEmailExiste() {
            RegisterRequest request = new RegisterRequest("test@udistrital.edu.co", "nick", "Password123!", "20251375001");
            when(userRepository.existsByEmail(request.email())).thenReturn(true);

            assertThatThrownBy(() -> authService.register(request))
                    .isInstanceOf(NexoException.class)
                    .hasMessageContaining("correo");
        }

        @Test
        @DisplayName("Debe lanzar bad request cuando el codigo estudiantil es invalido")
        void debeLanzarBadRequest_cuandoCodigoInvalido() {
            RegisterRequest request = new RegisterRequest("test@udistrital.edu.co", "nick", "Password123!", "202513000");

            assertThatThrownBy(() -> authService.register(request))
                    .isInstanceOf(NexoException.class)
                    .hasMessageContaining("11");
        }
    }

    @Nested
    @DisplayName("login()")
    class Login {

        @Test
        @DisplayName("Debe retornar token cuando las credenciales son validas")
        void debeRetornarToken() {
            when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("Password123!", "hash")).thenReturn(true);
            when(roleRepository.findByUserId(1L)).thenReturn(List.of(Role.builder().roleName(RoleName.ESTUDIANTE).user(user).build()));
            when(jwtService.generate(user.getEmail(), List.of("ESTUDIANTE"))).thenReturn("jwt-token");

            LoginResponse response = authService.login(new LoginRequest(user.getEmail(), "Password123!"));

            assertThat(response.token()).isEqualTo("jwt-token");
            assertThat(response.roles()).containsExactly("ESTUDIANTE");
        }

        @Test
        @DisplayName("Debe rechazar cuenta inactiva")
        void debeRechazarCuentaInactiva() {
            user.setActive(false);
            when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));

            assertThatThrownBy(() -> authService.login(new LoginRequest(user.getEmail(), "Password123!")))
                    .isInstanceOf(NexoException.class)
                    .hasMessageContaining("activa");
        }
    }

    @Test
    @DisplayName("verifyCode() debe activar el usuario cuando el codigo es correcto")
    void verifyCode_debeActivarUsuario() {
        VerificationCode code = code("123456");
        user.setActive(false);
        when(verificationCodeRepository.findTopByEmailOrderByCreatedAtDesc(user.getEmail())).thenReturn(Optional.of(code));
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));

        authService.verifyCode(new VerifyCodeRequest(user.getEmail(), "123456"));

        assertThat(code.isUsed()).isTrue();
        assertThat(user.isActive()).isTrue();
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("resetPassword() debe cambiar el hash cuando el codigo es correcto")
    void resetPassword_debeCambiarPassword() {
        VerificationCode code = code("123456");
        when(verificationCodeRepository.findTopByEmailOrderByCreatedAtDesc(user.getEmail())).thenReturn(Optional.of(code));
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("NuevaPassword123!")).thenReturn("new-hash");

        authService.resetPassword(new ResetPasswordRequest(user.getEmail(), "123456", "NuevaPassword123!"));

        assertThat(user.getPasswordHash()).isEqualTo("new-hash");
        verify(userRepository).save(user);
    }

    private VerificationCode code(String value) {
        return VerificationCode.builder()
                .email(user.getEmail())
                .code(value)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .used(false)
                .attempts(0)
                .build();
    }
}
