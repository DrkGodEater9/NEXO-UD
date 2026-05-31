package com.kumorai.nexo.shared.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    @Value("${nexo.email.provider:smtp}")
    private String provider;

    @Value("${nexo.email.api-key:}")
    private String apiKey;

    @Value("${nexo.email.from:Nexo UD <onboarding@resend.dev>}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
        this.httpClient = HttpClient.newHttpClient();
        this.objectMapper = new ObjectMapper();
    }

    @Async
    public void sendVerificationCode(String toEmail, String code, int ttlMinutes) {
        send(toEmail,
             "Nexo UD — Código de verificación",
             "Tu código de verificación es: " + code + "\nVálido por " + ttlMinutes + " minutos.");
    }

    @Async
    public void sendPasswordResetCode(String toEmail, String code, int ttlMinutes) {
        send(toEmail,
             "Nexo UD — Recuperación de contraseña",
             "Tu código de recuperación es: " + code + "\nVálido por " + ttlMinutes + " minutos.");
    }

    @Async
    public void sendNicknameChangeCode(String toEmail, String code, int ttlMinutes) {
        send(toEmail,
             "Nexo UD — Confirmar cambio de apodo",
             "Tu código de confirmación es: " + code + "\nVálido por " + ttlMinutes + " minutos.");
    }

    private void send(String to, String subject, String text) {
        if ("resend".equalsIgnoreCase(provider) && apiKey != null && !apiKey.trim().isEmpty()) {
            sendViaResend(to, subject, text);
        } else {
            sendViaSmtp(to, subject, text);
        }
    }

    private void sendViaSmtp(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
            log.info("Correo enviado exitosamente vía SMTP a '{}' — asunto: '{}'", to, subject);
        } catch (Exception e) {
            log.warn("No se pudo enviar el correo vía SMTP a '{}' — asunto: '{}'. Causa: {}. Contenido:\n{}",
                     to, subject, e.getMessage(), text);
        }
    }

    private void sendViaResend(String to, String subject, String text) {
        try {
            Map<String, Object> bodyMap = new HashMap<>();
            bodyMap.put("from", fromEmail);
            bodyMap.put("to", new String[]{to});
            bodyMap.put("subject", subject);
            bodyMap.put("html", "<div style='font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px; max-width: 600px;'>" +
                                "<h2>Nexo UD</h2>" +
                                "<p style='font-size: 16px;'>" + text.replace("\n", "<br/>") + "</p>" +
                                "</div>");

            String requestBody = objectMapper.writeValueAsString(bodyMap);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Correo enviado exitosamente vía Resend API a '{}' — asunto: '{}'", to, subject);
            } else {
                log.warn("Error al enviar correo vía Resend API a '{}'. Status: {}. Response: {}",
                         to, response.statusCode(), response.body());
            }
        } catch (Exception e) {
            log.warn("No se pudo enviar el correo vía Resend API a '{}' — asunto: '{}'. Causa: {}. Contenido:\n{}",
                     to, subject, e.getMessage(), text);
        }
    }
}
