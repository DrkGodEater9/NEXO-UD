package com.kumorai.nexo.report.service;

import com.kumorai.nexo.academic.repository.OfertaAcademicaRepository;
import com.kumorai.nexo.report.dto.ReporteInscripcionesResponse;
import com.kumorai.nexo.report.dto.ReporteOcupacionAulasResponse;
import com.kumorai.nexo.report.exception.ReporteSinDatosException;
import com.kumorai.nexo.user.entity.Role;
import com.kumorai.nexo.user.repository.UserRepository;
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
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Pruebas unitarias para ReportServiceImpl.
 * Los reportes son consultas de solo lectura, por lo que el foco
 * está en verificar que los cálculos y agrupaciones sean correctos.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ReportServiceImpl - Pruebas Unitarias")
class ReportServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private OfertaAcademicaRepository ofertaRepository;

    @InjectMocks
    private ReportServiceImpl reportService;

    // ─── Reporte de Inscripciones ─────────────────────────────────────────────

    @Nested
    @DisplayName("generarReporteInscripciones()")
    class ReporteInscripciones {

        @Test
        @DisplayName("Debe calcular correctamente el total de inscritos por oferta")
        void debeCalcularTotalInscritos_porOferta() {
            LocalDate desde = LocalDate.now().minusMonths(1);
            LocalDate hasta = LocalDate.now();

            ReporteInscripcionesResponse mockReporte = ReporteInscripcionesResponse.builder()
                    .totalInscripciones(120L)
                    .inscripcionesPorOferta(Map.of("CS-101", 45L, "MAT-201", 75L))
                    .build();

            when(ofertaRepository.generarReporteInscripciones(desde, hasta))
                    .thenReturn(mockReporte);

            ReporteInscripcionesResponse result =
                    reportService.generarReporteInscripciones(desde, hasta);

            assertThat(result.getTotalInscripciones()).isEqualTo(120L);
            assertThat(result.getInscripcionesPorOferta()).hasSize(2);
            assertThat(result.getInscripcionesPorOferta().get("CS-101")).isEqualTo(45L);
        }

        @Test
        @DisplayName("Debe lanzar ReporteSinDatosException cuando no hay inscripciones en el rango")
        void debeLanzarExcepcion_cuandoNoHayDatos() {
            LocalDate desde = LocalDate.of(2020, 1, 1);
            LocalDate hasta = LocalDate.of(2020, 1, 31);

            when(ofertaRepository.generarReporteInscripciones(desde, hasta))
                    .thenReturn(ReporteInscripcionesResponse.builder()
                            .totalInscripciones(0L)
                            .inscripcionesPorOferta(Map.of())
                            .build());

            assertThatThrownBy(() -> reportService.generarReporteInscripciones(desde, hasta))
                    .isInstanceOf(ReporteSinDatosException.class);
        }

        @Test
        @DisplayName("Debe lanzar excepción si la fecha 'desde' es posterior a 'hasta'")
        void debeLanzarExcepcion_cuandoRangoDeFechasInvalido() {
            LocalDate desde = LocalDate.now();
            LocalDate hasta = LocalDate.now().minusDays(1); // ← inválido

            assertThatThrownBy(() -> reportService.generarReporteInscripciones(desde, hasta))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("rango");

            verify(ofertaRepository, never()).generarReporteInscripciones(any(), any());
        }
    }

    // ─── Reporte de Distribución de Roles ─────────────────────────────────────

    @Nested
    @DisplayName("generarReporteDistribucionRoles()")
    class ReporteDistribucionRoles {

        @Test
        @DisplayName("Debe contar correctamente los usuarios por cada rol")
        void debeContarUsuarios_porRol() {
            when(userRepository.countByRoleAndActivoTrue(Role.ESTUDIANTE)).thenReturn(350L);
            when(userRepository.countByRoleAndActivoTrue(Role.DOCENTE)).thenReturn(40L);
            when(userRepository.countByRoleAndActivoTrue(Role.ADMIN)).thenReturn(5L);

            Map<Role, Long> result = reportService.generarReporteDistribucionRoles();

            assertThat(result).containsEntry(Role.ESTUDIANTE, 350L);
            assertThat(result).containsEntry(Role.DOCENTE, 40L);
            assertThat(result).containsEntry(Role.ADMIN, 5L);
        }

        @Test
        @DisplayName("El total de usuarios debe ser la suma de todos los roles")
        void elTotal_debeSerLaSumaDeTodosLosRoles() {
            when(userRepository.countByRoleAndActivoTrue(Role.ESTUDIANTE)).thenReturn(350L);
            when(userRepository.countByRoleAndActivoTrue(Role.DOCENTE)).thenReturn(40L);
            when(userRepository.countByRoleAndActivoTrue(Role.ADMIN)).thenReturn(5L);

            Map<Role, Long> result = reportService.generarReporteDistribucionRoles();

            long total = result.values().stream().mapToLong(Long::longValue).sum();
            assertThat(total).isEqualTo(395L);
        }
    }

    // ─── Reporte de Ocupación de Aulas ────────────────────────────────────────

    @Nested
    @DisplayName("generarReporteOcupacionAulas()")
    class ReporteOcupacionAulas {

        @Test
        @DisplayName("Debe calcular el porcentaje de ocupación por aula correctamente")
        void debeCalcularPorcentajeOcupacion() {
            ReporteOcupacionAulasResponse reporte = ReporteOcupacionAulasResponse.builder()
                    .aula("Aula 101")
                    .capacidad(30)
                    .inscritos(24)
                    .porcentajeOcupacion(80.0)
                    .build();

            when(ofertaRepository.generarReporteOcupacionAulas())
                    .thenReturn(List.of(reporte));

            List<ReporteOcupacionAulasResponse> result =
                    reportService.generarReporteOcupacionAulas();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getPorcentajeOcupacion()).isEqualTo(80.0);
        }

        @Test
        @DisplayName("Debe ordenar las aulas de mayor a menor ocupación")
        void debeOrdenarAulas_deMayorAMenorOcupacion() {
            ReporteOcupacionAulasResponse aulaBaja = ReporteOcupacionAulasResponse.builder()
                    .aula("Aula 202").porcentajeOcupacion(40.0).build();
            ReporteOcupacionAulasResponse aulaAlta = ReporteOcupacionAulasResponse.builder()
                    .aula("Aula 101").porcentajeOcupacion(95.0).build();
            ReporteOcupacionAulasResponse aulaMedia = ReporteOcupacionAulasResponse.builder()
                    .aula("Aula 303").porcentajeOcupacion(70.0).build();

            when(ofertaRepository.generarReporteOcupacionAulas())
                    .thenReturn(List.of(aulaBaja, aulaAlta, aulaMedia));

            List<ReporteOcupacionAulasResponse> result =
                    reportService.generarReporteOcupacionAulas();

            assertThat(result.get(0).getAula()).isEqualTo("Aula 101");   // 95%
            assertThat(result.get(1).getAula()).isEqualTo("Aula 303");   // 70%
            assertThat(result.get(2).getAula()).isEqualTo("Aula 202");   // 40%
        }
    }
}
