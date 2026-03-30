package com.kumorai.nexo.schedule.service;

import com.kumorai.nexo.schedule.dto.ScheduleBlockRequest;
import com.kumorai.nexo.schedule.dto.ScheduleBlockResponse;
import com.kumorai.nexo.schedule.dto.ScheduleRequest;
import com.kumorai.nexo.schedule.dto.ScheduleResponse;
import com.kumorai.nexo.schedule.entity.Schedule;
import com.kumorai.nexo.schedule.entity.ScheduleBlock;
import com.kumorai.nexo.schedule.repository.ScheduleBlockRepository;
import com.kumorai.nexo.schedule.repository.ScheduleRepository;
import com.kumorai.nexo.shared.exception.NexoException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ScheduleServiceImpl implements ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final ScheduleBlockRepository scheduleBlockRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ScheduleResponse> listByUser(Long userId) {
        return scheduleRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ScheduleResponse getById(Long scheduleId, Long userId) {
        return toResponse(findOwned(scheduleId, userId));
    }

    @Override
    @Transactional
    public ScheduleResponse create(ScheduleRequest request, Long userId) {
        Schedule schedule = Schedule.builder()
                .userId(userId)
                .name(request.name())
                .semester(request.semester())
                .notes(request.notes())
                .build();
        Schedule saved = scheduleRepository.save(schedule);
        saveBlocks(saved, request.blocks());
        return toResponse(scheduleRepository.save(saved));
    }

    @Override
    @Transactional
    public ScheduleResponse update(Long scheduleId, Long userId, ScheduleRequest request) {
        Schedule schedule = findOwned(scheduleId, userId);
        schedule.setName(request.name());
        schedule.setSemester(request.semester());
        schedule.setNotes(request.notes());
        scheduleBlockRepository.deleteByScheduleId(scheduleId);
        saveBlocks(schedule, request.blocks());
        return toResponse(scheduleRepository.save(schedule));
    }

    @Override
    @Transactional
    public void delete(Long scheduleId, Long userId) {
        scheduleRepository.delete(findOwned(scheduleId, userId));
    }

    @Override
    @Transactional
    public ScheduleResponse setArchived(Long scheduleId, Long userId, boolean archived) {
        Schedule schedule = findOwned(scheduleId, userId);
        schedule.setArchived(archived);
        return toResponse(scheduleRepository.save(schedule));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Schedule findOwned(Long scheduleId, Long userId) {
        return scheduleRepository.findByIdAndUserId(scheduleId, userId)
                .orElseThrow(() -> NexoException.notFound("Horario no encontrado"));
    }

    private void saveBlocks(Schedule schedule, List<ScheduleBlockRequest> blockRequests) {
        if (blockRequests == null || blockRequests.isEmpty()) return;
        List<ScheduleBlock> blocks = blockRequests.stream()
                .map(req -> ScheduleBlock.builder()
                        .schedule(schedule)
                        .groupId(req.groupId())
                        .subjectId(req.subjectId())
                        .color(req.color())
                        .manual(req.manual())
                        .manualLabel(req.manualLabel())
                        .manualDay(req.manualDay())
                        .manualStartTime(req.manualStartTime())
                        .manualEndTime(req.manualEndTime())
                        .build())
                .toList();
        scheduleBlockRepository.saveAll(blocks);
        int totalCredits = (int) blockRequests.stream()
                .filter(b -> !b.manual())
                .count();
        schedule.setTotalCredits(totalCredits);
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
