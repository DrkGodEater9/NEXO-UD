package com.kumorai.nexo.content.service;

import com.kumorai.nexo.content.dto.CalendarEventRequest;
import com.kumorai.nexo.content.dto.CalendarEventResponse;
import com.kumorai.nexo.content.entity.CalendarEvent;
import com.kumorai.nexo.content.entity.CalendarEventType;
import com.kumorai.nexo.content.repository.CalendarEventRepository;
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

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CalendarEventServiceImpl - Pruebas Unitarias")
class CalendarEventServiceImplTest {

    @Mock
    private CalendarEventRepository calendarEventRepository;

    @InjectMocks
    private CalendarEventServiceImpl calendarEventService;

    private CalendarEvent evento;
    private CalendarEventRequest request;

    @BeforeEach
    void setUp() {
        evento = CalendarEvent.builder()
                .id(1L)
                .title("Inicio de clases")
                .description("Primer día del semestre")
                .eventType(CalendarEventType.INICIO_CLASES)
                .startDate(LocalDate.of(2025, 1, 27))
                .endDate(null)
                .createdBy(3L)
                .build();

        request = new CalendarEventRequest(
                "Parciales",
                "Semana de parciales",
                CalendarEventType.PARCIAL,
                LocalDate.of(2025, 3, 10),
                LocalDate.of(2025, 3, 14)
        );
    }

    // ─── listAll ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("listAll()")
    class ListAll {

        @Test
        @DisplayName("Debe retornar todos los eventos cuando no hay filtros")
        void debeRetornarTodos_sinFiltros() {
            when(calendarEventRepository.findFiltered(null, null, null)).thenReturn(List.of(evento));

            List<CalendarEventResponse> result = calendarEventService.listAll(null, null, null);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).title()).isEqualTo("Inicio de clases");
        }

        @Test
        @DisplayName("Debe delegar filtro de rango de fechas al repositorio")
        void debeDelegarFiltroFechas() {
            LocalDate from = LocalDate.of(2025, 1, 1);
            LocalDate to   = LocalDate.of(2025, 6, 30);
            when(calendarEventRepository.findFiltered(from, to, null)).thenReturn(List.of(evento));

            List<CalendarEventResponse> result = calendarEventService.listAll(from, to, null);

            assertThat(result).hasSize(1);
            verify(calendarEventRepository).findFiltered(from, to, null);
        }

        @Test
        @DisplayName("Debe delegar filtro de tipo de evento al repositorio")
        void debeDelegarFiltroTipoEvento() {
            when(calendarEventRepository.findFiltered(null, null, CalendarEventType.PARCIAL))
                    .thenReturn(List.of());

            List<CalendarEventResponse> result = calendarEventService.listAll(null, null, CalendarEventType.PARCIAL);

            assertThat(result).isEmpty();
            verify(calendarEventRepository).findFiltered(null, null, CalendarEventType.PARCIAL);
        }

        @Test
        @DisplayName("Debe retornar lista vacía cuando no hay eventos que coincidan")
        void debeRetornarListaVacia_cuandoNoHayEventos() {
            when(calendarEventRepository.findFiltered(any(), any(), any())).thenReturn(List.of());

            List<CalendarEventResponse> result = calendarEventService.listAll(null, null, null);

            assertThat(result).isEmpty();
        }
    }

    // ─── getById ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getById()")
    class GetById {

        @Test
        @DisplayName("Debe retornar el evento cuando el ID existe")
        void debeRetornarEvento_cuandoIdExiste() {
            when(calendarEventRepository.findById(1L)).thenReturn(Optional.of(evento));

            CalendarEventResponse result = calendarEventService.getById(1L);

            assertThat(result.id()).isEqualTo(1L);
            assertThat(result.title()).isEqualTo("Inicio de clases");
            assertThat(result.eventType()).isEqualTo("INICIO_CLASES");
            assertThat(result.startDate()).isEqualTo(LocalDate.of(2025, 1, 27));
        }

        @Test
        @DisplayName("Debe lanzar NexoException 404 cuando el ID no existe")
        void debeLanzarExcepcion_cuandoIdNoExiste() {
            when(calendarEventRepository.findById(anyLong())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> calendarEventService.getById(99L))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND))
                    .hasMessageContaining("Evento de calendario no encontrado");
        }
    }

    // ─── create ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("create()")
    class Create {

        @Test
        @DisplayName("Debe crear el evento con todos los campos del request")
        void debeCrearEvento_conTodosLosCampos() {
            CalendarEvent saved = CalendarEvent.builder()
                    .id(2L).title("Parciales").description("Semana de parciales")
                    .eventType(CalendarEventType.PARCIAL)
                    .startDate(LocalDate.of(2025, 3, 10))
                    .endDate(LocalDate.of(2025, 3, 14))
                    .createdBy(3L).build();
            when(calendarEventRepository.save(any(CalendarEvent.class))).thenReturn(saved);

            CalendarEventResponse result = calendarEventService.create(request, 3L);

            assertThat(result.title()).isEqualTo("Parciales");
            assertThat(result.eventType()).isEqualTo("PARCIAL");
            assertThat(result.startDate()).isEqualTo(LocalDate.of(2025, 3, 10));
            assertThat(result.endDate()).isEqualTo(LocalDate.of(2025, 3, 14));
            assertThat(result.createdBy()).isEqualTo(3L);
        }

        @Test
        @DisplayName("Debe asignar el createdBy con el userId proporcionado")
        void debeAsignarCreatedBy() {
            when(calendarEventRepository.save(any(CalendarEvent.class))).thenAnswer(inv -> inv.getArgument(0));

            calendarEventService.create(request, 77L);

            verify(calendarEventRepository).save(argThat(e -> e.getCreatedBy().equals(77L)));
        }

        @Test
        @DisplayName("Debe crear evento sin fecha de fin cuando endDate es null")
        void debeCrearEvento_sinFechaFin() {
            CalendarEventRequest sinFin = new CalendarEventRequest(
                    "Festivo", null, CalendarEventType.FESTIVO,
                    LocalDate.of(2025, 5, 1), null);
            when(calendarEventRepository.save(any(CalendarEvent.class))).thenAnswer(inv -> inv.getArgument(0));

            calendarEventService.create(sinFin, 1L);

            verify(calendarEventRepository).save(argThat(e -> e.getEndDate() == null));
        }
    }

    // ─── update ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("update()")
    class Update {

        @Test
        @DisplayName("Debe actualizar todos los campos del evento")
        void debeActualizarCampos_cuandoExiste() {
            when(calendarEventRepository.findById(1L)).thenReturn(Optional.of(evento));
            when(calendarEventRepository.save(any(CalendarEvent.class))).thenAnswer(inv -> inv.getArgument(0));

            CalendarEventResponse result = calendarEventService.update(1L, request);

            assertThat(result.title()).isEqualTo("Parciales");
            assertThat(result.eventType()).isEqualTo("PARCIAL");
            assertThat(result.startDate()).isEqualTo(LocalDate.of(2025, 3, 10));
        }

        @Test
        @DisplayName("Debe lanzar NexoException 404 cuando el evento no existe")
        void debeLanzarExcepcion_cuandoNoExiste() {
            when(calendarEventRepository.findById(anyLong())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> calendarEventService.update(99L, request))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));

            verify(calendarEventRepository, never()).save(any());
        }
    }

    // ─── delete ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("delete()")
    class Delete {

        @Test
        @DisplayName("Debe eliminar el evento cuando existe")
        void debeEliminarEvento_cuandoExiste() {
            when(calendarEventRepository.findById(1L)).thenReturn(Optional.of(evento));

            calendarEventService.delete(1L);

            verify(calendarEventRepository, times(1)).delete(evento);
        }

        @Test
        @DisplayName("Debe lanzar NexoException 404 cuando el evento no existe")
        void debeLanzarExcepcion_cuandoNoExiste() {
            when(calendarEventRepository.findById(anyLong())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> calendarEventService.delete(99L))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));

            verify(calendarEventRepository, never()).delete(any());
        }
    }
}
