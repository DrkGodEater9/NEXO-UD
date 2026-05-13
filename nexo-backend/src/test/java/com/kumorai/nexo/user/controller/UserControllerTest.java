package com.kumorai.nexo.user.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kumorai.nexo.shared.config.JwtAuthFilter;
import com.kumorai.nexo.shared.config.SecurityConfig;
import com.kumorai.nexo.shared.config.TestSecurityConfig;
import com.kumorai.nexo.user.dto.DeleteAccountRequest;
import com.kumorai.nexo.user.dto.UpdateNicknameRequest;
import com.kumorai.nexo.user.service.UserService;
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

import static com.kumorai.nexo.shared.TestData.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = UserController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {SecurityConfig.class, JwtAuthFilter.class})
)
@Import(TestSecurityConfig.class)
@DisplayName("UserController - Tests")
class UserControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean UserService userService;

    @Test
    void getMyProfile_autenticado_retorna200() throws Exception {
        when(userService.getMyProfile("test@udistrital.edu.co")).thenReturn(userProfile());

        mockMvc.perform(get("/api/v1/users/me").with(auth("test@udistrital.edu.co", "ESTUDIANTE")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@udistrital.edu.co"));
    }

    @Test
    void requestNicknameCode_autenticado_retorna200() throws Exception {
        mockMvc.perform(post("/api/v1/users/me/nickname/request-code").with(auth("test@udistrital.edu.co", "ESTUDIANTE")))
                .andExpect(status().isOk());
    }

    @Test
    void updateNickname_requestValido_retorna200() throws Exception {
        UpdateNicknameRequest req = new UpdateNicknameRequest("nuevoNick", "123456");

        mockMvc.perform(patch("/api/v1/users/me/nickname")
                        .with(auth("test@udistrital.edu.co", "ESTUDIANTE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    void updateNickname_bodyInvalido_retorna400() throws Exception {
        mockMvc.perform(patch("/api/v1/users/me/nickname")
                        .with(auth("test@udistrital.edu.co", "ESTUDIANTE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deleteAccount_rolEstudiante_retorna204() throws Exception {
        doNothing().when(userService).deleteAccount(any(), any());

        mockMvc.perform(delete("/api/v1/users/me")
                        .with(auth("test@udistrital.edu.co", "ESTUDIANTE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new DeleteAccountRequest("Password123!"))))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteAccount_sinRolEstudiante_retorna403() throws Exception {
        mockMvc.perform(delete("/api/v1/users/me")
                        .with(auth("admin@udistrital.edu.co", "ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new DeleteAccountRequest("Password123!"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void getById_rolAdmin_retorna200() throws Exception {
        when(userService.getById(1L)).thenReturn(userProfile());

        mockMvc.perform(get("/api/v1/users/1").with(auth("admin@udistrital.edu.co", "ADMINISTRADOR")))
                .andExpect(status().isOk());
    }

    @Test
    void getById_sinRolAdmin_retorna403() throws Exception {
        mockMvc.perform(get("/api/v1/users/1").with(auth("test@udistrital.edu.co", "ESTUDIANTE")))
                .andExpect(status().isForbidden());
    }

    @Test
    void search_rolAdmin_retorna200() throws Exception {
        when(userService.searchByEmail("test")).thenReturn(userSummary());

        mockMvc.perform(get("/api/v1/users/search").param("email", "test").with(auth("admin@udistrital.edu.co", "ADMINISTRADOR")))
                .andExpect(status().isOk());
    }
}
