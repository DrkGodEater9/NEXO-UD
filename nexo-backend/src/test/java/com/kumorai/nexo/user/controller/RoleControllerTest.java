package com.kumorai.nexo.user.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kumorai.nexo.shared.config.JwtAuthFilter;
import com.kumorai.nexo.shared.config.SecurityConfig;
import com.kumorai.nexo.shared.config.TestSecurityConfig;
import com.kumorai.nexo.user.dto.AssignRoleRequest;
import com.kumorai.nexo.user.dto.RoleResponse;
import com.kumorai.nexo.user.entity.RoleName;
import com.kumorai.nexo.user.service.RoleService;
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

import java.time.LocalDateTime;
import java.util.List;

import static com.kumorai.nexo.shared.TestData.auth;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = RoleController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {SecurityConfig.class, JwtAuthFilter.class})
)
@Import(TestSecurityConfig.class)
@DisplayName("RoleController - Tests")
class RoleControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean RoleService roleService;

    @Test
    void getAllRoles_rolAdmin_retorna200() throws Exception {
        when(roleService.getAllRoleNames()).thenReturn(List.of("ESTUDIANTE", "ADMINISTRADOR"));

        mockMvc.perform(get("/api/v1/admin/roles").with(auth("admin@udistrital.edu.co", "ADMINISTRADOR")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").value("ESTUDIANTE"));
    }

    @Test
    void getAllRoles_sinPermisos_retorna403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/roles").with(auth("test@udistrital.edu.co", "ESTUDIANTE")))
                .andExpect(status().isForbidden());
    }

    @Test
    void getRolesByUser_rolAdmin_retorna200() throws Exception {
        when(roleService.getRolesByUser(1L)).thenReturn(List.of(new RoleResponse(1L, "ESTUDIANTE", LocalDateTime.now())));

        mockMvc.perform(get("/api/v1/admin/roles/users/1").with(auth("admin@udistrital.edu.co", "ADMINISTRADOR")))
                .andExpect(status().isOk());
    }

    @Test
    void assignRole_bodyValido_retorna200() throws Exception {
        doNothing().when(roleService).assignRole(eq(1L), any());

        mockMvc.perform(post("/api/v1/admin/roles/users/1")
                        .with(auth("admin@udistrital.edu.co", "ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AssignRoleRequest(RoleName.ESTUDIANTE))))
                .andExpect(status().isOk());
    }

    @Test
    void assignRole_bodyVacio_retorna400() throws Exception {
        mockMvc.perform(post("/api/v1/admin/roles/users/1")
                        .with(auth("admin@udistrital.edu.co", "ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void revokeRole_rolAdmin_retorna204() throws Exception {
        mockMvc.perform(delete("/api/v1/admin/roles/users/1/2").with(auth("admin@udistrital.edu.co", "ADMINISTRADOR")))
                .andExpect(status().isNoContent());
    }
}
