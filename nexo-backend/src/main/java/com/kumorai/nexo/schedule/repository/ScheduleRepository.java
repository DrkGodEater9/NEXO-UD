package com.kumorai.nexo.schedule.repository;

import com.kumorai.nexo.schedule.entity.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

    // Horarios del usuario ordenados por fecha de creación descendente
    List<Schedule> findByUserIdOrderByCreatedAtDesc(Long userId);

    // Ownership check: si retorna vacío → forbidden (DS-04)
    Optional<Schedule> findByIdAndUserId(Long id, Long userId);

    // Carga horario con bloques en un solo query para evitar N+1 (ScheduleExportService — DS-05)
    @Query("""
            SELECT s FROM Schedule s
            LEFT JOIN FETCH s.blocks
            WHERE s.id = :id AND s.userId = :userId
            """)
    Optional<Schedule> findByIdAndUserIdWithBlocks(
            @Param("id") Long id,
            @Param("userId") Long userId);
}
