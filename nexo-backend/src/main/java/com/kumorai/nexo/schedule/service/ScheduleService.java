package com.kumorai.nexo.schedule.service;

import com.kumorai.nexo.schedule.dto.ScheduleRequest;
import com.kumorai.nexo.schedule.dto.ScheduleResponse;

import java.util.List;

public interface ScheduleService {
    List<ScheduleResponse> listByUser(Long userId);
    ScheduleResponse getById(Long scheduleId, Long userId);
    ScheduleResponse create(ScheduleRequest request, Long userId);
    ScheduleResponse update(Long scheduleId, Long userId, ScheduleRequest request);
    void delete(Long scheduleId, Long userId);
    ScheduleResponse setArchived(Long scheduleId, Long userId, boolean archived);
}
