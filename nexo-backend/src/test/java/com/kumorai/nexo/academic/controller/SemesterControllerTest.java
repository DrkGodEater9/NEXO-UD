package com.kumorai.nexo.academic.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kumorai.nexo.academic.entity.Semester;
import com.kumorai.nexo.academic.repository.SemesterRepository;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static com.kumorai.nexo.shared.TestData.auth;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = SemesterController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {SecurityConfig.class, JwtAuthFilter.class})
)
@Import(TestSecurityConfig.class)
@DisplayName("SemesterController - Tests")
class SemesterControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean SemesterRepository semesterRepository;

    @Test
    void getActiveSemester_existeActivo_retorna200() throws Exception {
        when(semesterRepository.findByActiveTrue()).thenReturn(Optional.of(semester(1L, "2025-1", true)));

        mockMvc.perform(get("/api/v1/semesters/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("2025-1"));
    }

    @Test
    void getActiveSemester_sinActivo_retorna204() throws Exception {
        when(semesterRepository.findByActiveTrue()).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/semesters/active")).andExpect(status().isNoContent());
    }

    @Test
    void listAll_rolAdmin_retorna200() throws Exception {
        when(semesterRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(semester(1L, "2025-1", true)));

        mockMvc.perform(get("/api/v1/admin/semesters").with(auth("admin@udistrital.edu.co", "ADMINISTRADOR")))
                .andExpect(status().isOk());
    }

    @Test
    void create_nombreValido_retorna200() throws Exception {
        Semester saved = semester(1L, "2025-1", false);
        when(semesterRepository.findByName("2025-1")).thenReturn(Optional.empty());
        when(semesterRepository.save(any())).thenReturn(saved);

        mockMvc.perform(post("/api/v1/admin/semesters")
                        .with(auth("admin@udistrital.edu.co", "ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", "2025-1"))))
                .andExpect(status().isOk());
    }

    @Test
    void create_nombreDuplicado_retorna400() throws Exception {
        when(semesterRepository.findByName("2025-1")).thenReturn(Optional.of(semester(1L, "2025-1", false)));

        mockMvc.perform(post("/api/v1/admin/semesters")
                        .with(auth("admin@udistrital.edu.co", "ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", "2025-1"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void create_bodySinNombre_retorna400() throws Exception {
        mockMvc.perform(post("/api/v1/admin/semesters")
                        .with(auth("admin@udistrital.edu.co", "ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void activate_existe_retorna200() throws Exception {
        Semester s = semester(1L, "2025-1", false);
        Semester active = semester(1L, "2025-1", true);
        when(semesterRepository.findById(1L)).thenReturn(Optional.of(s));
        when(semesterRepository.save(s)).thenReturn(active);

        mockMvc.perform(patch("/api/v1/admin/semesters/1/activate").with(auth("admin@udistrital.edu.co", "ADMINISTRADOR")))
                .andExpect(status().isOk());
    }

    @Test
    void activate_noExiste_retorna404() throws Exception {
        when(semesterRepository.findById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(patch("/api/v1/admin/semesters/99/activate").with(auth("admin@udistrital.edu.co", "ADMINISTRADOR")))
                .andExpect(status().isNotFound());
    }

    @Test
    void delete_noActivo_retorna204() throws Exception {
        when(semesterRepository.findById(1L)).thenReturn(Optional.of(semester(1L, "2025-1", false)));

        mockMvc.perform(delete("/api/v1/admin/semesters/1").with(auth("admin@udistrital.edu.co", "ADMINISTRADOR")))
                .andExpect(status().isNoContent());
    }

    @Test
    void delete_activo_retorna400() throws Exception {
        when(semesterRepository.findById(1L)).thenReturn(Optional.of(semester(1L, "2025-1", true)));

        mockMvc.perform(delete("/api/v1/admin/semesters/1").with(auth("admin@udistrital.edu.co", "ADMINISTRADOR")))
                .andExpect(status().isBadRequest());
    }

    private Semester semester(Long id, String name, boolean active) {
        return Semester.builder().id(id).name(name).active(active).createdAt(LocalDateTime.now()).build();
    }
}
