package com.kumorai.nexo.academic.controller;

import com.kumorai.nexo.academic.service.AcademicOfferService;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static com.kumorai.nexo.shared.TestData.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = AcademicOfferController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {SecurityConfig.class, JwtAuthFilter.class})
)
@Import(TestSecurityConfig.class)
@DisplayName("AcademicOfferController - Tests")
class AcademicOfferControllerTest {

    @Autowired MockMvc mockMvc;
    @MockBean AcademicOfferService academicOfferService;
    @MockBean UserService userService;

    @Test
    void listAll_rolAdmin_retorna200() throws Exception {
        when(academicOfferService.listAll()).thenReturn(List.of(academicOffer()));

        mockMvc.perform(get("/api/v1/admin/academic-offers").with(auth("admin@udistrital.edu.co", "ADMINISTRADOR")))
                .andExpect(status().isOk());
    }

    @Test
    void getActive_existe_retorna200() throws Exception {
        when(academicOfferService.getActive()).thenReturn(academicOffer());

        mockMvc.perform(get("/api/v1/admin/academic-offers/active").with(auth("admin@udistrital.edu.co", "ADMINISTRADOR")))
                .andExpect(status().isOk());
    }

    @Test
    void getActive_noExiste_retorna404() throws Exception {
        when(academicOfferService.getActive()).thenThrow(NexoException.notFound("No hay oferta activa"));

        mockMvc.perform(get("/api/v1/admin/academic-offers/active").with(auth("admin@udistrital.edu.co", "ADMINISTRADOR")))
                .andExpect(status().isNotFound());
    }

    @Test
    void upload_archivoValido_retorna200() throws Exception {
        when(userService.getMyProfile("admin@udistrital.edu.co")).thenReturn(userProfile());
        when(academicOfferService.upload(any(), eq("2025-1"), eq(1L))).thenReturn(academicOfferUpload());
        MockMultipartFile file = new MockMultipartFile("file", "oferta.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", new byte[]{1, 2, 3});

        mockMvc.perform(multipart("/api/v1/admin/academic-offers/upload")
                        .file(file)
                        .param("semester", "2025-1")
                        .with(auth("admin@udistrital.edu.co", "ADMINISTRADOR")))
                .andExpect(status().isOk());
    }

    @Test
    void upload_sinArchivo_retorna400() throws Exception {
        mockMvc.perform(multipart("/api/v1/admin/academic-offers/upload")
                        .param("semester", "2025-1")
                        .with(auth("admin@udistrital.edu.co", "ADMINISTRADOR")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void activate_rolAdmin_retorna200() throws Exception {
        when(academicOfferService.activate(1L)).thenReturn(academicOffer());

        mockMvc.perform(patch("/api/v1/admin/academic-offers/1/activate").with(auth("admin@udistrital.edu.co", "ADMINISTRADOR")))
                .andExpect(status().isOk());
    }

    @Test
    void delete_rolAdmin_retorna204() throws Exception {
        mockMvc.perform(delete("/api/v1/admin/academic-offers/1").with(auth("admin@udistrital.edu.co", "ADMINISTRADOR")))
                .andExpect(status().isNoContent());
    }
}
