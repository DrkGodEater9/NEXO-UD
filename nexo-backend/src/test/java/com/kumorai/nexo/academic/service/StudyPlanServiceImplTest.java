package com.kumorai.nexo.academic.service;

import com.kumorai.nexo.academic.dto.StudyPlanResponse;
import com.kumorai.nexo.academic.entity.StudyPlan;
import com.kumorai.nexo.academic.repository.StudyPlanRepository;
import com.kumorai.nexo.shared.exception.NexoException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("StudyPlanServiceImpl - Pruebas Unitarias")
class StudyPlanServiceImplTest {

    @Mock
    private StudyPlanRepository studyPlanRepository;

    @InjectMocks
    private StudyPlanServiceImpl studyPlanService;

    private StudyPlan planIngenieria;
    private StudyPlan planSistemas;

    @BeforeEach
    void setUp() {
        planIngenieria = StudyPlan.builder()
                .id(1L)
                .codigoPlan("2016101")
                .nombre("Ingeniería Civil")
                .facultad("Facultad de Ingeniería")
                .build();

        planSistemas = StudyPlan.builder()
                .id(2L)
                .codigoPlan("2016202")
                .nombre("Ingeniería de Sistemas")
                .facultad("Facultad de Ingeniería")
                .build();
    }

    // ─── listAll ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("listAll()")
    class ListAll {

        @Test
        @DisplayName("Debe retornar todos los planes de estudio ordenados")
        void debeRetornarTodosLosPlanes() {
            when(studyPlanRepository.findAllOrderedByFacultyAndName())
                    .thenReturn(List.of(planIngenieria, planSistemas));

            List<StudyPlanResponse> result = studyPlanService.listAll();

            assertThat(result).hasSize(2);
            assertThat(result).extracting(StudyPlanResponse::codigoPlan)
                    .containsExactly("2016101", "2016202");
        }

        @Test
        @DisplayName("Debe retornar lista vacía cuando no hay planes")
        void debeRetornarListaVacia_cuandoNoHayPlanes() {
            when(studyPlanRepository.findAllOrderedByFacultyAndName()).thenReturn(List.of());

            List<StudyPlanResponse> result = studyPlanService.listAll();

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Debe mapear correctamente los campos del plan al DTO")
        void debeMappearCamposCorrectamente() {
            when(studyPlanRepository.findAllOrderedByFacultyAndName()).thenReturn(List.of(planIngenieria));

            List<StudyPlanResponse> result = studyPlanService.listAll();

            StudyPlanResponse response = result.get(0);
            assertThat(response.id()).isEqualTo(1L);
            assertThat(response.codigoPlan()).isEqualTo("2016101");
            assertThat(response.nombre()).isEqualTo("Ingeniería Civil");
            assertThat(response.facultad()).isEqualTo("Facultad de Ingeniería");
        }
    }

    // ─── getById ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getById()")
    class GetById {

        @Test
        @DisplayName("Debe retornar el plan cuando el ID existe")
        void debeRetornarPlan_cuandoIdExiste() {
            when(studyPlanRepository.findById(1L)).thenReturn(Optional.of(planIngenieria));

            StudyPlanResponse result = studyPlanService.getById(1L);

            assertThat(result.id()).isEqualTo(1L);
            assertThat(result.nombre()).isEqualTo("Ingeniería Civil");
        }

        @Test
        @DisplayName("Debe lanzar NexoException 404 cuando el ID no existe")
        void debeLanzarExcepcion_cuandoIdNoExiste() {
            when(studyPlanRepository.findById(anyLong())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> studyPlanService.getById(99L))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND))
                    .hasMessageContaining("Plan de estudios no encontrado");
        }
    }

    // ─── getByCodigoPlan ──────────────────────────────────────────────────────

    @Nested
    @DisplayName("getByCodigoPlan()")
    class GetByCodigoPlan {

        @Test
        @DisplayName("Debe retornar el plan cuando el código existe")
        void debeRetornarPlan_cuandoCodigoExiste() {
            when(studyPlanRepository.findByCodigoPlan("2016202")).thenReturn(Optional.of(planSistemas));

            StudyPlanResponse result = studyPlanService.getByCodigoPlan("2016202");

            assertThat(result.codigoPlan()).isEqualTo("2016202");
            assertThat(result.nombre()).isEqualTo("Ingeniería de Sistemas");
        }

        @Test
        @DisplayName("Debe lanzar NexoException 404 cuando el código no existe")
        void debeLanzarExcepcion_cuandoCodigoNoExiste() {
            when(studyPlanRepository.findByCodigoPlan(anyString())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> studyPlanService.getByCodigoPlan("999999"))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND))
                    .hasMessageContaining("Plan de estudios no encontrado");
        }
    }
}
