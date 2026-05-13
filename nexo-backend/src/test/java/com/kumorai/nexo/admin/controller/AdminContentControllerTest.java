package com.kumorai.nexo.admin.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kumorai.nexo.academic.dto.CurriculumSubjectRequest;
import com.kumorai.nexo.academic.service.CurriculumSubjectService;
import com.kumorai.nexo.academic.service.StudyPlanService;
import com.kumorai.nexo.campus.dto.CampusRequest;
import com.kumorai.nexo.campus.service.CampusService;
import com.kumorai.nexo.shared.config.JwtAuthFilter;
import com.kumorai.nexo.shared.config.SecurityConfig;
import com.kumorai.nexo.shared.config.TestSecurityConfig;
import com.kumorai.nexo.user.dto.SetActiveRequest;
import com.kumorai.nexo.user.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static com.kumorai.nexo.shared.TestData.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = AdminContentController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {SecurityConfig.class, JwtAuthFilter.class})
)
@Import(TestSecurityConfig.class)
@DisplayName("AdminContentController - Tests")
class AdminContentControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean UserService userService;
    @MockBean CampusService campusService;
    @MockBean StudyPlanService studyPlanService;
    @MockBean CurriculumSubjectService curriculumSubjectService;

    @Test
    void listUsers_rolAdmin_retorna200() throws Exception {
        when(userService.listAll(isNull(), any())).thenReturn(new PageImpl<>(List.of(userSummary())));

        mockMvc.perform(get("/api/v1/admin/users").with(auth("admin@udistrital.edu.co", "ADMINISTRADOR")))
                .andExpect(status().isOk());
    }

    @Test
    void listUsers_conEmail_retorna200() throws Exception {
        when(userService.listAll(eq("test"), any())).thenReturn(new PageImpl<>(List.of(userSummary())));

        mockMvc.perform(get("/api/v1/admin/users").param("email", "test").with(auth("admin@udistrital.edu.co", "ADMINISTRADOR")))
                .andExpect(status().isOk());
    }

    @Test
    void listUsers_sinRolAdmin_retorna403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users").with(auth("test@udistrital.edu.co", "ESTUDIANTE")))
                .andExpect(status().isForbidden());
    }

    @Test
    void getUserById_rolAdmin_retorna200() throws Exception {
        when(userService.getById(1L)).thenReturn(userProfile());

        mockMvc.perform(get("/api/v1/admin/users/1").with(auth("admin@udistrital.edu.co", "ADMINISTRADOR")))
                .andExpect(status().isOk());
    }

    @Test
    void setUserStatus_bodyValido_retorna200() throws Exception {
        mockMvc.perform(patch("/api/v1/admin/users/1/status")
                        .with(auth("admin@udistrital.edu.co", "ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SetActiveRequest(true))))
                .andExpect(status().isOk());
    }

    @Test
    void setUserStatus_bodyVacio_retorna400() throws Exception {
        mockMvc.perform(patch("/api/v1/admin/users/1/status")
                        .with(auth("admin@udistrital.edu.co", "ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createCampus_rolAdmin_retorna200() throws Exception {
        when(campusService.create(any())).thenReturn(campus());

        mockMvc.perform(post("/api/v1/admin/campus")
                        .with(auth("admin@udistrital.edu.co", "ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CampusRequest("Sede", "Dir", "INGENIERIA", 4.0, -74.0, "map"))))
                .andExpect(status().isOk());
    }

    @Test
    void deleteCampus_rolAdmin_retorna204() throws Exception {
        mockMvc.perform(delete("/api/v1/admin/campus/1").with(auth("admin@udistrital.edu.co", "ADMINISTRADOR")))
                .andExpect(status().isNoContent());
    }

    @Test
    void listStudyPlans_rolAdmin_retorna200() throws Exception {
        when(studyPlanService.listAll()).thenReturn(List.of(studyPlan()));

        mockMvc.perform(get("/api/v1/admin/study-plans").with(auth("admin@udistrital.edu.co", "ADMINISTRADOR")))
                .andExpect(status().isOk());
    }

    @Test
    void listCurriculum_rolAdmin_retorna200() throws Exception {
        when(curriculumSubjectService.listByStudyPlan(1L)).thenReturn(List.of(curriculumSubject()));

        mockMvc.perform(get("/api/v1/admin/study-plans/1/curriculum").with(auth("admin@udistrital.edu.co", "ADMINISTRADOR")))
                .andExpect(status().isOk());
    }

    @Test
    void addCurriculumSubject_rolAdmin_retorna200() throws Exception {
        when(curriculumSubjectService.create(eq(1L), any())).thenReturn(curriculumSubject());

        mockMvc.perform(post("/api/v1/admin/study-plans/1/curriculum")
                        .with(auth("admin@udistrital.edu.co", "ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(curriculumRequest())))
                .andExpect(status().isOk());
    }

    @Test
    void updateCurriculumSubject_rolAdmin_retorna200() throws Exception {
        when(curriculumSubjectService.update(eq(1L), eq(2L), any())).thenReturn(curriculumSubject());

        mockMvc.perform(put("/api/v1/admin/study-plans/1/curriculum/2")
                        .with(auth("admin@udistrital.edu.co", "ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(curriculumRequest())))
                .andExpect(status().isOk());
    }

    @Test
    void deleteCurriculumSubject_rolAdmin_retorna204() throws Exception {
        mockMvc.perform(delete("/api/v1/admin/study-plans/1/curriculum/2").with(auth("admin@udistrital.edu.co", "ADMINISTRADOR")))
                .andExpect(status().isNoContent());
    }

    private CurriculumSubjectRequest curriculumRequest() {
        return new CurriculumSubjectRequest("101", "Calculo", 3, 1);
    }
}
