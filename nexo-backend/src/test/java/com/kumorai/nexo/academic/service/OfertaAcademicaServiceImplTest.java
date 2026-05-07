package com.kumorai.nexo.academic.service;

import com.kumorai.nexo.academic.dto.CreateOfertaRequest;
import com.kumorai.nexo.academic.dto.OfertaAcademicaResponse;
import com.kumorai.nexo.academic.entity.EstadoOferta;
import com.kumorai.nexo.academic.entity.OfertaAcademica;
import com.kumorai.nexo.academic.exception.OfertaNotFoundException;
import com.kumorai.nexo.academic.exception.CupoInsuficienteException;
import com.kumorai.nexo.academic.mapper.OfertaAcademicaMapper;
import com.kumorai.nexo.academic.repository.OfertaAcademicaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/**
 * Pruebas unitarias para OfertaAcademicaServiceImpl.
 * Cubre: creación de ofertas, consulta, inscripción de estudiantes
 * y validación de cupos disponibles.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("OfertaAcademicaServiceImpl - Pruebas Unitarias")
class OfertaAcademicaServiceImplTest {

    @Mock
    private OfertaAcademicaRepository ofertaRepository;

    @Mock
    private OfertaAcademicaMapper ofertaMapper;

    @InjectMocks
    private OfertaAcademicaServiceImpl ofertaService;

    // ─── Fixtures ─────────────────────────────────────────────────────────────

    private OfertaAcademica ofertaConCupos;
    private OfertaAcademica ofertaSinCupos;
    private OfertaAcademicaResponse ofertaResponse;

    @BeforeEach
    void setUp() {
        ofertaConCupos = OfertaAcademica.builder()
                .id(1L)
                .nombre("Programación Orientada a Objetos")
                .codigo("CS-101")
                .cupoMaximo(30)
                .cupoActual(20)
                .estado(EstadoOferta.ACTIVA)
                .fechaInicio(LocalDate.now().plusDays(7))
                .fechaFin(LocalDate.now().plusMonths(4))
                .build();

        ofertaSinCupos = OfertaAcademica.builder()
                .id(2L)
                .nombre("Cálculo Diferencial")
                .codigo("MAT-201")
                .cupoMaximo(25)
                .cupoActual(25) // ← Lleno
                .estado(EstadoOferta.ACTIVA)
                .fechaInicio(LocalDate.now().plusDays(3))
                .fechaFin(LocalDate.now().plusMonths(4))
                .build();

        ofertaResponse = OfertaAcademicaResponse.builder()
                .id(1L)
                .nombre("Programación Orientada a Objetos")
                .codigo("CS-101")
                .cuposDisponibles(10)
                .estado(EstadoOferta.ACTIVA)
                .build();
    }

    // ─── findById ─────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("findById()")
    class FindById {

        @Test
        @DisplayName("Debe retornar la oferta cuando existe el ID")
        void debeRetornarOferta_cuandoIdExiste() {
            when(ofertaRepository.findById(1L)).thenReturn(Optional.of(ofertaConCupos));
            when(ofertaMapper.toResponse(ofertaConCupos)).thenReturn(ofertaResponse);

            OfertaAcademicaResponse result = ofertaService.findById(1L);

            assertThat(result).isNotNull();
            assertThat(result.getCodigo()).isEqualTo("CS-101");
        }

        @Test
        @DisplayName("Debe lanzar OfertaNotFoundException cuando el ID no existe")
        void debeLanzarExcepcion_cuandoIdNoExiste() {
            when(ofertaRepository.findById(anyLong())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> ofertaService.findById(99L))
                    .isInstanceOf(OfertaNotFoundException.class)
                    .hasMessageContaining("99");
        }
    }

    // ─── findAllActivas ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("findAllActivas()")
    class FindAllActivas {

        @Test
        @DisplayName("Debe retornar sólo las ofertas con estado ACTIVA")
        void debeRetornarSoloOfertasActivas() {
            OfertaAcademica ofertaCerrada = OfertaAcademica.builder()
                    .id(3L).estado(EstadoOferta.CERRADA).build();

            when(ofertaRepository.findAllByEstado(EstadoOferta.ACTIVA))
                    .thenReturn(List.of(ofertaConCupos));
            when(ofertaMapper.toResponse(any())).thenReturn(ofertaResponse);

            List<OfertaAcademicaResponse> result = ofertaService.findAllActivas();

            assertThat(result).hasSize(1);
            verify(ofertaRepository, times(1)).findAllByEstado(EstadoOferta.ACTIVA);
        }

        @Test
        @DisplayName("Debe retornar lista vacía cuando no hay ofertas activas")
        void debeRetornarListaVacia_cuandoNoHayOfertasActivas() {
            when(ofertaRepository.findAllByEstado(EstadoOferta.ACTIVA)).thenReturn(List.of());

            List<OfertaAcademicaResponse> result = ofertaService.findAllActivas();

            assertThat(result).isEmpty();
        }
    }

    // ─── createOferta ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("createOferta()")
    class CreateOferta {

        @Test
        @DisplayName("Debe crear la oferta con cupoActual en cero por defecto")
        void debeCrearOferta_conCupoActualEnCero() {
            CreateOfertaRequest request = CreateOfertaRequest.builder()
                    .nombre("Bases de Datos I")
                    .codigo("CS-301")
                    .cupoMaximo(35)
                    .fechaInicio(LocalDate.now().plusDays(10))
                    .fechaFin(LocalDate.now().plusMonths(4))
                    .build();

            when(ofertaRepository.save(any(OfertaAcademica.class))).thenReturn(ofertaConCupos);
            when(ofertaMapper.toResponse(any())).thenReturn(ofertaResponse);

            ofertaService.createOferta(request);

            // El cupo inicial debe ser 0 al crear la oferta
            verify(ofertaRepository).save(argThat(o -> o.getCupoActual() == 0));
        }

        @Test
        @DisplayName("Debe crear la oferta con estado ACTIVA por defecto")
        void debeCrearOferta_conEstadoActivaPorDefecto() {
            CreateOfertaRequest request = CreateOfertaRequest.builder()
                    .nombre("Bases de Datos I")
                    .codigo("CS-301")
                    .cupoMaximo(35)
                    .fechaInicio(LocalDate.now().plusDays(10))
                    .fechaFin(LocalDate.now().plusMonths(4))
                    .build();

            when(ofertaRepository.save(any())).thenReturn(ofertaConCupos);
            when(ofertaMapper.toResponse(any())).thenReturn(ofertaResponse);

            ofertaService.createOferta(request);

            verify(ofertaRepository).save(argThat(o ->
                    o.getEstado() == EstadoOferta.ACTIVA));
        }

        @Test
        @DisplayName("Debe lanzar excepción si la fecha de inicio es anterior a hoy")
        void debeLanzarExcepcion_cuandoFechaInicioEsAnteriorAHoy() {
            CreateOfertaRequest request = CreateOfertaRequest.builder()
                    .nombre("Curso Pasado")
                    .codigo("OLD-101")
                    .cupoMaximo(20)
                    .fechaInicio(LocalDate.now().minusDays(1)) // ← fecha inválida
                    .fechaFin(LocalDate.now().plusMonths(4))
                    .build();

            assertThatThrownBy(() -> ofertaService.createOferta(request))
                    .isInstanceOf(IllegalArgumentException.class);

            verify(ofertaRepository, never()).save(any());
        }
    }

    // ─── inscribirEstudiante ──────────────────────────────────────────────────

    @Nested
    @DisplayName("inscribirEstudiante()")
    class InscribirEstudiante {

        @Test
        @DisplayName("Debe incrementar el cupoActual en 1 cuando hay cupos disponibles")
        void debeIncrementarCupo_cuandoHayCuposDisponibles() {
            int cupoAntes = ofertaConCupos.getCupoActual(); // 20

            when(ofertaRepository.findById(1L)).thenReturn(Optional.of(ofertaConCupos));
            when(ofertaRepository.save(any())).thenReturn(ofertaConCupos);

            ofertaService.inscribirEstudiante(1L, 10L);

            verify(ofertaRepository).save(argThat(o ->
                    o.getCupoActual() == cupoAntes + 1));
        }

        @Test
        @DisplayName("Debe lanzar CupoInsuficienteException cuando la oferta está llena")
        void debeLanzarExcepcion_cuandoOfertaEstaLlena() {
            when(ofertaRepository.findById(2L)).thenReturn(Optional.of(ofertaSinCupos));

            assertThatThrownBy(() -> ofertaService.inscribirEstudiante(2L, 10L))
                    .isInstanceOf(CupoInsuficienteException.class)
                    .hasMessageContaining("MAT-201");

            verify(ofertaRepository, never()).save(any());
        }

        @Test
        @DisplayName("Debe lanzar OfertaNotFoundException cuando la oferta no existe")
        void debeLanzarExcepcion_cuandoOfertaNoExiste() {
            when(ofertaRepository.findById(anyLong())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> ofertaService.inscribirEstudiante(99L, 10L))
                    .isInstanceOf(OfertaNotFoundException.class);
        }

        @Test
        @DisplayName("Debe lanzar excepción al intentar inscribir en una oferta CERRADA")
        void debeLanzarExcepcion_cuandoOfertaEstaCerrada() {
            ofertaConCupos.setEstado(EstadoOferta.CERRADA);
            when(ofertaRepository.findById(1L)).thenReturn(Optional.of(ofertaConCupos));

            assertThatThrownBy(() -> ofertaService.inscribirEstudiante(1L, 10L))
                    .isInstanceOf(IllegalStateException.class);

            verify(ofertaRepository, never()).save(any());
        }
    }

    // ─── getCuposDisponibles ──────────────────────────────────────────────────

    @Nested
    @DisplayName("getCuposDisponibles()")
    class GetCuposDisponibles {

        @Test
        @DisplayName("Debe calcular correctamente los cupos disponibles restantes")
        void debeCalcularCuposDisponibles_correctamente() {
            // cupoMaximo=30, cupoActual=20 → disponibles=10
            when(ofertaRepository.findById(1L)).thenReturn(Optional.of(ofertaConCupos));

            int disponibles = ofertaService.getCuposDisponibles(1L);

            assertThat(disponibles).isEqualTo(10);
        }

        @Test
        @DisplayName("Debe retornar 0 cupos disponibles cuando la oferta está llena")
        void debeRetornarCero_cuandoOfertaEstaLlena() {
            when(ofertaRepository.findById(2L)).thenReturn(Optional.of(ofertaSinCupos));

            int disponibles = ofertaService.getCuposDisponibles(2L);

            assertThat(disponibles).isZero();
        }
    }
}
