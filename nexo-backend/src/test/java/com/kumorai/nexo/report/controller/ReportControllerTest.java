package com.kumorai.nexo.report.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kumorai.nexo.report.dto.ReportRequest;
import com.kumorai.nexo.report.dto.UpdateReportStatusRequest;
import com.kumorai.nexo.report.entity.ReportStatus;
import com.kumorai.nexo.report.entity.ReportType;
import com.kumorai.nexo.report.service.ReportService;
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
        controllers = ReportController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {SecurityConfig.class, JwtAuthFilter.class})
)
@Import(TestSecurityConfig.class)
@DisplayName("ReportController - Tests")
class ReportControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean ReportService reportService;
    @MockBean UserService userService;

    @Test
    void create_rolEstudiante_retorna200() throws Exception {
        mockUser();
        when(reportService.create(any(), eq(1L))).thenReturn(report());

        mockMvc.perform(post("/api/v1/reports")
                        .with(auth("test@udistrital.edu.co", "ESTUDIANTE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ReportRequest(ReportType.OTRO, "Descripcion", null))))
                .andExpect(status().isOk());
    }

    @Test
    void create_sinRolEstudiante_retorna403() throws Exception {
        mockMvc.perform(post("/api/v1/reports")
                        .with(auth("admin@udistrital.edu.co", "ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ReportRequest(ReportType.OTRO, "Descripcion", null))))
                .andExpect(status().isForbidden());
    }

    @Test
    void create_bodyInvalido_retorna400() throws Exception {
        mockMvc.perform(post("/api/v1/reports")
                        .with(auth("test@udistrital.edu.co", "ESTUDIANTE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listMyReports_rolEstudiante_retorna200() throws Exception {
        mockUser();
        when(reportService.listByUser(1L)).thenReturn(List.of(report()));

        mockMvc.perform(get("/api/v1/reports/my").with(auth("test@udistrital.edu.co", "ESTUDIANTE")))
                .andExpect(status().isOk());
    }

    @Test
    void listAll_rolAdmin_retorna200() throws Exception {
        when(reportService.listAll(null, null)).thenReturn(List.of(report()));

        mockMvc.perform(get("/api/v1/reports").with(auth("admin@udistrital.edu.co", "ADMINISTRADOR")))
                .andExpect(status().isOk());
    }

    @Test
    void listAll_sinRolAdmin_retorna403() throws Exception {
        mockMvc.perform(get("/api/v1/reports").with(auth("test@udistrital.edu.co", "ESTUDIANTE")))
                .andExpect(status().isForbidden());
    }

    @Test
    void listAll_conFiltros_retorna200() throws Exception {
        when(reportService.listAll(ReportStatus.PENDIENTE, ReportType.OTRO)).thenReturn(List.of(report()));

        mockMvc.perform(get("/api/v1/reports")
                        .param("status", "PENDIENTE")
                        .param("reportType", "OTRO")
                        .with(auth("admin@udistrital.edu.co", "ADMINISTRADOR")))
                .andExpect(status().isOk());
    }

    @Test
    void getById_rolAdmin_retorna200() throws Exception {
        when(reportService.getByIdAdmin(1L)).thenReturn(report());

        mockMvc.perform(get("/api/v1/reports/1").with(auth("admin@udistrital.edu.co", "ADMINISTRADOR")))
                .andExpect(status().isOk());
    }

    @Test
    void updateStatus_rolAdmin_retorna200() throws Exception {
        when(reportService.updateStatus(eq(1L), any())).thenReturn(report());

        mockMvc.perform(patch("/api/v1/reports/1/status")
                        .with(auth("admin@udistrital.edu.co", "ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateReportStatusRequest(ReportStatus.RESUELTO))))
                .andExpect(status().isOk());
    }

    @Test
    void updateStatus_bodyVacio_retorna400() throws Exception {
        mockMvc.perform(patch("/api/v1/reports/1/status")
                        .with(auth("admin@udistrital.edu.co", "ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    private void mockUser() {
        when(userService.getMyProfile("test@udistrital.edu.co")).thenReturn(userProfile());
    }
}
