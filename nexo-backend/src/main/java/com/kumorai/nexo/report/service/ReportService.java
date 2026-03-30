package com.kumorai.nexo.report.service;

import com.kumorai.nexo.report.dto.ReportRequest;
import com.kumorai.nexo.report.dto.ReportResponse;
import com.kumorai.nexo.report.dto.UpdateReportStatusRequest;
import com.kumorai.nexo.report.entity.ReportStatus;
import com.kumorai.nexo.report.entity.ReportType;

import java.util.List;

public interface ReportService {
    List<ReportResponse> listByUser(Long userId);
    ReportResponse getById(Long reportId, Long userId);
    ReportResponse create(ReportRequest request, Long userId);
    // Admin operations
    List<ReportResponse> listAll(ReportStatus status, ReportType reportType);
    ReportResponse updateStatus(Long reportId, UpdateReportStatusRequest request);
}
