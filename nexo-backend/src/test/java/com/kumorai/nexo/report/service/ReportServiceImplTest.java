package com.kumorai.nexo.report.service;

import com.kumorai.nexo.report.dto.ReportRequest;
import com.kumorai.nexo.report.dto.ReportResponse;
import com.kumorai.nexo.report.dto.UpdateReportStatusRequest;
import com.kumorai.nexo.report.entity.Report;
import com.kumorai.nexo.report.entity.ReportStatus;
import com.kumorai.nexo.report.entity.ReportType;
import com.kumorai.nexo.report.repository.ReportRepository;
import com.kumorai.nexo.shared.exception.NexoException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ReportServiceImpl - Pruebas Unitarias")
class ReportServiceImplTest {

    @Mock private ReportRepository reportRepository;
    @InjectMocks private ReportServiceImpl reportService;

    private Report report;

    @BeforeEach
    void setUp() {
        report = Report.builder()
                .id(1L)
                .userId(10L)
                .reportType(ReportType.OTRO)
                .description("Descripcion")
                .evidenceUrl("https://evidencia.test")
                .status(ReportStatus.PENDIENTE)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Debe listar reportes de un usuario")
    void debeListarPorUsuario() {
        when(reportRepository.findByUserIdOrderByCreatedAtDesc(10L)).thenReturn(List.of(report));

        List<ReportResponse> result = reportService.listByUser(10L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).userId()).isEqualTo(10L);
    }

    @Test
    @DisplayName("Debe crear reporte pendiente")
    void debeCrearReporte() {
        ReportRequest request = new ReportRequest(ReportType.OTRO, "Descripcion", null);
        when(reportRepository.save(any(Report.class))).thenAnswer(invocation -> {
            Report saved = invocation.getArgument(0);
            saved.setId(2L);
            saved.setCreatedAt(LocalDateTime.now());
            return saved;
        });

        ReportResponse result = reportService.create(request, 10L);

        assertThat(result.id()).isEqualTo(2L);
        assertThat(result.status()).isEqualTo("PENDIENTE");
        verify(reportRepository).save(any(Report.class));
    }

    @Nested
    @DisplayName("getById()")
    class GetById {

        @Test
        @DisplayName("Debe retornar reporte propio")
        void debeRetornarReportePropio() {
            when(reportRepository.findById(1L)).thenReturn(Optional.of(report));

            ReportResponse result = reportService.getById(1L, 10L);

            assertThat(result.id()).isEqualTo(1L);
        }

        @Test
        @DisplayName("Debe prohibir acceso a reporte ajeno")
        void debeProhibirReporteAjeno() {
            when(reportRepository.findById(1L)).thenReturn(Optional.of(report));

            assertThatThrownBy(() -> reportService.getById(1L, 99L))
                    .isInstanceOf(NexoException.class)
                    .hasMessageContaining("acceso");
        }
    }

    @Test
    @DisplayName("Debe listar reportes con filtros administrativos")
    void debeListarConFiltros() {
        when(reportRepository.findFiltered(ReportStatus.PENDIENTE, ReportType.OTRO)).thenReturn(List.of(report));

        List<ReportResponse> result = reportService.listAll(ReportStatus.PENDIENTE, ReportType.OTRO);

        assertThat(result).hasSize(1);
        verify(reportRepository).findFiltered(ReportStatus.PENDIENTE, ReportType.OTRO);
    }

    @Test
    @DisplayName("Debe actualizar estado y resolver fecha cuando finaliza")
    void debeActualizarEstadoResuelto() {
        when(reportRepository.findById(1L)).thenReturn(Optional.of(report));
        when(reportRepository.save(report)).thenReturn(report);

        ReportResponse result = reportService.updateStatus(1L, new UpdateReportStatusRequest(ReportStatus.RESUELTO));

        assertThat(result.status()).isEqualTo("RESUELTO");
        assertThat(report.getResolvedAt()).isNotNull();
    }
}
