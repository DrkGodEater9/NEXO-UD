package com.kumorai.nexo.user.service;

import com.kumorai.nexo.academic.entity.CurriculumSubject;
import com.kumorai.nexo.academic.entity.StudyPlan;
import com.kumorai.nexo.academic.repository.CurriculumSubjectRepository;
import com.kumorai.nexo.academic.repository.StudyPlanRepository;
import com.kumorai.nexo.shared.exception.NexoException;
import com.kumorai.nexo.user.dto.AcademicProgressResponse;
import com.kumorai.nexo.user.dto.SubjectProgressResponse;
import com.kumorai.nexo.user.dto.UpdateSubjectProgressRequest;
import com.kumorai.nexo.user.entity.SubjectStatus;
import com.kumorai.nexo.user.entity.User;
import com.kumorai.nexo.user.entity.UserAcademicProgress;
import com.kumorai.nexo.user.entity.UserSubjectProgress;
import com.kumorai.nexo.user.repository.UserAcademicProgressRepository;
import com.kumorai.nexo.user.repository.UserRepository;
import com.kumorai.nexo.user.repository.UserSubjectProgressRepository;
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
@DisplayName("StudyProgressServiceImpl - Pruebas Unitarias")
class StudyProgressServiceImplTest {

    @Mock private UserAcademicProgressRepository progressRepository;
    @Mock private UserSubjectProgressRepository  subjectProgressRepository;
    @Mock private UserRepository                  userRepository;
    @Mock private StudyPlanRepository             studyPlanRepository;
    @Mock private CurriculumSubjectRepository     curriculumSubjectRepository;

    @InjectMocks
    private StudyProgressServiceImpl studyProgressService;

    private User usuario;
    private StudyPlan plan;
    private CurriculumSubject materia;
    private UserAcademicProgress avance;
    private UserSubjectProgress subjectProgress;

    @BeforeEach
    void setUp() {
        usuario = User.builder().id(1L).email("est@nexo.edu").nickname("est01").passwordHash("x").build();

        plan = StudyPlan.builder()
                .id(5L).codigoPlan("2016202").nombre("Ing. de Sistemas").facultad("Ingeniería").build();

        materia = CurriculumSubject.builder()
                .id(20L).codigo("MAT101").nombre("Cálculo").credits(3).semester(1).studyPlan(plan).build();

        avance = UserAcademicProgress.builder()
                .id(100L).user(usuario).studyPlan(plan).build();

        subjectProgress = UserSubjectProgress.builder()
                .id(200L).academicProgress(avance).curriculumSubject(materia)
                .status(SubjectStatus.PENDIENTE).grade(null).build();
    }

    // ─── Helpers para mockear toProgressResponse ──────────────────────────────

    private void mockToProgressResponse(Long progressId, Long planId) {
        when(subjectProgressRepository.sumCreditsByProgressIdAndStatus(progressId, SubjectStatus.APROBADA))
                .thenReturn(0);
        when(subjectProgressRepository.sumCreditsByProgressIdAndStatus(progressId, SubjectStatus.CURSANDO))
                .thenReturn(0);
        when(curriculumSubjectRepository.sumCreditsByStudyPlanId(planId)).thenReturn(160);
        when(subjectProgressRepository.findByAcademicProgressId(progressId))
                .thenReturn(List.of(subjectProgress));
    }

    // ─── listByUser ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("listByUser()")
    class ListByUser {

        @Test
        @DisplayName("Debe retornar los avances académicos del usuario")
        void debeRetornarAvances_cuandoUsuarioTieneInscritos() {
            when(progressRepository.findByUserId(1L)).thenReturn(List.of(avance));
            mockToProgressResponse(100L, 5L);

            List<AcademicProgressResponse> result = studyProgressService.listByUser(1L);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).studyPlanId()).isEqualTo(5L);
            assertThat(result.get(0).studyPlanNombre()).isEqualTo("Ing. de Sistemas");
        }

        @Test
        @DisplayName("Debe retornar lista vacía cuando el usuario no tiene planes inscritos")
        void debeRetornarListaVacia_cuandoSinInscritos() {
            when(progressRepository.findByUserId(anyLong())).thenReturn(List.of());

            List<AcademicProgressResponse> result = studyProgressService.listByUser(99L);

            assertThat(result).isEmpty();
        }
    }

    // ─── enroll ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("enroll()")
    class Enroll {

        @Test
        @DisplayName("Debe inscribir al usuario en el plan y crear las entradas de progreso por materia")
        void debeInscribirUsuario_cuandoEsValido() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(usuario));
            when(studyPlanRepository.findById(5L)).thenReturn(Optional.of(plan));
            when(progressRepository.existsByUserIdAndStudyPlanId(1L, 5L)).thenReturn(false);
            when(progressRepository.save(any(UserAcademicProgress.class))).thenReturn(avance);
            when(curriculumSubjectRepository.findByStudyPlanId(5L)).thenReturn(List.of(materia));
            when(subjectProgressRepository.saveAll(anyList())).thenReturn(List.of(subjectProgress));
            when(progressRepository.findById(100L)).thenReturn(Optional.of(avance));
            mockToProgressResponse(100L, 5L);

            AcademicProgressResponse result = studyProgressService.enroll(1L, 5L);

            assertThat(result).isNotNull();
            assertThat(result.studyPlanId()).isEqualTo(5L);
            // Debe haber guardado un subjectProgress por cada materia del plan
            verify(subjectProgressRepository).saveAll(argThat(list ->
                    ((List<?>) list).size() == 1
            ));
        }

        @Test
        @DisplayName("Debe crear entradas PENDIENTE para todas las materias del plan")
        void debeCrearEntradasPendiente_paraCadaMateria() {
            CurriculumSubject m2 = CurriculumSubject.builder()
                    .id(21L).codigo("MAT102").nombre("Álgebra").credits(3).semester(1).studyPlan(plan).build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(usuario));
            when(studyPlanRepository.findById(5L)).thenReturn(Optional.of(plan));
            when(progressRepository.existsByUserIdAndStudyPlanId(1L, 5L)).thenReturn(false);
            when(progressRepository.save(any())).thenReturn(avance);
            when(curriculumSubjectRepository.findByStudyPlanId(5L)).thenReturn(List.of(materia, m2));
            when(subjectProgressRepository.saveAll(anyList())).thenReturn(List.of());
            when(progressRepository.findById(100L)).thenReturn(Optional.of(avance));
            mockToProgressResponse(100L, 5L);

            studyProgressService.enroll(1L, 5L);

            verify(subjectProgressRepository).saveAll(argThat(list -> {
                List<UserSubjectProgress> progresses = (List<UserSubjectProgress>) list;
                return progresses.size() == 2 &&
                       progresses.stream().allMatch(sp -> sp.getStatus() == SubjectStatus.PENDIENTE);
            }));
        }

        @Test
        @DisplayName("Debe lanzar NexoException 404 cuando el usuario no existe")
        void debeLanzarExcepcion_cuandoUsuarioNoExiste() {
            when(userRepository.findById(anyLong())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> studyProgressService.enroll(99L, 5L))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
        }

        @Test
        @DisplayName("Debe lanzar NexoException 404 cuando el plan no existe")
        void debeLanzarExcepcion_cuandoPlanNoExiste() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(usuario));
            when(studyPlanRepository.findById(anyLong())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> studyProgressService.enroll(1L, 99L))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
        }

        @Test
        @DisplayName("Debe lanzar NexoException 409 cuando el usuario ya está inscrito en el plan")
        void debeLanzarExcepcion_cuandoYaInscrito() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(usuario));
            when(studyPlanRepository.findById(5L)).thenReturn(Optional.of(plan));
            when(progressRepository.existsByUserIdAndStudyPlanId(1L, 5L)).thenReturn(true);

            assertThatThrownBy(() -> studyProgressService.enroll(1L, 5L))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.CONFLICT));

            verify(progressRepository, never()).save(any());
        }
    }

    // ─── getProgress ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getProgress()")
    class GetProgress {

        @Test
        @DisplayName("Debe retornar el avance cuando pertenece al usuario")
        void debeRetornarAvance_cuandoPerteneceAlUsuario() {
            when(progressRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(avance));
            mockToProgressResponse(100L, 5L);

            AcademicProgressResponse result = studyProgressService.getProgress(100L, 1L);

            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(100L);
            assertThat(result.totalCredits()).isEqualTo(160);
        }

        @Test
        @DisplayName("Debe lanzar NexoException 404 cuando el avance no existe o no pertenece al usuario")
        void debeLanzarExcepcion_cuandoAvanceNoEncontrado() {
            when(progressRepository.findByIdAndUserId(anyLong(), anyLong())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> studyProgressService.getProgress(99L, 1L))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
        }
    }

    // ─── updateSubjectStatus ──────────────────────────────────────────────────

    @Nested
    @DisplayName("updateSubjectStatus()")
    class UpdateSubjectStatus {

        @Test
        @DisplayName("Debe actualizar el estado y la nota de la materia")
        void debeActualizarEstadoYNota() {
            UpdateSubjectProgressRequest updateReq = new UpdateSubjectProgressRequest(SubjectStatus.APROBADA, 4.5);
            when(progressRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(avance));
            when(subjectProgressRepository.findByIdAndAcademicProgressId(200L, 100L))
                    .thenReturn(Optional.of(subjectProgress));
            when(subjectProgressRepository.save(any(UserSubjectProgress.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            SubjectProgressResponse result = studyProgressService.updateSubjectStatus(100L, 200L, 1L, updateReq);

            assertThat(result.status()).isEqualTo("APROBADA");
            assertThat(result.grade()).isEqualTo(4.5);
        }

        @Test
        @DisplayName("Debe lanzar NexoException 404 cuando el avance no pertenece al usuario")
        void debeLanzarExcepcion_cuandoAvanceNoPertenece() {
            when(progressRepository.findByIdAndUserId(anyLong(), anyLong())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> studyProgressService.updateSubjectStatus(
                    99L, 200L, 1L, new UpdateSubjectProgressRequest(SubjectStatus.CURSANDO, null)))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
        }

        @Test
        @DisplayName("Debe lanzar NexoException 404 cuando el subjectProgress no pertenece al avance")
        void debeLanzarExcepcion_cuandoSubjectProgressNoExiste() {
            when(progressRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(avance));
            when(subjectProgressRepository.findByIdAndAcademicProgressId(anyLong(), anyLong()))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> studyProgressService.updateSubjectStatus(
                    100L, 999L, 1L, new UpdateSubjectProgressRequest(SubjectStatus.CURSANDO, null)))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
        }
    }

    // ─── unenroll ─────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("unenroll()")
    class Unenroll {

        @Test
        @DisplayName("Debe desinscribir al usuario cuando el avance le pertenece")
        void debeDesinscribir_cuandoPerteneceAlUsuario() {
            when(progressRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(avance));

            studyProgressService.unenroll(100L, 1L);

            verify(progressRepository, times(1)).delete(avance);
        }

        @Test
        @DisplayName("Debe lanzar NexoException 404 cuando el avance no pertenece al usuario")
        void debeLanzarExcepcion_cuandoAvanceNoPertenece() {
            when(progressRepository.findByIdAndUserId(anyLong(), anyLong())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> studyProgressService.unenroll(99L, 1L))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));

            verify(progressRepository, never()).delete(any());
        }
    }
}
