package com.kumorai.nexo.campus.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kumorai.nexo.campus.dto.CampusRequest;
import com.kumorai.nexo.campus.dto.ClassroomRequest;
import com.kumorai.nexo.campus.dto.RouteRequest;
import com.kumorai.nexo.campus.service.CampusService;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static com.kumorai.nexo.shared.TestData.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = CampusController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {SecurityConfig.class, JwtAuthFilter.class})
)
@Import(TestSecurityConfig.class)
@TestPropertySource(properties = {"nexo.here.api-key=", "nexo.upload.dir=${java.io.tmpdir}/nexo-test-uploads"})
@DisplayName("CampusController - Tests")
class CampusControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean CampusService campusService;
    @MockBean UserService userService;

    @Test
    void listAll_sinAutenticacion_retorna200() throws Exception {
        when(campusService.listAll(null)).thenReturn(List.of(campus()));

        mockMvc.perform(get("/api/v1/campus")).andExpect(status().isOk());
    }

    @Test
    void listAll_conFiltro_retorna200() throws Exception {
        when(campusService.listAll("INGENIERIA")).thenReturn(List.of(campus()));

        mockMvc.perform(get("/api/v1/campus").param("faculty", "INGENIERIA")).andExpect(status().isOk());
    }

    @Test
    void getById_existe_retorna200() throws Exception {
        when(campusService.getById(1L)).thenReturn(campus());

        mockMvc.perform(get("/api/v1/campus/1")).andExpect(status().isOk());
    }

    @Test
    void getById_noExiste_retorna404() throws Exception {
        when(campusService.getById(99L)).thenThrow(NexoException.notFound("Sede no encontrada"));

        mockMvc.perform(get("/api/v1/campus/99")).andExpect(status().isNotFound());
    }

    @Test
    void create_rolAutorizado_retorna200() throws Exception {
        when(campusService.create(any())).thenReturn(campus());

        mockMvc.perform(post("/api/v1/campus")
                        .with(auth("rad@udistrital.edu.co", "RADICADOR_SEDES"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(campusRequest())))
                .andExpect(status().isOk());
    }

    @Test
    void create_sinRol_retorna403() throws Exception {
        mockMvc.perform(post("/api/v1/campus")
                        .with(auth("test@udistrital.edu.co", "ESTUDIANTE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(campusRequest())))
                .andExpect(status().isForbidden());
    }

    @Test
    void update_rolAutorizado_retorna200() throws Exception {
        when(campusService.update(eq(1L), any())).thenReturn(campus());

        mockMvc.perform(put("/api/v1/campus/1")
                        .with(auth("admin@udistrital.edu.co", "ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(campusRequest())))
                .andExpect(status().isOk());
    }

    @Test
    void delete_rolAutorizado_retorna204() throws Exception {
        mockMvc.perform(delete("/api/v1/campus/1").with(auth("admin@udistrital.edu.co", "ADMINISTRADOR")))
                .andExpect(status().isNoContent());
    }

    @Test
    void listClassrooms_cualquierUsuario_retorna200() throws Exception {
        when(campusService.listClassrooms(1L)).thenReturn(List.of(classroom()));

        mockMvc.perform(get("/api/v1/campus/1/classrooms")).andExpect(status().isOk());
    }

    @Test
    void addClassroom_rolAutorizado_retorna200() throws Exception {
        when(campusService.addClassroom(eq(1L), any())).thenReturn(classroom());

        mockMvc.perform(post("/api/v1/campus/1/classrooms")
                        .with(auth("admin@udistrital.edu.co", "ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ClassroomRequest("Lab 1", "A", "2", true))))
                .andExpect(status().isOk());
    }

    @Test
    void deleteClassroom_rolAutorizado_retorna204() throws Exception {
        mockMvc.perform(delete("/api/v1/campus/1/classrooms/2").with(auth("admin@udistrital.edu.co", "ADMINISTRADOR")))
                .andExpect(status().isNoContent());
    }

    @Test
    void addPhoto_rolAutorizado_retorna200() throws Exception {
        when(userService.getMyProfile("admin@udistrital.edu.co")).thenReturn(userProfile());
        when(campusService.addPhoto(eq(1L), eq(2L), anyString(), eq(1L))).thenReturn(classroom());
        MockMultipartFile photo = new MockMultipartFile("photo", "salon.png", "image/png", new byte[]{1, 2, 3});

        mockMvc.perform(multipart("/api/v1/campus/1/classrooms/2/photos")
                        .file(photo)
                        .with(auth("admin@udistrital.edu.co", "ADMINISTRADOR")))
                .andExpect(status().isOk());
    }

    @Test
    void route_sinHereApiKey_retorna400() throws Exception {
        RouteRequest req = new RouteRequest(4.0, -74.0, 4.1, -74.1);

        mockMvc.perform(post("/api/v1/campus/route")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    private CampusRequest campusRequest() {
        return new CampusRequest("Ingenieria", "Cra 8", "INGENIERIA", 4.0, -74.0, "map");
    }
}
