package com.kumorai.nexo.content.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kumorai.nexo.content.dto.CalendarEventRequest;
import com.kumorai.nexo.content.entity.CalendarEventType;
import com.kumorai.nexo.content.service.CalendarEventService;
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

import java.time.LocalDate;
import java.util.List;

import static com.kumorai.nexo.shared.TestData.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = CalendarEventController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {SecurityConfig.class, JwtAuthFilter.class})
)
@Import(TestSecurityConfig.class)
@DisplayName("CalendarEventController - Tests")
class CalendarEventControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean CalendarEventService calendarEventService;
    @MockBean UserService userService;

    @Test
    void listAll_sinFiltros_retorna200() throws Exception {
        when(calendarEventService.listAll(null, null, null)).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/calendar")).andExpect(status().isOk());
    }

    @Test
    void listAll_conFechas_retorna200() throws Exception {
        when(calendarEventService.listAll(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 12, 31), null))
                .thenReturn(List.of(calendarEvent()));

        mockMvc.perform(get("/api/v1/calendar").param("from", "2025-01-01").param("to", "2025-12-31"))
                .andExpect(status().isOk());
    }

    @Test
    void listAll_fechaInvalida_retorna400() throws Exception {
        mockMvc.perform(get("/api/v1/calendar").param("from", "no-es-fecha"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getById_existe_retorna200() throws Exception {
        when(calendarEventService.getById(1L)).thenReturn(calendarEvent());

        mockMvc.perform(get("/api/v1/calendar/1")).andExpect(status().isOk());
    }

    @Test
    void create_rolAdmin_retorna200() throws Exception {
        when(userService.getMyProfile("admin@udistrital.edu.co")).thenReturn(userProfile());
        when(calendarEventService.create(any(), eq(1L))).thenReturn(calendarEvent());

        mockMvc.perform(post("/api/v1/calendar")
                        .with(auth("admin@udistrital.edu.co", "ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request())))
                .andExpect(status().isOk());
    }

    @Test
    void create_rolRadicador_retorna200() throws Exception {
        when(userService.getMyProfile("rad@udistrital.edu.co")).thenReturn(userProfile());
        when(calendarEventService.create(any(), eq(1L))).thenReturn(calendarEvent());

        mockMvc.perform(post("/api/v1/calendar")
                        .with(auth("rad@udistrital.edu.co", "RADICADOR_CALENDARIO"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request())))
                .andExpect(status().isOk());
    }

    @Test
    void create_sinRol_retorna403() throws Exception {
        mockMvc.perform(post("/api/v1/calendar")
                        .with(auth("test@udistrital.edu.co", "ESTUDIANTE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request())))
                .andExpect(status().isForbidden());
    }

    @Test
    void update_rolAutorizado_retorna200() throws Exception {
        when(calendarEventService.update(eq(1L), any())).thenReturn(calendarEvent());

        mockMvc.perform(put("/api/v1/calendar/1")
                        .with(auth("admin@udistrital.edu.co", "ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request())))
                .andExpect(status().isOk());
    }

    @Test
    void delete_rolAutorizado_retorna204() throws Exception {
        mockMvc.perform(delete("/api/v1/calendar/1").with(auth("admin@udistrital.edu.co", "ADMINISTRADOR")))
                .andExpect(status().isNoContent());
    }

    private CalendarEventRequest request() {
        return new CalendarEventRequest("Evento", "Desc", CalendarEventType.OTRO, LocalDate.of(2025, 1, 1), null);
    }
}
