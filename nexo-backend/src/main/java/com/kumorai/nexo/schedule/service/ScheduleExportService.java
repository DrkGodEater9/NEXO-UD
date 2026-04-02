package com.kumorai.nexo.schedule.service;

import com.kumorai.nexo.schedule.dto.ScheduleResponse;

public interface ScheduleExportService {
    ScheduleResponse getWithBlocks(Long scheduleId, Long userId);
    byte[] generateImage(Long scheduleId, Long userId);
    byte[] generatePdf(Long scheduleId, Long userId);
}
