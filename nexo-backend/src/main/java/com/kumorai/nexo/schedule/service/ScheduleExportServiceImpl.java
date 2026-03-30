package com.kumorai.nexo.schedule.service;

import com.kumorai.nexo.schedule.dto.ScheduleBlockResponse;
import com.kumorai.nexo.schedule.dto.ScheduleResponse;
import com.kumorai.nexo.schedule.entity.Schedule;
import com.kumorai.nexo.schedule.entity.ScheduleBlock;
import com.kumorai.nexo.schedule.repository.ScheduleRepository;
import com.kumorai.nexo.shared.exception.NexoException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ScheduleExportServiceImpl implements ScheduleExportService {

    private final ScheduleRepository scheduleRepository;

    @Override
    @Transactional(readOnly = true)
    public ScheduleResponse getWithBlocks(Long scheduleId, Long userId) {
        Schedule schedule = scheduleRepository.findByIdAndUserIdWithBlocks(scheduleId, userId)
                .orElseThrow(() -> NexoException.notFound("Horario no encontrado"));
        return toResponse(schedule);
    }

    private ScheduleResponse toResponse(Schedule schedule) {
        return new ScheduleResponse(
                schedule.getId(),
                schedule.getUserId(),
                schedule.getName(),
                schedule.getSemester(),
                schedule.getNotes(),
                schedule.getTotalCredits(),
                schedule.isArchived(),
                schedule.getCreatedAt(),
                schedule.getUpdatedAt(),
                schedule.getBlocks().stream().map(this::toBlockResponse).toList()
        );
    }

    private ScheduleBlockResponse toBlockResponse(ScheduleBlock block) {
        return new ScheduleBlockResponse(
                block.getId(),
                block.getGroupId(),
                block.getSubjectId(),
                block.getColor(),
                block.isManual(),
                block.getManualLabel(),
                block.getManualDay() != null ? block.getManualDay().name() : null,
                block.getManualStartTime(),
                block.getManualEndTime()
        );
    }
}
