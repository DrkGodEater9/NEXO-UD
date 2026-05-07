package com.kumorai.nexo.schedule.service;

import com.kumorai.nexo.schedule.dto.CreateHorarioRequest;
import com.kumorai.nexo.schedule.dto.HorarioResponse;
import com.kumorai.nexo.schedule.entity.DiaSemana;
import com.kumorai.nexo.schedule.entity.Horario;
import com.kumorai.nexo.schedule.exception.HorarioConflictoException;
import com.kumorai.nexo.schedule.exception.HorarioNotFoundException;
import com.kumorai.nexo.schedule.mapper.HorarioMapper;
import com.kumorai.nexo.schedule.repository.HorarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/**
 * Pruebas unitarias para HorarioServiceImpl.
 * El foco principal está en la validación de conflictos de horario,
 * que es la regla de negocio más crítica de este módulo.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("HorarioServiceImpl - Pruebas Unitarias")
class HorarioServiceImplTest {

    @Mock
    private HorarioRepository horarioRepository;

    @Mock
    private HorarioMapper horarioMapper;

    @InjectMocks
    private HorarioServiceImpl horarioService;

    // ─── Fixtures ─────────────────────────────────────────────────────────────

    private Horario horarioExistente;
    private HorarioResponse horarioResponse;

    @BeforeEach
    void setUp() {
        // Horario existente: Lunes 08:00 - 10:00 en Aula 101
        horarioExistente = Horario.builder()
                .id(1L)
                .aula("Aula 101")
                .dia(DiaSemana.LUNES)
                .horaInicio(LocalTime.of(8, 0))
                .horaFin(LocalTime.of(10, 0))
                .ofertaAcademicaId(10L)
                .build();

        horarioResponse = HorarioResponse.builder()
                .id(1L)
                .aula("Aula 101")
                .dia(DiaSemana.LUNES)
                .horaInicio(LocalTime.of(8, 0))
                .horaFin(LocalTime.of(10, 0))
                .build();
    }

    // ─── findById ─────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("findById()")
    class FindById {

        @Test
        @DisplayName("Debe retornar el horario cuando existe el ID")
        void debeRetornarHorario_cuandoIdExiste() {
            when(horarioRepository.findById(1L)).thenReturn(Optional.of(horarioExistente));
            when(horarioMapper.toResponse(horarioExistente)).thenReturn(horarioResponse);

            HorarioResponse result = horarioService.findById(1L);

            assertThat(result.getAula()).isEqualTo("Aula 101");
        }

        @Test
        @DisplayName("Debe lanzar HorarioNotFoundException cuando no existe el ID")
        void debeLanzarExcepcion_cuandoIdNoExiste() {
            when(horarioRepository.findById(anyLong())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> horarioService.findById(99L))
                    .isInstanceOf(HorarioNotFoundException.class);
        }
    }

    // ─── findByOferta ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("findByOfertaAcademica()")
    class FindByOferta {

        @Test
        @DisplayName("Debe retornar todos los horarios de una oferta académica")
        void debeRetornarHorarios_deUnaOferta() {
            when(horarioRepository.findAllByOfertaAcademicaId(10L))
                    .thenReturn(List.of(horarioExistente));
            when(horarioMapper.toResponse(any())).thenReturn(horarioResponse);

            List<HorarioResponse> result = horarioService.findByOfertaAcademica(10L);

            assertThat(result).hasSize(1);
        }
    }

    // ─── createHorario con detección de conflictos ────────────────────────────

    @Nested
    @DisplayName("createHorario() - Validación de Conflictos")
    class CreateHorario {

        @Test
        @DisplayName("Debe crear el horario cuando no hay conflictos en el aula")
        void debeCrearHorario_cuandoNoHayConflicto() {
            // Nuevo horario: Lunes 10:00 - 12:00 (empieza justo cuando termina el existente)
            CreateHorarioRequest request = CreateHorarioRequest.builder()
                    .aula("Aula 101")
                    .dia(DiaSemana.LUNES)
                    .horaInicio(LocalTime.of(10, 0))
                    .horaFin(LocalTime.of(12, 0))
                    .ofertaAcademicaId(11L)
                    .build();

            when(horarioRepository.findConflictos(
                    "Aula 101", DiaSemana.LUNES,
                    LocalTime.of(10, 0), LocalTime.of(12, 0)))
                    .thenReturn(List.of()); // Sin conflictos

            when(horarioRepository.save(any())).thenReturn(horarioExistente);
            when(horarioMapper.toResponse(any())).thenReturn(horarioResponse);

            horarioService.createHorario(request);

            verify(horarioRepository, times(1)).save(any());
        }

        @Test
        @DisplayName("Debe lanzar HorarioConflictoException cuando hay traslape de horarios en el aula")
        void debeLanzarExcepcion_cuandoHayConflictoDeHorario() {
            // Nuevo horario: Lunes 09:00 - 11:00 → conflicto con el existente 08:00-10:00
            CreateHorarioRequest request = CreateHorarioRequest.builder()
                    .aula("Aula 101")
                    .dia(DiaSemana.LUNES)
                    .horaInicio(LocalTime.of(9, 0))
                    .horaFin(LocalTime.of(11, 0))
                    .ofertaAcademicaId(12L)
                    .build();

            when(horarioRepository.findConflictos(
                    "Aula 101", DiaSemana.LUNES,
                    LocalTime.of(9, 0), LocalTime.of(11, 0)))
                    .thenReturn(List.of(horarioExistente)); // ← hay conflicto

            assertThatThrownBy(() -> horarioService.createHorario(request))
                    .isInstanceOf(HorarioConflictoException.class)
                    .hasMessageContaining("Aula 101");

            verify(horarioRepository, never()).save(any());
        }

        @Test
        @DisplayName("No debe haber conflicto si el horario es en diferente día de la semana")
        void noDebeHaberConflicto_cuandoDiaEsDiferente() {
            CreateHorarioRequest request = CreateHorarioRequest.builder()
                    .aula("Aula 101")
                    .dia(DiaSemana.MARTES) // ← diferente día
                    .horaInicio(LocalTime.of(8, 0))
                    .horaFin(LocalTime.of(10, 0))
                    .ofertaAcademicaId(11L)
                    .build();

            when(horarioRepository.findConflictos(
                    "Aula 101", DiaSemana.MARTES,
                    LocalTime.of(8, 0), LocalTime.of(10, 0)))
                    .thenReturn(List.of());

            when(horarioRepository.save(any())).thenReturn(horarioExistente);
            when(horarioMapper.toResponse(any())).thenReturn(horarioResponse);

            horarioService.createHorario(request);

            verify(horarioRepository, times(1)).save(any());
        }

        @Test
        @DisplayName("No debe haber conflicto si el horario es en diferente aula")
        void noDebeHaberConflicto_cuandoAulaEsDiferente() {
            CreateHorarioRequest request = CreateHorarioRequest.builder()
                    .aula("Aula 202") // ← diferente aula
                    .dia(DiaSemana.LUNES)
                    .horaInicio(LocalTime.of(8, 0))
                    .horaFin(LocalTime.of(10, 0))
                    .ofertaAcademicaId(11L)
                    .build();

            when(horarioRepository.findConflictos(
                    "Aula 202", DiaSemana.LUNES,
                    LocalTime.of(8, 0), LocalTime.of(10, 0)))
                    .thenReturn(List.of());

            when(horarioRepository.save(any())).thenReturn(horarioExistente);
            when(horarioMapper.toResponse(any())).thenReturn(horarioResponse);

            horarioService.createHorario(request);

            verify(horarioRepository, times(1)).save(any());
        }

        @Test
        @DisplayName("Debe lanzar excepción si horaFin es anterior o igual a horaInicio")
        void debeLanzarExcepcion_cuandoHoraFinEsAnteriorAHoraInicio() {
            CreateHorarioRequest requestInvalido = CreateHorarioRequest.builder()
                    .aula("Aula 101")
                    .dia(DiaSemana.LUNES)
                    .horaInicio(LocalTime.of(10, 0))
                    .horaFin(LocalTime.of(9, 0)) // ← inválido
                    .ofertaAcademicaId(11L)
                    .build();

            assertThatThrownBy(() -> horarioService.createHorario(requestInvalido))
                    .isInstanceOf(IllegalArgumentException.class);

            verify(horarioRepository, never()).save(any());
            verify(horarioRepository, never()).findConflictos(any(), any(), any(), any());
        }
    }
}
