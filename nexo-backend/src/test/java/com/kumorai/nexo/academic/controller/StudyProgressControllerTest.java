package com.kumorai.nexo.academic.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kumorai.nexo.shared.config.JwtAuthFilter;
import com.kumorai.nexo.shared.config.SecurityConfig;
import com.kumorai.nexo.shared.config.TestSecurityConfig;
import com.kumorai.nexo.user.dto.UpdateSubjectProgressRequest;
import com.kumorai.nexo.user.entity.SubjectStatus;
import com.kumorai.nexo.user.service.StudyProgressService;
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
import java.util.Map;

import static com.kumorai.nexo.shared.TestData.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = StudyProgressController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {SecurityConfig.class, JwtAuthFilter.class})
)
@Import(TestSecurityConfig.class)
@DisplayName("StudyProgressController - Tests")
class StudyProgressControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean StudyProgressService studyProgressService;
    @MockBean UserService userService;

    @Test
    void listProgress_rolEstudiante_retorna200() throws Exception {
        mockUser();
        when(studyProgressService.listByUser(1L)).thenReturn(List.of(progress()));

        mockMvc.perform(get("/api/v1/progress").with(auth("test@udistrital.edu.co", "ESTUDIANTE")))
                .andExpect(status().isOk());
    }

    @Test
    void listProgress_sinRol_retorna403() throws Exception {
        mockMvc.perform(get("/api/v1/progress").with(auth("admin@udistrital.edu.co", "ADMINISTRADOR")))
                .andExpect(status().isForbidden());
    }

    @Test
    void enroll_bodyConStudyPlanId_retorna200() throws Exception {
        mockUser();
        when(studyProgressService.enroll(1L, 10L)).thenReturn(progress());

        mockMvc.perform(post("/api/v1/progress")
                        .with(auth("test@udistrital.edu.co", "ESTUDIANTE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("studyPlanId", 10L))))
                .andExpect(status().isOk());
    }

    @Test
    void unenroll_rolEstudiante_retorna204() throws Exception {
        mockUser();

        mockMvc.perform(delete("/api/v1/progress/1").with(auth("test@udistrital.edu.co", "ESTUDIANTE")))
                .andExpect(status().isNoContent());
    }

    @Test
    void getSubjects_rolEstudiante_retorna200() throws Exception {
        mockUser();
        when(studyProgressService.getProgress(1L, 1L)).thenReturn(progress());

        mockMvc.perform(get("/api/v1/progress/1/subjects").with(auth("test@udistrital.edu.co", "ESTUDIANTE")))
                .andExpect(status().isOk());
    }

    @Test
    void updateSubjectStatus_rolEstudiante_retorna200() throws Exception {
        mockUser();
        when(studyProgressService.updateSubjectStatus(eq(1L), eq(2L), eq(1L), any())).thenReturn(subjectProgress());

        mockMvc.perform(patch("/api/v1/progress/1/subjects/2")
                        .with(auth("test@udistrital.edu.co", "ESTUDIANTE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateSubjectProgressRequest(SubjectStatus.CURSANDO, 4.0))))
                .andExpect(status().isOk());
    }

    @Test
    void getSummary_rolEstudiante_retorna200() throws Exception {
        mockUser();
        when(studyProgressService.getProgress(1L, 1L)).thenReturn(progress());

        mockMvc.perform(get("/api/v1/progress/1/summary").with(auth("test@udistrital.edu.co", "ESTUDIANTE")))
                .andExpect(status().isOk());
    }

    private void mockUser() {
        when(userService.getMyProfile("test@udistrital.edu.co")).thenReturn(userProfile());
    }
}
