package com.kumorai.nexo.schedule.controller;

import com.kumorai.nexo.schedule.service.ScheduleExportService;
import com.kumorai.nexo.shared.config.JwtAuthFilter;
import com.kumorai.nexo.shared.config.SecurityConfig;
import com.kumorai.nexo.shared.config.TestSecurityConfig;
import com.kumorai.nexo.user.service.UserService;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static com.kumorai.nexo.shared.TestData.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
        controllers = ScheduleExportController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {SecurityConfig.class, JwtAuthFilter.class})
)
@Import(TestSecurityConfig.class)
@DisplayName("ScheduleExportController - Tests")
class ScheduleExportControllerTest {

    @Autowired MockMvc mockMvc;
    @MockBean ScheduleExportService scheduleExportService;
    @MockBean UserService userService;

    @Test
    void exportPdf_rolEstudiante_retornaPdf() throws Exception {
        mockUser();
        when(scheduleExportService.generatePdf(1L, 1L)).thenReturn(new byte[]{1, 2, 3});

        mockMvc.perform(get("/api/v1/schedules/1/export/pdf").with(auth("test@udistrital.edu.co", "ESTUDIANTE")))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, Matchers.containsString("attachment")));
    }

    @Test
    void exportImage_rolEstudiante_retornaPng() throws Exception {
        mockUser();
        when(scheduleExportService.generateImage(1L, 1L)).thenReturn(new byte[]{1, 2, 3});

        mockMvc.perform(get("/api/v1/schedules/1/export/image").with(auth("test@udistrital.edu.co", "ESTUDIANTE")))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, Matchers.containsString("attachment")));
    }

    @Test
    void exportPdf_sinRol_retorna403() throws Exception {
        mockMvc.perform(get("/api/v1/schedules/1/export/pdf").with(auth("admin@udistrital.edu.co", "ADMINISTRADOR")))
                .andExpect(status().isForbidden());
    }

    private void mockUser() {
        when(userService.getMyProfile("test@udistrital.edu.co")).thenReturn(userProfile());
    }
}
