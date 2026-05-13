package com.kumorai.nexo.content.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kumorai.nexo.content.dto.AnnouncementRequest;
import com.kumorai.nexo.content.entity.AnnouncementScope;
import com.kumorai.nexo.content.entity.AnnouncementType;
import com.kumorai.nexo.content.service.AnnouncementService;
import com.kumorai.nexo.shared.config.JwtAuthFilter;
import com.kumorai.nexo.shared.config.SecurityConfig;
import com.kumorai.nexo.shared.config.TestSecurityConfig;
import com.kumorai.nexo.shared.exception.NexoException;
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

import java.util.List;

import static com.kumorai.nexo.shared.TestData.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = AnnouncementController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {SecurityConfig.class, JwtAuthFilter.class})
)
@Import(TestSecurityConfig.class)
@DisplayName("AnnouncementController - Tests")
class AnnouncementControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean AnnouncementService announcementService;
    @MockBean UserService userService;

    @Test
    void listAll_sinFiltros_retorna200() throws Exception {
        when(announcementService.listAll(null, null, null)).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/announcements"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    @Test
    void listAll_conFiltros_retorna200() throws Exception {
        when(announcementService.listAll(AnnouncementScope.UNIVERSIDAD, AnnouncementType.GENERAL, "INGENIERIA"))
                .thenReturn(List.of(announcement()));

        mockMvc.perform(get("/api/v1/announcements")
                        .param("scope", "UNIVERSIDAD")
                        .param("type", "GENERAL")
                        .param("faculty", "INGENIERIA"))
                .andExpect(status().isOk());
    }

    @Test
    void getById_existe_retorna200() throws Exception {
        when(announcementService.getById(1L)).thenReturn(announcement());

        mockMvc.perform(get("/api/v1/announcements/1")).andExpect(status().isOk());
    }

    @Test
    void getById_noExiste_retorna404() throws Exception {
        when(announcementService.getById(99L)).thenThrow(NexoException.notFound("Aviso no encontrado"));

        mockMvc.perform(get("/api/v1/announcements/99")).andExpect(status().isNotFound());
    }

    @Test
    void create_rolAutorizado_retorna200() throws Exception {
        when(userService.getMyProfile("rad@udistrital.edu.co")).thenReturn(userProfile());
        when(announcementService.create(any(), eq(1L))).thenReturn(announcement());

        mockMvc.perform(post("/api/v1/announcements")
                        .with(auth("rad@udistrital.edu.co", "RADICADOR_AVISOS"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request())))
                .andExpect(status().isOk());
    }

    @Test
    void create_sinRol_retorna403() throws Exception {
        mockMvc.perform(post("/api/v1/announcements")
                        .with(auth("test@udistrital.edu.co", "ESTUDIANTE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request())))
                .andExpect(status().isForbidden());
    }

    @Test
    void update_rolAutorizado_retorna200() throws Exception {
        when(announcementService.update(eq(1L), any())).thenReturn(announcement());

        mockMvc.perform(put("/api/v1/announcements/1")
                        .with(auth("admin@udistrital.edu.co", "ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request())))
                .andExpect(status().isOk());
    }

    @Test
    void delete_rolAutorizado_retorna204() throws Exception {
        mockMvc.perform(delete("/api/v1/announcements/1").with(auth("admin@udistrital.edu.co", "ADMINISTRADOR")))
                .andExpect(status().isNoContent());
    }

    private AnnouncementRequest request() {
        return new AnnouncementRequest("Aviso", "Cuerpo", AnnouncementScope.UNIVERSIDAD, AnnouncementType.GENERAL, null, null, null);
    }
}
