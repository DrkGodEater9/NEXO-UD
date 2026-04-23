package com.kumorai.nexo.user.service;

import com.kumorai.nexo.auth.entity.VerificationCode;
import com.kumorai.nexo.auth.repository.VerificationCodeRepository;
import com.kumorai.nexo.shared.exception.NexoException;
import com.kumorai.nexo.shared.util.EmailService;
import com.kumorai.nexo.user.dto.DeleteAccountRequest;
import com.kumorai.nexo.user.dto.UpdateNicknameRequest;
import com.kumorai.nexo.user.dto.UserProfileResponse;
import com.kumorai.nexo.user.dto.UserSummaryResponse;
import com.kumorai.nexo.user.entity.User;
import com.kumorai.nexo.user.repository.RoleRepository;
import com.kumorai.nexo.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final VerificationCodeRepository verificationCodeRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Value("${nexo.verification.code-ttl-minutes:10}")
    private int codeTtlMinutes;

    @Value("${nexo.verification.max-attempts:3}")
    private int maxAttempts;

    // ── DS-03: Lectura de perfil ─────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getMyProfile(String email) {
        return toProfile(findByEmail(email));
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getById(Long id) {
        return toProfile(userRepository.findById(id)
                .orElseThrow(() -> NexoException.notFound("Usuario no encontrado")));
    }

    @Override
    @Transactional(readOnly = true)
    public UserSummaryResponse searchByEmail(String email) {
        return toSummary(findByEmail(email));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserSummaryResponse> listAll(String emailFilter, Pageable pageable) {
        if (emailFilter != null && !emailFilter.isBlank()) {
            return userRepository.findByEmailContainingIgnoreCase(emailFilter, pageable)
                    .map(this::toSummary);
        }
        return userRepository.findAll(pageable).map(this::toSummary);
    }

    // ── DS-03: Cambio de apodo con verificación ──────────────────────────────

    @Override
    @Transactional
    public void requestNicknameChangeCode(String email) {
        findByEmail(email); // Verifica que exista
        String code = generateCode();
        saveCode(email, code);
        emailService.sendNicknameChangeCode(email, code, codeTtlMinutes);
    }

    @Override
    @Transactional
    public void updateNickname(String email, UpdateNicknameRequest request) {
        VerificationCode code = latestCode(email);
        validateAndConsume(code, request.verificationCode());

        if (userRepository.existsByNickname(request.newNickname())) {
            throw NexoException.conflict("El apodo ya está en uso");
        }
        User user = findByEmail(email);
        user.setNickname(request.newNickname());
        userRepository.save(user);
    }

    // ── DS-03: Eliminación de cuenta ─────────────────────────────────────────

    @Override
    @Transactional
    public void deleteAccount(String email, DeleteAccountRequest request) {
        User user = findByEmail(email);
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw NexoException.badRequest("Contraseña incorrecta");
        }
        userRepository.delete(user);
    }

    // ── DS-11: Activar / suspender cuenta (administrador) ────────────────────

    @Override
    @Transactional
    public void setActive(Long userId, boolean active) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> NexoException.notFound("Usuario no encontrado"));
        user.setActive(active);
        userRepository.save(user);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> NexoException.notFound("Usuario no encontrado"));
    }

    private UserProfileResponse toProfile(User user) {
        String faculty = null;
        String career = null;
        if (user.getAcademicProgressList() != null && !user.getAcademicProgressList().isEmpty()) {
            com.kumorai.nexo.academic.entity.StudyPlan plan = user.getAcademicProgressList().get(0).getStudyPlan();
            faculty = plan.getFacultad();
            career = plan.getNombre();
        }

        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getNickname(),
                user.isActive(),
                user.getCreatedAt(),
                roleRepository.findByUserId(user.getId())
                        .stream().map(r -> r.getRoleName().name()).toList(),
                user.getStudentCode(),
                user.getEntrySemester(),
                faculty,
                career
        );
    }

    private UserSummaryResponse toSummary(User user) {
        return new UserSummaryResponse(
                user.getId(), user.getEmail(), user.getNickname(), user.isActive()
        );
    }

    private void saveCode(String email, String code) {
        verificationCodeRepository.save(VerificationCode.builder()
                .email(email)
                .code(code)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(codeTtlMinutes))
                .used(false)
                .attempts(0)
                .build());
    }

    private VerificationCode latestCode(String email) {
        return verificationCodeRepository.findTopByEmailOrderByCreatedAtDesc(email)
                .orElseThrow(() -> NexoException.badRequest("No hay código pendiente para este correo"));
    }

    private void validateAndConsume(VerificationCode code, String input) {
        if (code.isUsed()) throw NexoException.badRequest("El código ya fue utilizado");
        if (code.getExpiresAt().isBefore(LocalDateTime.now())) throw NexoException.badRequest("El código ha expirado");
        if (code.getAttempts() >= maxAttempts) throw NexoException.badRequest("Máximo de intentos alcanzado");
        if (!code.getCode().equals(input)) {
            code.setAttempts(code.getAttempts() + 1);
            verificationCodeRepository.save(code);
            throw NexoException.badRequest("Código incorrecto. Intentos restantes: " + (maxAttempts - code.getAttempts()));
        }
        code.setUsed(true);
        verificationCodeRepository.save(code);
    }

    private String generateCode() {
        return String.valueOf(100000 + new SecureRandom().nextInt(900000));
    }
}
