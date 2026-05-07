package com.kumorai.nexo.schedule.service;

import com.kumorai.nexo.academic.entity.DayOfWeek;
import com.kumorai.nexo.academic.entity.TimeBlock;
import com.kumorai.nexo.academic.repository.SubjectGroupRepository;
import com.kumorai.nexo.schedule.dto.ScheduleBlockRequest;
import com.kumorai.nexo.schedule.dto.ScheduleRequest;
import com.kumorai.nexo.schedule.dto.ScheduleResponse;
import com.kumorai.nexo.schedule.entity.Schedule;
import com.kumorai.nexo.schedule.repository.ScheduleBlockRepository;
import com.kumorai.nexo.schedule.repository.ScheduleRepository;
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
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleServiceImpl - Pruebas Unitarias")
class ScheduleServiceImplTest {

    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private ScheduleBlockRepository scheduleBlockRepository;
    @Mock
    private SubjectGroupRepository subjectGroupRepository;

    @InjectMocks
    private ScheduleServiceImpl scheduleService;

    private Schedule schedule;

    @BeforeEach
    void setUp() {
        schedule = Schedule.builder()
                .id(1L)
                .userId(10L)
                .name("Horario 2025-1")
                .semester("2025-1")
                .notes("Notas de prueba")
                .build();
    }

    // ─── listByUser ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("listByUser()")
    class ListByUser {

        @Test
        @DisplayName("Debe retornar todos los horarios del usuario ordenados")
        void debeRetornarHorarios_cuandoUsuarioTieneHorarios() {
            when(scheduleRepository.findByUserIdOrderByCreatedAtDesc(10L)).thenReturn(List.of(schedule));

            List<ScheduleResponse> result = scheduleService.listByUser(10L);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).name()).isEqualTo("Horario 2025-1");
            assertThat(result.get(0).userId()).isEqualTo(10L);
        }

        @Test
        @DisplayName("Debe retornar lista vacía cuando el usuario no tiene horarios")
        void debeRetornarListaVacia_cuandoNoHayHorarios() {
            when(scheduleRepository.findByUserIdOrderByCreatedAtDesc(anyLong())).thenReturn(List.of());

            List<ScheduleResponse> result = scheduleService.listByUser(99L);

            assertThat(result).isEmpty();
        }
    }

    // ─── getById ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getById()")
    class GetById {

        @Test
        @DisplayName("Debe retornar el horario cuando pertenece al usuario")
        void debeRetornarHorario_cuandoPerteneceAlUsuario() {
            when(scheduleRepository.findByIdAndUserId(1L, 10L)).thenReturn(Optional.of(schedule));

            ScheduleResponse result = scheduleService.getById(1L, 10L);

            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(1L);
            assertThat(result.semester()).isEqualTo("2025-1");
        }

        @Test
        @DisplayName("Debe lanzar NexoException 404 cuando el horario no existe o no pertenece al usuario")
        void debeLanzarExcepcion_cuandoHorarioNoEncontrado() {
            when(scheduleRepository.findByIdAndUserId(anyLong(), anyLong())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> scheduleService.getById(99L, 10L))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
        }
    }

    // ─── create ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("create()")
    class Create {

        @Test
        @DisplayName("Debe crear un horario sin bloques")
        void debeCrearHorario_sinBloques() {
            ScheduleRequest request = new ScheduleRequest("Nuevo", "2025-1", "Notas", List.of());
            when(scheduleRepository.save(any(Schedule.class))).thenReturn(schedule);

            ScheduleResponse result = scheduleService.create(request, 10L);

            assertThat(result).isNotNull();
            verify(scheduleRepository, times(2)).save(any(Schedule.class));
            verify(scheduleBlockRepository, never()).saveAll(any());
        }

        @Test
        @DisplayName("Debe crear un horario con bloques y guardarlos")
        void debeCrearHorario_conBloques() {
            ScheduleBlockRequest bloque = new ScheduleBlockRequest(101L, 201L, "#FF0000", false, null, null, null, null);
            ScheduleRequest request = new ScheduleRequest("Horario", "2025-1", null, List.of(bloque));
            when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

            ScheduleResponse result = scheduleService.create(request, 10L);

            assertThat(result).isNotNull();
            verify(scheduleBlockRepository, times(1)).saveAll(anyList());
        }

        @Test
        @DisplayName("Los bloques manuales no deben contar como créditos")
        void losBloquesManuales_noDebenContarComoCreditos() {
            ScheduleBlockRequest noManual = new ScheduleBlockRequest(1L, 1L, "#F00", false, null, null, null, null);
            ScheduleBlockRequest manual  = new ScheduleBlockRequest(null, null, "#0F0", true, "Libre", DayOfWeek.LUNES, null, null);
            ScheduleRequest request = new ScheduleRequest("H", "2025-1", null, List.of(noManual, manual));
            when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

            ScheduleResponse result = scheduleService.create(request, 10L);

            // 1 no-manual → totalCredits debe ser 1
            assertThat(result.totalCredits()).isEqualTo(1);
        }

        @Test
        @DisplayName("Cuando la lista de bloques es null no debe intentar guardarlos")
        void cuandoBloquesSonNull_noDebeGuardar() {
            ScheduleRequest request = new ScheduleRequest("H", "2025-1", null, null);
            when(scheduleRepository.save(any(Schedule.class))).thenReturn(schedule);

            scheduleService.create(request, 10L);

            verify(scheduleBlockRepository, never()).saveAll(any());
        }
    }

    // ─── update ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("update()")
    class Update {

        @Test
        @DisplayName("Debe actualizar el horario y eliminar bloques anteriores antes de guardar los nuevos")
        void debeActualizarHorario_yReemplazarBloques() {
            ScheduleRequest request = new ScheduleRequest("Nombre nuevo", "2025-2", "Notas nuevas", List.of());
            when(scheduleRepository.findByIdAndUserId(1L, 10L)).thenReturn(Optional.of(schedule));
            when(scheduleRepository.save(any(Schedule.class))).thenReturn(schedule);

            scheduleService.update(1L, 10L, request);

            verify(scheduleBlockRepository, times(1)).deleteByScheduleId(1L);
            verify(scheduleRepository, times(1)).save(any(Schedule.class));
        }

        @Test
        @DisplayName("Los campos del horario deben actualizarse con los valores del request")
        void debeCambiarCampos_conValoresDelRequest() {
            ScheduleRequest request = new ScheduleRequest("Actualizado", "2025-2", "Notas nuevas", List.of());
            when(scheduleRepository.findByIdAndUserId(1L, 10L)).thenReturn(Optional.of(schedule));
            when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

            ScheduleResponse result = scheduleService.update(1L, 10L, request);

            assertThat(result.name()).isEqualTo("Actualizado");
            assertThat(result.semester()).isEqualTo("2025-2");
        }

        @Test
        @DisplayName("Debe lanzar NexoException cuando el horario no pertenece al usuario")
        void debeLanzarExcepcion_cuandoHorarioNoPertenece() {
            when(scheduleRepository.findByIdAndUserId(anyLong(), anyLong())).thenReturn(Optional.empty());
            ScheduleRequest request = new ScheduleRequest("X", "2025-1", null, List.of());

            assertThatThrownBy(() -> scheduleService.update(99L, 10L, request))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
        }
    }

    // ─── delete ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("delete()")
    class Delete {

        @Test
        @DisplayName("Debe eliminar el horario cuando pertenece al usuario")
        void debeEliminarHorario_cuandoPerteneceAlUsuario() {
            when(scheduleRepository.findByIdAndUserId(1L, 10L)).thenReturn(Optional.of(schedule));

            scheduleService.delete(1L, 10L);

            verify(scheduleRepository, times(1)).delete(schedule);
        }

        @Test
        @DisplayName("Debe lanzar NexoException cuando el horario no existe o no pertenece al usuario")
        void debeLanzarExcepcion_cuandoNoPertenece() {
            when(scheduleRepository.findByIdAndUserId(anyLong(), anyLong())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> scheduleService.delete(99L, 10L))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
        }
    }

    // ─── setArchived ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("setArchived()")
    class SetArchived {

        @Test
        @DisplayName("Debe archivar el horario cuando se indica archived = true")
        void debeArchivarHorario() {
            when(scheduleRepository.findByIdAndUserId(1L, 10L)).thenReturn(Optional.of(schedule));
            when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

            ScheduleResponse result = scheduleService.setArchived(1L, 10L, true);

            assertThat(result.archived()).isTrue();
        }

        @Test
        @DisplayName("Debe desarchivar el horario cuando se indica archived = false")
        void debeDesarchivarHorario() {
            schedule.setArchived(true);
            when(scheduleRepository.findByIdAndUserId(1L, 10L)).thenReturn(Optional.of(schedule));
            when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

            ScheduleResponse result = scheduleService.setArchived(1L, 10L, false);

            assertThat(result.archived()).isFalse();
        }

        @Test
        @DisplayName("Debe lanzar NexoException cuando el horario no existe")
        void debeLanzarExcepcion_cuandoHorarioNoExiste() {
            when(scheduleRepository.findByIdAndUserId(anyLong(), anyLong())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> scheduleService.setArchived(99L, 10L, true))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
        }
    }

    // ─── validateConflicts ────────────────────────────────────────────────────

    @Nested
    @DisplayName("validateConflicts()")
    class ValidateConflicts {

        @Test
        @DisplayName("Debe reportar sin conflictos cuando no hay bloques")
        void debeReportarSinConflictos_cuandoNoHayBloques() {
            when(subjectGroupRepository.findTimeBlocksByGroupIds(anyList())).thenReturn(List.of());

            Map<String, Object> result = scheduleService.validateConflicts(List.of(1L));

            assertThat(result.get("hasConflicts")).isEqualTo(false);
            assertThat((List<?>) result.get("conflicts")).isEmpty();
        }

        @Test
        @DisplayName("Debe reportar sin conflictos cuando los bloques son en días distintos")
        void debeReportarSinConflictos_cuandoDiasDistintos() {
            TimeBlock lunes   = TimeBlock.builder().dia(DayOfWeek.LUNES).horaInicio(8).horaFin(10).build();
            TimeBlock martes  = TimeBlock.builder().dia(DayOfWeek.MARTES).horaInicio(8).horaFin(10).build();
            when(subjectGroupRepository.findTimeBlocksByGroupIds(anyList())).thenReturn(List.of(lunes, martes));

            Map<String, Object> result = scheduleService.validateConflicts(List.of(1L, 2L));

            assertThat(result.get("hasConflicts")).isEqualTo(false);
        }

        @Test
        @DisplayName("Debe reportar conflicto cuando dos bloques se solapan el mismo día")
        void debeDetectarConflicto_cuandoBloquesSeSolapan() {
            TimeBlock block1 = TimeBlock.builder().dia(DayOfWeek.LUNES).horaInicio(8).horaFin(10).build();
            TimeBlock block2 = TimeBlock.builder().dia(DayOfWeek.LUNES).horaInicio(9).horaFin(11).build();
            when(subjectGroupRepository.findTimeBlocksByGroupIds(anyList())).thenReturn(List.of(block1, block2));

            Map<String, Object> result = scheduleService.validateConflicts(List.of(1L, 2L));

            assertThat(result.get("hasConflicts")).isEqualTo(true);
            assertThat((List<?>) result.get("conflicts")).hasSize(1);
        }

        @Test
        @DisplayName("No debe reportar conflicto cuando los bloques del mismo día son consecutivos sin superposición")
        void noDebeReportarConflicto_cuandoBloquesConsecutivos() {
            TimeBlock block1 = TimeBlock.builder().dia(DayOfWeek.LUNES).horaInicio(8).horaFin(10).build();
            TimeBlock block2 = TimeBlock.builder().dia(DayOfWeek.LUNES).horaInicio(10).horaFin(12).build();
            when(subjectGroupRepository.findTimeBlocksByGroupIds(anyList())).thenReturn(List.of(block1, block2));

            Map<String, Object> result = scheduleService.validateConflicts(List.of(1L, 2L));

            assertThat(result.get("hasConflicts")).isEqualTo(false);
        }

        @Test
        @DisplayName("Debe detectar conflicto cuando un bloque contiene completamente a otro")
        void debeDetectarConflicto_cuandoUnBloqueContieneAOtro() {
            TimeBlock grande = TimeBlock.builder().dia(DayOfWeek.JUEVES).horaInicio(8).horaFin(14).build();
            TimeBlock chico  = TimeBlock.builder().dia(DayOfWeek.JUEVES).horaInicio(10).horaFin(12).build();
            when(subjectGroupRepository.findTimeBlocksByGroupIds(anyList())).thenReturn(List.of(grande, chico));

            Map<String, Object> result = scheduleService.validateConflicts(List.of(1L, 2L));

            assertThat(result.get("hasConflicts")).isEqualTo(true);
        }

        @Test
        @DisplayName("Debe detectar múltiples conflictos cuando hay varios solapamientos")
        void debeDetectarMultiplesConflictos() {
            TimeBlock a = TimeBlock.builder().dia(DayOfWeek.VIERNES).horaInicio(6).horaFin(8).build();
            TimeBlock b = TimeBlock.builder().dia(DayOfWeek.VIERNES).horaInicio(7).horaFin(9).build();
            TimeBlock c = TimeBlock.builder().dia(DayOfWeek.VIERNES).horaInicio(7).horaFin(10).build();
            when(subjectGroupRepository.findTimeBlocksByGroupIds(anyList())).thenReturn(List.of(a, b, c));

            Map<String, Object> result = scheduleService.validateConflicts(List.of(1L, 2L, 3L));

            // a-b, a-c y b-c se solapan → 3 conflictos
            assertThat((List<?>) result.get("conflicts")).hasSize(3);
        }
    }
}
