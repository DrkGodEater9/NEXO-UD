package com.kumorai.nexo.campus.controller;

import com.kumorai.nexo.shared.config.BaseIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("Pruebas de Integración - Campus")
public class CampusIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Debería retornar lista vacía o llena de campus con status 200")
    void testGetAllCampus() throws Exception {
        // En un test de integración real, los datos iniciales vienen de Flyway
        // (V1__init.sql)
        mockMvc.perform(get("/api/v1/campus")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("No debería permitir crear un campus sin permisos")
    void testCreateCampusWithoutAuth() throws Exception {
        mockMvc.perform(post("/api/v1/campus")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": \"Sede Test\"}"))
                .andExpect(status().isForbidden());
    }
}
