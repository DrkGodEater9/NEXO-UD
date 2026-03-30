package com.kumorai.nexo.content.service;

import com.kumorai.nexo.content.dto.CalendarEventRequest;
import com.kumorai.nexo.content.dto.CalendarEventResponse;
import com.kumorai.nexo.content.entity.CalendarEventType;

import java.time.LocalDate;
import java.util.List;

public interface CalendarEventService {
    List<CalendarEventResponse> listAll(LocalDate from, LocalDate to, CalendarEventType eventType);
    CalendarEventResponse getById(Long id);
    CalendarEventResponse create(CalendarEventRequest request, Long createdBy);
    CalendarEventResponse update(Long id, CalendarEventRequest request);
    void delete(Long id);
}
