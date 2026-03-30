package com.kumorai.nexo.auth.repository;

import com.kumorai.nexo.auth.entity.VerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface VerificationCodeRepository extends JpaRepository<VerificationCode, Long> {

    // Código más reciente para un email (usado en verificación y reenvío)
    Optional<VerificationCode> findTopByEmailOrderByCreatedAtDesc(String email);

    // Limpieza de códigos expirados (mantenimiento)
    void deleteByExpiresAtBefore(LocalDateTime threshold);

    // Verificar si ya existe un código activo para un email
    boolean existsByEmailAndUsedFalseAndExpiresAtAfter(String email, LocalDateTime now);
}
