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
import com.kumorai.nexo.user.entity.UserAcademicProgress;
import com.kumorai.nexo.user.repository.RoleRepository;
import com.kumorai.nexo.user.repository.UserAcademicProgressRepository;
import com.kumorai.nexo.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final VerificationCodeRepository verificationCodeRepository;
    private final UserAcademicProgressRepository academicProgressRepository;
    private final StudyPlanRepository studyPlanRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;

    @Value("${nexo.verification.code-ttl-minutes:10}")
    private int codeTtlMinutes;

    @Value("${nexo.verification.max-attempts:3}")
    private int maxAttempts;

    // ── DS-02: Registro ──────────────────────────────────────────────────────

    @Override
    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw NexoException.conflict("El correo ya está registrado");
        }
        if (userRepository.existsByNickname(request.nickname())) {
            throw NexoException.conflict("El apodo ya está en uso");
        }
        if (userRepository.existsByStudentCode(request.studentCode())) {
            throw NexoException.conflict("El código estudiantil ya está registrado");
        }

        StudyPlan studyPlan = studyPlanRepository.findById(request.studyPlanId())
                .orElseThrow(() -> NexoException.badRequest("La carrera seleccionada no existe"));

        User user = User.builder()
                .email(request.email())
                .nickname(request.nickname())
                .passwordHash(passwordEncoder.encode(request.password()))
                .studentCode(request.studentCode())
                .entrySemester(request.entrySemester())
                .active(false)
                .build();
        userRepository.save(user);

        Role role = Role.builder()
                .roleName(RoleName.ESTUDIANTE)
                .user(user)
                .build();
        roleRepository.save(role);

        UserAcademicProgress progress = UserAcademicProgress.builder()
                .user(user)
                .studyPlan(studyPlan)
                .build();
        academicProgressRepository.save(progress);

        issueAndSendCode(request.email(), CodePurpose.VERIFICATION);
    }

    // ── DS-02: Verificación de código ────────────────────────────────────────

    @Override
    @Transactional
    public void verifyCode(VerifyCodeRequest request) {
        VerificationCode code = latestCode(request.email());
        validateCode(code, request.code());

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> NexoException.notFound("Usuario no encontrado"));
        user.setActive(true);
        userRepository.save(user);
    }

    // ── DS-02: Reenvío ───────────────────────────────────────────────────────

    @Override
    @Transactional
    public void resendCode(String email) {
        if (!userRepository.existsByEmail(email)) {
            throw NexoException.notFound("No existe una cuenta con ese correo");
        }
        issueAndSendCode(email, CodePurpose.VERIFICATION);
    }

    // ── DS-02: Login ─────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> NexoException.badRequest("Credenciales inválidas"));

        if (!user.isActive()) {
            throw NexoException.badRequest("La cuenta no está activa. Verifica tu correo");
        }
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw NexoException.badRequest("Credenciales inválidas");
        }

        List<String> roles = roleRepository.findByUserId(user.getId())
                .stream()
                .map(r -> r.getRoleName().name())
                .toList();

        String token = jwtService.generate(user.getEmail(), roles);
        return new LoginResponse(token, user.getEmail(), user.getNickname(), roles);
    }

    // ── Recuperación de contraseña ───────────────────────────────────────────

    @Override
    @Transactional
    public void forgotPassword(String email) {
        // No revelar si el email existe o no (seguridad)
        if (userRepository.existsByEmail(email)) {
            issueAndSendCode(email, CodePurpose.PASSWORD_RESET);
        }
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        VerificationCode code = latestCode(request.email());
        validateCode(code, request.code());

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> NexoException.notFound("Usuario no encontrado"));
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private enum CodePurpose { VERIFICATION, PASSWORD_RESET, NICKNAME_CHANGE }

    private void issueAndSendCode(String email, CodePurpose purpose) {
        String code = String.valueOf(100000 + new SecureRandom().nextInt(900000));

        VerificationCode entity = VerificationCode.builder()
                .email(email)
                .code(code)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(codeTtlMinutes))
                .used(false)
                .attempts(0)
                .build();
        verificationCodeRepository.save(entity);

        switch (purpose) {
            case VERIFICATION    -> emailService.sendVerificationCode(email, code, codeTtlMinutes);
            case PASSWORD_RESET  -> emailService.sendPasswordResetCode(email, code, codeTtlMinutes);
            case NICKNAME_CHANGE -> emailService.sendNicknameChangeCode(email, code, codeTtlMinutes);
        }
    }

    private VerificationCode latestCode(String email) {
        return verificationCodeRepository.findTopByEmailOrderByCreatedAtDesc(email)
                .orElseThrow(() -> NexoException.badRequest("No hay código pendiente para este correo"));
    }

    private void validateCode(VerificationCode code, String input) {
        if (code.isUsed()) {
            throw NexoException.badRequest("El código ya fue utilizado");
        }
        if (code.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw NexoException.badRequest("El código ha expirado. Solicita uno nuevo");
        }
        if (code.getAttempts() >= maxAttempts) {
            throw NexoException.badRequest("Máximo de intentos alcanzado. Solicita un nuevo código");
        }
        if (!code.getCode().equals(input)) {
            code.setAttempts(code.getAttempts() + 1);
            verificationCodeRepository.save(code);
            int remaining = maxAttempts - code.getAttempts();
            throw NexoException.badRequest("Código incorrecto. Intentos restantes: " + remaining);
        }
        code.setUsed(true);
        verificationCodeRepository.save(code);
    }
}
