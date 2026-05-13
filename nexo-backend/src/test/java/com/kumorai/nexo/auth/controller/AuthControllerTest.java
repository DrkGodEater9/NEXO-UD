package com.kumorai.nexo.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kumorai.nexo.auth.dto.*;
import com.kumorai.nexo.auth.service.AuthService;
import com.kumorai.nexo.shared.config.JwtAuthFilter;
import com.kumorai.nexo.shared.config.SecurityConfig;
import com.kumorai.nexo.shared.config.TestSecurityConfig;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = AuthController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {SecurityConfig.class, JwtAuthFilter.class})
)
@Import(TestSecurityConfig.class)
@DisplayName("AuthController - Tests")
class AuthControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean AuthService authService;

    @Test
    void register_conDatosValidos_retorna202() throws Exception {
        RegisterRequest req = new RegisterRequest("test@udistrital.edu.co", "testuser", "Password123!", "20201000001");
        doNothing().when(authService).register(any());

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isAccepted());
    }

    @Test
    void register_emailNoInstitucional_retorna400() throws Exception {
        RegisterRequest req = new RegisterRequest("test@gmail.com", "testuser", "Password123!", "20201000001");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_bodyVacio_retorna400() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void verifyCode_bodyValido_retorna200() throws Exception {
        mockMvc.perform(post("/api/v1/auth/verify-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new VerifyCodeRequest("test@udistrital.edu.co", "123456"))))
                .andExpect(status().isOk());
    }

    @Test
    void verifyCode_bodyVacio_retorna400() throws Exception {
        mockMvc.perform(post("/api/v1/auth/verify-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void resendCode_emailValido_retorna200() throws Exception {
        mockMvc.perform(post("/api/v1/auth/resend-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new EmailRequest("test@udistrital.edu.co"))))
                .andExpect(status().isOk());
    }

    @Test
    void login_conCredencialesValidas_retornaToken() throws Exception {
        when(authService.login(any())).thenReturn(new LoginResponse("jwt-token", "test@udistrital.edu.co", "nick", List.of("ESTUDIANTE")));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("test@udistrital.edu.co", "Password123!"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token"));
    }

    @Test
    void login_sinEmail_retorna400() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"Password123!\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_sinPassword_retorna400() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"test@udistrital.edu.co\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void logout_retorna200() throws Exception {
        mockMvc.perform(post("/api/v1/auth/logout")).andExpect(status().isOk());
    }

    @Test
    void forgotPassword_emailValido_retorna200() throws Exception {
        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new EmailRequest("test@udistrital.edu.co"))))
                .andExpect(status().isOk());
    }

    @Test
    void resetPassword_requestValido_retorna200() throws Exception {
        ResetPasswordRequest req = new ResetPasswordRequest("test@udistrital.edu.co", "123456", "Password123!");

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }
}
