package com.kumorai.nexo.content.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kumorai.nexo.content.dto.WelfareContentRequest;
import com.kumorai.nexo.content.entity.WelfareCategory;
import com.kumorai.nexo.content.service.WelfareService;
import com.kumorai.nexo.shared.config.JwtAuthFilter;
import com.kumorai.nexo.shared.config.SecurityConfig;
import com.kumorai.nexo.shared.config.TestSecurityConfig;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = WelfareController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {SecurityConfig.class, JwtAuthFilter.class})
)
@Import(TestSecurityConfig.class)
@DisplayName("WelfareController - Tests")
class WelfareControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean WelfareService welfareService;
    @MockBean UserService userService;

    @Test
    void listAll_sinFiltro_retorna200() throws Exception {
        when(welfareService.listAll(null)).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/welfare")).andExpect(status().isOk());
    }

    @Test
    void listAll_conCategoria_retorna200() throws Exception {
        when(welfareService.listAll(WelfareCategory.BECAS)).thenReturn(List.of(welfare()));

        mockMvc.perform(get("/api/v1/welfare").param("category", "BECAS")).andExpect(status().isOk());
    }

    @Test
    void getById_existe_retorna200() throws Exception {
        when(welfareService.getById(1L)).thenReturn(welfare());

        mockMvc.perform(get("/api/v1/welfare/1")).andExpect(status().isOk());
    }

    @Test
    void create_rolRadicador_retorna200() throws Exception {
        when(userService.getMyProfile("rad@udistrital.edu.co")).thenReturn(userProfile());
        when(welfareService.create(any(), eq(1L))).thenReturn(welfare());

        mockMvc.perform(post("/api/v1/welfare")
                        .with(auth("rad@udistrital.edu.co", "RADICADOR_BIENESTAR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request())))
                .andExpect(status().isOk());
    }

    @Test
    void create_rolAdmin_retorna200() throws Exception {
        when(userService.getMyProfile("admin@udistrital.edu.co")).thenReturn(userProfile());
        when(welfareService.create(any(), eq(1L))).thenReturn(welfare());

        mockMvc.perform(post("/api/v1/welfare")
                        .with(auth("admin@udistrital.edu.co", "ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request())))
                .andExpect(status().isOk());
    }

    @Test
    void update_rolAutorizado_retorna200() throws Exception {
        when(welfareService.update(eq(1L), any())).thenReturn(welfare());

        mockMvc.perform(put("/api/v1/welfare/1")
                        .with(auth("admin@udistrital.edu.co", "ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request())))
                .andExpect(status().isOk());
    }

    @Test
    void delete_rolAutorizado_retorna204() throws Exception {
        mockMvc.perform(delete("/api/v1/welfare/1").with(auth("admin@udistrital.edu.co", "ADMINISTRADOR")))
                .andExpect(status().isNoContent());
    }

    private WelfareContentRequest request() {
        return new WelfareContentRequest("Bienestar", "Corto", "Largo", WelfareCategory.BECAS, null, null);
    }
}
