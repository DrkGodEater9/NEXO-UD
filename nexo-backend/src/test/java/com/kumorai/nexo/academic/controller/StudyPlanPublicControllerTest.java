package com.kumorai.nexo.academic.controller;

import com.kumorai.nexo.academic.entity.StudyPlan;
import com.kumorai.nexo.academic.repository.StudyPlanRepository;
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
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = StudyPlanPublicController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {SecurityConfig.class, JwtAuthFilter.class})
)
@Import(TestSecurityConfig.class)
@DisplayName("StudyPlanPublicController - Tests")
class StudyPlanPublicControllerTest {

    @Autowired MockMvc mockMvc;
    @MockBean StudyPlanRepository studyPlanRepository;

    @Test
    void listAll_listaVacia_retorna200() throws Exception {
        when(studyPlanRepository.findAllOrderedByFacultyAndName()).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/study-plans"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    @Test
    void listAll_listaConPlanes_retorna200() throws Exception {
        StudyPlan plan = StudyPlan.builder()
                .id(1L)
                .codigoPlan("375")
                .nombre("Ingenieria de Sistemas")
                .facultad("INGENIERIA")
                .build();
        when(studyPlanRepository.findAllOrderedByFacultyAndName()).thenReturn(List.of(plan));

        mockMvc.perform(get("/api/v1/study-plans"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombre").value("Ingenieria de Sistemas"));
    }
}
