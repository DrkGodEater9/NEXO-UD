package com.kumorai.nexo.schedule.repository;

import com.kumorai.nexo.schedule.entity.ScheduleBlock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ScheduleBlockRepository extends JpaRepository<ScheduleBlock, Long> {

    List<ScheduleBlock> findByScheduleId(Long scheduleId);

    // Elimina todos los bloques de un horario antes de reemplazarlos en un update (DS-04)
    void deleteByScheduleId(Long scheduleId);
}
