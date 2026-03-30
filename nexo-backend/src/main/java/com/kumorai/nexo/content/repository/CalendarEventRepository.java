package com.kumorai.nexo.content.repository;

import com.kumorai.nexo.content.entity.CalendarEvent;
import com.kumorai.nexo.content.entity.CalendarEventType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {

    // Filtrado por rango de fechas y tipo, todos opcionales (DS-06 categoría "Calendario")
    @Query("""
            SELECT c FROM CalendarEvent c
            WHERE (:from IS NULL OR c.startDate >= :from)
            AND (:to IS NULL OR c.startDate <= :to)
            AND (:eventType IS NULL OR c.eventType = :eventType)
            ORDER BY c.startDate ASC
            """)
    List<CalendarEvent> findFiltered(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("eventType") CalendarEventType eventType);
}
