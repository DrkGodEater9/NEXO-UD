package com.kumorai.nexo.shared.util;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendVerificationCode(String toEmail, String code, int ttlMinutes) {
        send(
            toEmail,
            "Nexo UD — Código de verificación",
            "Tu código de verificación es: " + code + "\nVálido por " + ttlMinutes + " minutos."
        );
    }

    public void sendPasswordResetCode(String toEmail, String code, int ttlMinutes) {
        send(
            toEmail,
            "Nexo UD — Recuperación de contraseña",
            "Tu código de recuperación es: " + code + "\nVálido por " + ttlMinutes + " minutos."
        );
    }

    public void sendNicknameChangeCode(String toEmail, String code, int ttlMinutes) {
        send(
            toEmail,
            "Nexo UD — Confirmar cambio de apodo",
            "Tu código de confirmación es: " + code + "\nVálido por " + ttlMinutes + " minutos."
        );
    }

    private void send(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("No se pudo enviar el correo a '{}' — asunto: '{}'. Causa: {}. " +
                     "Contenido del mensaje:\n{}", to, subject, e.getMessage(), text);
        }
    }
}
