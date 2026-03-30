package com.kumorai.nexo.report.repository;

import com.kumorai.nexo.report.entity.Report;
import com.kumorai.nexo.report.entity.ReportStatus;
import com.kumorai.nexo.report.entity.ReportType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {

    // Reportes propios del estudiante ordenados por fecha (DS-07)
    List<Report> findByUserIdOrderByCreatedAtDesc(Long userId);

    // Listado administrativo con filtros opcionales por estado y tipo (DS-11)
    @Query("""
            SELECT r FROM Report r
            WHERE (:status IS NULL OR r.status = :status)
            AND (:reportType IS NULL OR r.reportType = :reportType)
            ORDER BY r.createdAt DESC
            """)
    List<Report> findFiltered(
            @Param("status") ReportStatus status,
            @Param("reportType") ReportType reportType);
}
