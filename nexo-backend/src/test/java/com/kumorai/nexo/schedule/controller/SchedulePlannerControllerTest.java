package com.kumorai.nexo.schedule.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kumorai.nexo.academic.entity.DayOfWeek;
import com.kumorai.nexo.academic.service.AcademicOfferService;
import com.kumorai.nexo.schedule.dto.ScheduleBlockRequest;
import com.kumorai.nexo.schedule.dto.ScheduleRequest;
import com.kumorai.nexo.schedule.service.ScheduleService;
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

import java.time.LocalTime;
import java.util.List;
import java.util.Map;

import static com.kumorai.nexo.shared.TestData.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = SchedulePlannerController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {SecurityConfig.class, JwtAuthFilter.class})
)
@Import(TestSecurityConfig.class)
@DisplayName("SchedulePlannerController - Tests")
class SchedulePlannerControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean ScheduleService scheduleService;
    @MockBean AcademicOfferService academicOfferService;
    @MockBean UserService userService;

    @Test
    void getOfferSubjects_sinAutenticacion_retorna200() throws Exception {
        when(academicOfferService.getActive()).thenReturn(academicOffer());
        when(academicOfferService.getSubjectsByOffer(1L, null)).thenReturn(List.of(subject()));

        mockMvc.perform(get("/api/v1/schedules/offer/subjects")).andExpect(status().isOk());
    }

    @Test
    void getOfferSubjects_conStudyPlan_retorna200() throws Exception {
        when(academicOfferService.getActive()).thenReturn(academicOffer());
        when(academicOfferService.getSubjectsByOffer(1L, 10L)).thenReturn(List.of(subject()));

        mockMvc.perform(get("/api/v1/schedules/offer/subjects").param("studyPlanId", "10")).andExpect(status().isOk());
    }

    @Test
    void validateConflicts_bodyConGroupIds_retorna200() throws Exception {
        when(scheduleService.validateConflicts(List.of(1L, 2L))).thenReturn(Map.of("hasConflicts", false));

        mockMvc.perform(post("/api/v1/schedules/validate-conflicts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("groupIds", List.of(1L, 2L)))))
                .andExpect(status().isOk());
    }

    @Test
    void listMySchedules_rolEstudiante_retorna200() throws Exception {
        mockUser();
        when(scheduleService.listByUser(1L)).thenReturn(List.of(schedule()));

        mockMvc.perform(get("/api/v1/schedules").with(auth("test@udistrital.edu.co", "ESTUDIANTE")))
                .andExpect(status().isOk());
    }

    @Test
    void listMySchedules_sinRol_retorna403() throws Exception {
        mockMvc.perform(get("/api/v1/schedules").with(auth("admin@udistrital.edu.co", "ADMINISTRADOR")))
                .andExpect(status().isForbidden());
    }

    @Test
    void create_bodyValido_retorna200() throws Exception {
        mockUser();
        when(scheduleService.create(any(), eq(1L))).thenReturn(schedule());

        mockMvc.perform(post("/api/v1/schedules")
                        .with(auth("test@udistrital.edu.co", "ESTUDIANTE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(scheduleRequest())))
                .andExpect(status().isOk());
    }

    @Test
    void getById_rolEstudiante_retorna200() throws Exception {
        mockUser();
        when(scheduleService.getById(1L, 1L)).thenReturn(schedule());

        mockMvc.perform(get("/api/v1/schedules/1").with(auth("test@udistrital.edu.co", "ESTUDIANTE")))
                .andExpect(status().isOk());
    }

    @Test
    void update_rolEstudiante_retorna200() throws Exception {
        mockUser();
        when(scheduleService.update(eq(1L), eq(1L), any())).thenReturn(schedule());

        mockMvc.perform(put("/api/v1/schedules/1")
                        .with(auth("test@udistrital.edu.co", "ESTUDIANTE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(scheduleRequest())))
                .andExpect(status().isOk());
    }

    @Test
    void delete_rolEstudiante_retorna204() throws Exception {
        mockUser();

        mockMvc.perform(delete("/api/v1/schedules/1").with(auth("test@udistrital.edu.co", "ESTUDIANTE")))
                .andExpect(status().isNoContent());
    }

    @Test
    void archive_archivedTrue_retorna200() throws Exception {
        mockUser();
        when(scheduleService.setArchived(1L, 1L, true)).thenReturn(schedule());

        mockMvc.perform(patch("/api/v1/schedules/1/archive")
                        .with(auth("test@udistrital.edu.co", "ESTUDIANTE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("archived", true))))
                .andExpect(status().isOk());
    }

    private ScheduleRequest scheduleRequest() {
        ScheduleBlockRequest block = new ScheduleBlockRequest(null, null, "#3366ff", true, "Libre",
                DayOfWeek.LUNES, LocalTime.of(8, 0), LocalTime.of(10, 0));
        return new ScheduleRequest("Mi horario", "2025-1", "Notas", List.of(block));
    }

    private void mockUser() {
        when(userService.getMyProfile("test@udistrital.edu.co")).thenReturn(userProfile());
    }
}
