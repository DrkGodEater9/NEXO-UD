package com.kumorai.nexo.auth.service;

import com.kumorai.nexo.auth.dto.AuthRequest;
import com.kumorai.nexo.auth.dto.AuthResponse;
import com.kumorai.nexo.auth.dto.RegisterRequest;
import com.kumorai.nexo.auth.exception.InvalidCredentialsException;
import com.kumorai.nexo.auth.util.JwtUtil;
import com.kumorai.nexo.user.entity.Role;
import com.kumorai.nexo.user.entity.User;
import com.kumorai.nexo.user.exception.UserAlreadyExistsException;
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

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Pruebas unitarias para AuthServiceImpl.
 * Cubre los flujos críticos de seguridad: login, registro y validación de JWT.
 * Se mockean UserRepository, PasswordEncoder y JwtUtil para aislar la lógica.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthServiceImpl - Pruebas Unitarias")
class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AuthServiceImpl authService;

    // ─── Fixtures ─────────────────────────────────────────────────────────────

    private User userActivo;
    private final String RAW_PASSWORD = "Password123!";
    private final String HASHED_PASSWORD = "$2a$10$hashedValueSimulado";
    private final String VALID_JWT = "eyJhbGciOiJIUzI1NiJ9.validPayload.signature";

    @BeforeEach
    void setUp() {
        userActivo = User.builder()
                .id(1L)
                .nombre("Carlos Ramírez")
                .email("carlos.ramirez@nexo.edu")
                .password(HASHED_PASSWORD)
                .role(Role.ESTUDIANTE)
                .activo(true)
                .build();
    }

    // ─── login ────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("login()")
    class Login {

        @Test
        @DisplayName("Debe retornar un JWT válido cuando las credenciales son correctas")
        void debeRetornarJwt_cuandoCredencialesSonCorrectas() {
            AuthRequest request = new AuthRequest("carlos.ramirez@nexo.edu", RAW_PASSWORD);

            when(userRepository.findByEmail(request.getEmail()))
                    .thenReturn(Optional.of(userActivo));
            when(passwordEncoder.matches(RAW_PASSWORD, HASHED_PASSWORD))
                    .thenReturn(true);
            when(jwtUtil.generateToken(userActivo)).thenReturn(VALID_JWT);

            AuthResponse response = authService.login(request);

            assertThat(response).isNotNull();
            assertThat(response.getToken()).isEqualTo(VALID_JWT);
            assertThat(response.getRole()).isEqualTo(Role.ESTUDIANTE);
            verify(jwtUtil, times(1)).generateToken(userActivo);
        }

        @Test
        @DisplayName("Debe lanzar InvalidCredentialsException cuando el email no existe")
        void debeLanzarExcepcion_cuandoEmailNoExiste() {
            AuthRequest request = new AuthRequest("noexiste@nexo.edu", RAW_PASSWORD);

            when(userRepository.findByEmail(request.getEmail()))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(InvalidCredentialsException.class);

            // No se debe llamar a generateToken si el usuario no existe
            verify(jwtUtil, never()).generateToken(any());
        }

        @Test
        @DisplayName("Debe lanzar InvalidCredentialsException cuando la contraseña es incorrecta")
        void debeLanzarExcepcion_cuandoPasswordEsIncorrecta() {
            AuthRequest request = new AuthRequest("carlos.ramirez@nexo.edu", "WrongPassword!");

            when(userRepository.findByEmail(request.getEmail()))
                    .thenReturn(Optional.of(userActivo));
            when(passwordEncoder.matches("WrongPassword!", HASHED_PASSWORD))
                    .thenReturn(false);

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(InvalidCredentialsException.class);

            verify(jwtUtil, never()).generateToken(any());
        }

        @Test
        @DisplayName("Debe lanzar InvalidCredentialsException cuando el usuario está desactivado")
        void debeLanzarExcepcion_cuandoUsuarioEstaInactivo() {
            userActivo.setActivo(false);
            AuthRequest request = new AuthRequest("carlos.ramirez@nexo.edu", RAW_PASSWORD);

            when(userRepository.findByEmail(request.getEmail()))
                    .thenReturn(Optional.of(userActivo));
            // Aunque la contraseña sea correcta, si está inactivo debe fallar
            when(passwordEncoder.matches(RAW_PASSWORD, HASHED_PASSWORD)).thenReturn(true);

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(InvalidCredentialsException.class);

            verify(jwtUtil, never()).generateToken(any());
        }

        @Test
        @DisplayName("El mensaje de error NO debe revelar si el email existe o no (seguridad)")
        void elMensajeDeError_noDebeRevelarSiEmailExiste() {
            // Ambos casos (email inexistente y password incorrecta) deben lanzar
            // la MISMA excepción con el MISMO mensaje para no dar pistas a atacantes.
            AuthRequest requestEmailInvalido = new AuthRequest("noexiste@nexo.edu", RAW_PASSWORD);
            AuthRequest requestPasswordInvalida = new AuthRequest("carlos.ramirez@nexo.edu", "wrong");

            when(userRepository.findByEmail("noexiste@nexo.edu")).thenReturn(Optional.empty());
            when(userRepository.findByEmail("carlos.ramirez@nexo.edu")).thenReturn(Optional.of(userActivo));
            when(passwordEncoder.matches("wrong", HASHED_PASSWORD)).thenReturn(false);

            Throwable excEmailInvalido = org.assertj.core.api.Assertions.catchThrowable(
                    () -> authService.login(requestEmailInvalido));
            Throwable excPasswordInvalida = org.assertj.core.api.Assertions.catchThrowable(
                    () -> authService.login(requestPasswordInvalida));

            assertThat(excEmailInvalido).isInstanceOf(InvalidCredentialsException.class);
            assertThat(excPasswordInvalida).isInstanceOf(InvalidCredentialsException.class);
            // Mismo mensaje genérico en ambos casos
            assertThat(excEmailInvalido.getMessage()).isEqualTo(excPasswordInvalida.getMessage());
        }
    }

    // ─── register ─────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("register()")
    class Register {

        private RegisterRequest registerRequest;

        @BeforeEach
        void setUp() {
            registerRequest = RegisterRequest.builder()
                    .nombre("Luis Gómez")
                    .email("luis.gomez@nexo.edu")
                    .password(RAW_PASSWORD)
                    .role(Role.ESTUDIANTE)
                    .build();
        }

        @Test
        @DisplayName("Debe registrar el usuario y retornar JWT cuando los datos son únicos")
        void debeRegistrarYRetornarJwt_cuandoDatosSonValidos() {
            when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(false);
            when(passwordEncoder.encode(RAW_PASSWORD)).thenReturn(HASHED_PASSWORD);
            when(userRepository.save(any(User.class))).thenReturn(userActivo);
            when(jwtUtil.generateToken(any(User.class))).thenReturn(VALID_JWT);

            AuthResponse response = authService.register(registerRequest);

            assertThat(response.getToken()).isEqualTo(VALID_JWT);
            verify(passwordEncoder, times(1)).encode(RAW_PASSWORD);
            verify(userRepository, times(1)).save(any(User.class));
        }

        @Test
        @DisplayName("Debe lanzar UserAlreadyExistsException cuando el email ya está registrado")
        void debeLanzarExcepcion_cuandoEmailYaRegistrado() {
            when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(true);

            assertThatThrownBy(() -> authService.register(registerRequest))
                    .isInstanceOf(UserAlreadyExistsException.class)
                    .hasMessageContaining(registerRequest.getEmail());

            verify(userRepository, never()).save(any());
            verify(jwtUtil, never()).generateToken(any());
        }

        @Test
        @DisplayName("La contraseña nunca debe guardarse en texto plano al registrarse")
        void debeGuardarPasswordEncriptada_alRegistrarse() {
            when(userRepository.existsByEmail(anyString())).thenReturn(false);
            when(passwordEncoder.encode(RAW_PASSWORD)).thenReturn(HASHED_PASSWORD);
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
            when(jwtUtil.generateToken(any())).thenReturn(VALID_JWT);

            authService.register(registerRequest);

            verify(userRepository).save(argThat(u ->
                    !u.getPassword().equals(RAW_PASSWORD) &&
                    u.getPassword().equals(HASHED_PASSWORD)
            ));
        }

        @Test
        @DisplayName("El usuario nuevo debe quedar activo por defecto al registrarse")
        void debeQuedarActivo_alRegistrarse() {
            when(userRepository.existsByEmail(anyString())).thenReturn(false);
            when(passwordEncoder.encode(anyString())).thenReturn(HASHED_PASSWORD);
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
            when(jwtUtil.generateToken(any())).thenReturn(VALID_JWT);

            authService.register(registerRequest);

            verify(userRepository).save(argThat(User::isActivo));
        }
    }

    // ─── validateToken ────────────────────────────────────────────────────────

    @Nested
    @DisplayName("validateToken()")
    class ValidateToken {

        @Test
        @DisplayName("Debe retornar true cuando el token JWT es válido y no ha expirado")
        void debeRetornarTrue_cuandoTokenEsValido() {
            when(jwtUtil.isTokenValid(VALID_JWT, userActivo)).thenReturn(true);
            when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(userActivo));
            when(jwtUtil.extractEmail(VALID_JWT)).thenReturn(userActivo.getEmail());

            boolean result = authService.validateToken(VALID_JWT);

            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("Debe retornar false cuando el token JWT está expirado")
        void debeRetornarFalse_cuandoTokenExpirado() {
            String expiredToken = "eyJhbGciOiJIUzI1NiJ9.expiredPayload.sig";
            when(jwtUtil.extractEmail(expiredToken)).thenReturn(userActivo.getEmail());
            when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(userActivo));
            when(jwtUtil.isTokenValid(expiredToken, userActivo)).thenReturn(false);

            boolean result = authService.validateToken(expiredToken);

            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("Debe retornar false cuando el token tiene formato inválido")
        void debeRetornarFalse_cuandoTokenMalformado() {
            when(jwtUtil.extractEmail("token.invalido")).thenThrow(new RuntimeException("JWT malformado"));

            boolean result = authService.validateToken("token.invalido");

            assertThat(result).isFalse();
        }
    }
}
