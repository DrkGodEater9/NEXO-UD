package com.kumorai.nexo.report.service;

import com.kumorai.nexo.report.dto.ReportRequest;
import com.kumorai.nexo.report.dto.ReportResponse;
import com.kumorai.nexo.report.dto.UpdateReportStatusRequest;
import com.kumorai.nexo.report.entity.Report;
import com.kumorai.nexo.report.entity.ReportStatus;
import com.kumorai.nexo.report.entity.ReportType;
import com.kumorai.nexo.report.repository.ReportRepository;
import com.kumorai.nexo.shared.exception.NexoException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final ReportRepository reportRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ReportResponse> listByUser(Long userId) {
        return reportRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ReportResponse getById(Long reportId, Long userId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> NexoException.notFound("Reporte no encontrado"));
        if (!report.getUserId().equals(userId)) {
            throw NexoException.forbidden("No tienes acceso a este reporte");
        }
        return toResponse(report);
    }

    @Override
    @Transactional
    public ReportResponse create(ReportRequest request, Long userId) {
        Report report = Report.builder()
                .userId(userId)
                .reportType(request.reportType())
                .description(request.description())
                .evidenceUrl(request.evidenceUrl())
                .build();
        return toResponse(reportRepository.save(report));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReportResponse> listAll(ReportStatus status, ReportType reportType) {
        return reportRepository.findFiltered(status, reportType)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public ReportResponse updateStatus(Long reportId, UpdateReportStatusRequest request) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> NexoException.notFound("Reporte no encontrado"));
        report.setStatus(request.status());
        if (request.status() == ReportStatus.RESUELTO || request.status() == ReportStatus.DESCARTADO) {
            report.setResolvedAt(LocalDateTime.now());
        }
        return toResponse(reportRepository.save(report));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private ReportResponse toResponse(Report report) {
        return new ReportResponse(
                report.getId(),
                report.getUserId(),
                report.getReportType().name(),
                report.getDescription(),
                report.getEvidenceUrl(),
                report.getStatus().name(),
                report.getCreatedAt(),
                report.getResolvedAt()
        );
    }
}
