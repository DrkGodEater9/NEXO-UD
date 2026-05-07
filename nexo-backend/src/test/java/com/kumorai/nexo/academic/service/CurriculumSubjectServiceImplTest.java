package com.kumorai.nexo.academic.service;

import com.kumorai.nexo.academic.dto.CurriculumSubjectRequest;
import com.kumorai.nexo.academic.dto.CurriculumSubjectResponse;
import com.kumorai.nexo.academic.entity.CurriculumSubject;
import com.kumorai.nexo.academic.entity.StudyPlan;
import com.kumorai.nexo.academic.repository.CurriculumSubjectRepository;
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
@DisplayName("CurriculumSubjectServiceImpl - Pruebas Unitarias")
class CurriculumSubjectServiceImplTest {

    @Mock
    private CurriculumSubjectRepository curriculumSubjectRepository;

    @Mock
    private StudyPlanRepository studyPlanRepository;

    @InjectMocks
    private CurriculumSubjectServiceImpl curriculumSubjectService;

    private StudyPlan plan;
    private CurriculumSubject materia;
    private CurriculumSubjectRequest request;

    @BeforeEach
    void setUp() {
        plan = StudyPlan.builder()
                .id(1L)
                .codigoPlan("2016202")
                .nombre("Ingeniería de Sistemas")
                .facultad("Ingeniería")
                .build();

        materia = CurriculumSubject.builder()
                .id(10L)
                .codigo("MAT101")
                .nombre("Cálculo Diferencial")
                .credits(3)
                .semester(1)
                .studyPlan(plan)
                .build();

        request = new CurriculumSubjectRequest("MAT102", "Cálculo Integral", 3, 2);
    }

    // ─── listByStudyPlan ──────────────────────────────────────────────────────

    @Nested
    @DisplayName("listByStudyPlan()")
    class ListByStudyPlan {

        @Test
        @DisplayName("Debe retornar las materias del plan cuando el plan existe")
        void debeRetornarMaterias_cuandoPlanExiste() {
            when(studyPlanRepository.findById(1L)).thenReturn(Optional.of(plan));
            when(curriculumSubjectRepository.findByStudyPlanId(1L)).thenReturn(List.of(materia));

            List<CurriculumSubjectResponse> result = curriculumSubjectService.listByStudyPlan(1L);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).codigo()).isEqualTo("MAT101");
            assertThat(result.get(0).credits()).isEqualTo(3);
        }

        @Test
        @DisplayName("Debe lanzar NexoException 404 cuando el plan no existe")
        void debeLanzarExcepcion_cuandoPlanNoExiste() {
            when(studyPlanRepository.findById(anyLong())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> curriculumSubjectService.listByStudyPlan(99L))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
        }

        @Test
        @DisplayName("Debe retornar lista vacía cuando el plan existe pero no tiene materias")
        void debeRetornarListaVacia_cuandoNoHayMaterias() {
            when(studyPlanRepository.findById(1L)).thenReturn(Optional.of(plan));
            when(curriculumSubjectRepository.findByStudyPlanId(1L)).thenReturn(List.of());

            List<CurriculumSubjectResponse> result = curriculumSubjectService.listByStudyPlan(1L);

            assertThat(result).isEmpty();
        }
    }

    // ─── getById ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getById()")
    class GetById {

        @Test
        @DisplayName("Debe retornar la materia cuando pertenece al plan indicado")
        void debeRetornarMateria_cuandoPerteneceAlPlan() {
            when(curriculumSubjectRepository.findByIdAndStudyPlanId(10L, 1L)).thenReturn(Optional.of(materia));

            CurriculumSubjectResponse result = curriculumSubjectService.getById(1L, 10L);

            assertThat(result.id()).isEqualTo(10L);
            assertThat(result.codigo()).isEqualTo("MAT101");
            assertThat(result.studyPlanId()).isEqualTo(1L);
        }

        @Test
        @DisplayName("Debe lanzar NexoException 404 cuando la materia no existe o no pertenece al plan")
        void debeLanzarExcepcion_cuandoMateriaNoExisteEnPlan() {
            when(curriculumSubjectRepository.findByIdAndStudyPlanId(anyLong(), anyLong()))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> curriculumSubjectService.getById(1L, 99L))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND))
                    .hasMessageContaining("Materia no encontrada en este plan de estudios");
        }
    }

    // ─── create ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("create()")
    class Create {

        @Test
        @DisplayName("Debe crear la materia cuando el código no existe en el plan")
        void debeCrearMateria_cuandoCodigoNoExiste() {
            when(studyPlanRepository.findById(1L)).thenReturn(Optional.of(plan));
            when(curriculumSubjectRepository.existsByCodigoAndStudyPlanId("MAT102", 1L)).thenReturn(false);
            when(curriculumSubjectRepository.save(any(CurriculumSubject.class))).thenAnswer(inv -> {
                CurriculumSubject cs = inv.getArgument(0);
                cs = CurriculumSubject.builder()
                        .id(11L).codigo(cs.getCodigo()).nombre(cs.getNombre())
                        .credits(cs.getCredits()).semester(cs.getSemester()).studyPlan(plan).build();
                return cs;
            });

            CurriculumSubjectResponse result = curriculumSubjectService.create(1L, request);

            assertThat(result.codigo()).isEqualTo("MAT102");
            assertThat(result.nombre()).isEqualTo("Cálculo Integral");
            assertThat(result.credits()).isEqualTo(3);
            assertThat(result.semester()).isEqualTo(2);
        }

        @Test
        @DisplayName("Debe lanzar NexoException 404 cuando el plan no existe")
        void debeLanzarExcepcion_cuandoPlanNoExiste() {
            when(studyPlanRepository.findById(anyLong())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> curriculumSubjectService.create(99L, request))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));

            verify(curriculumSubjectRepository, never()).save(any());
        }

        @Test
        @DisplayName("Debe lanzar NexoException 409 cuando ya existe una materia con ese código en el plan")
        void debeLanzarExcepcion_cuandoCodigoDuplicado() {
            when(studyPlanRepository.findById(1L)).thenReturn(Optional.of(plan));
            when(curriculumSubjectRepository.existsByCodigoAndStudyPlanId("MAT102", 1L)).thenReturn(true);

            assertThatThrownBy(() -> curriculumSubjectService.create(1L, request))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.CONFLICT));

            verify(curriculumSubjectRepository, never()).save(any());
        }
    }

    // ─── update ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("update()")
    class Update {

        @Test
        @DisplayName("Debe actualizar la materia cuando los datos son válidos")
        void debeActualizarMateria_cuandoEsValido() {
            when(curriculumSubjectRepository.findByIdAndStudyPlanId(10L, 1L)).thenReturn(Optional.of(materia));
            when(curriculumSubjectRepository.save(any(CurriculumSubject.class))).thenAnswer(inv -> inv.getArgument(0));

            CurriculumSubjectResponse result = curriculumSubjectService.update(1L, 10L, request);

            assertThat(result.codigo()).isEqualTo("MAT102");
            assertThat(result.nombre()).isEqualTo("Cálculo Integral");
        }

        @Test
        @DisplayName("Debe permitir actualizar manteniendo el mismo código")
        void debePermitirActualizar_manteniendomismoCodigo() {
            CurriculumSubjectRequest mismoCodigo = new CurriculumSubjectRequest("MAT101", "Nuevo nombre", 4, 1);
            when(curriculumSubjectRepository.findByIdAndStudyPlanId(10L, 1L)).thenReturn(Optional.of(materia));
            when(curriculumSubjectRepository.save(any(CurriculumSubject.class))).thenAnswer(inv -> inv.getArgument(0));

            CurriculumSubjectResponse result = curriculumSubjectService.update(1L, 10L, mismoCodigo);

            assertThat(result.codigo()).isEqualTo("MAT101");
            verify(curriculumSubjectRepository, never()).existsByCodigoAndStudyPlanId(anyString(), anyLong());
        }

        @Test
        @DisplayName("Debe lanzar NexoException 409 cuando el nuevo código ya está en uso en el plan")
        void debeLanzarExcepcion_cuandoNuevoCodigoEnUso() {
            when(curriculumSubjectRepository.findByIdAndStudyPlanId(10L, 1L)).thenReturn(Optional.of(materia));
            when(curriculumSubjectRepository.existsByCodigoAndStudyPlanId("MAT102", 1L)).thenReturn(true);

            assertThatThrownBy(() -> curriculumSubjectService.update(1L, 10L, request))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.CONFLICT));

            verify(curriculumSubjectRepository, never()).save(any());
        }

        @Test
        @DisplayName("Debe lanzar NexoException 404 cuando la materia no existe en el plan")
        void debeLanzarExcepcion_cuandoMateriaNoExiste() {
            when(curriculumSubjectRepository.findByIdAndStudyPlanId(anyLong(), anyLong()))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> curriculumSubjectService.update(1L, 99L, request))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
        }
    }

    // ─── delete ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("delete()")
    class Delete {

        @Test
        @DisplayName("Debe eliminar la materia cuando pertenece al plan")
        void debeEliminarMateria_cuandoPerteneceAlPlan() {
            when(curriculumSubjectRepository.findByIdAndStudyPlanId(10L, 1L)).thenReturn(Optional.of(materia));

            curriculumSubjectService.delete(1L, 10L);

            verify(curriculumSubjectRepository, times(1)).delete(materia);
        }

        @Test
        @DisplayName("Debe lanzar NexoException 404 cuando la materia no existe")
        void debeLanzarExcepcion_cuandoMateriaNoExiste() {
            when(curriculumSubjectRepository.findByIdAndStudyPlanId(anyLong(), anyLong()))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> curriculumSubjectService.delete(1L, 99L))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));

            verify(curriculumSubjectRepository, never()).delete(any());
        }
    }

    // ─── getTotalCredits ──────────────────────────────────────────────────────

    @Nested
    @DisplayName("getTotalCredits()")
    class GetTotalCredits {

        @Test
        @DisplayName("Debe retornar la suma de créditos cuando el plan existe")
        void debeRetornarSumaCreditos_cuandoPlanExiste() {
            when(studyPlanRepository.findById(1L)).thenReturn(Optional.of(plan));
            when(curriculumSubjectRepository.sumCreditsByStudyPlanId(1L)).thenReturn(160);

            int result = curriculumSubjectService.getTotalCredits(1L);

            assertThat(result).isEqualTo(160);
        }

        @Test
        @DisplayName("Debe retornar 0 cuando el plan no tiene materias")
        void debeRetornarCero_cuandoSinMaterias() {
            when(studyPlanRepository.findById(1L)).thenReturn(Optional.of(plan));
            when(curriculumSubjectRepository.sumCreditsByStudyPlanId(1L)).thenReturn(0);

            int result = curriculumSubjectService.getTotalCredits(1L);

            assertThat(result).isZero();
        }

        @Test
        @DisplayName("Debe lanzar NexoException 404 cuando el plan no existe")
        void debeLanzarExcepcion_cuandoPlanNoExiste() {
            when(studyPlanRepository.findById(anyLong())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> curriculumSubjectService.getTotalCredits(99L))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
        }
    }
}
