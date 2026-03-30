package com.kumorai.nexo.content.service;

import com.kumorai.nexo.content.dto.CalendarEventRequest;
import com.kumorai.nexo.content.dto.CalendarEventResponse;
import com.kumorai.nexo.content.entity.CalendarEvent;
import com.kumorai.nexo.content.entity.CalendarEventType;
import com.kumorai.nexo.content.repository.CalendarEventRepository;
import com.kumorai.nexo.shared.exception.NexoException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CalendarEventServiceImpl implements CalendarEventService {

    private final CalendarEventRepository calendarEventRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CalendarEventResponse> listAll(LocalDate from, LocalDate to, CalendarEventType eventType) {
        return calendarEventRepository.findFiltered(from, to, eventType)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CalendarEventResponse getById(Long id) {
        return toResponse(find(id));
    }

    @Override
    @Transactional
    public CalendarEventResponse create(CalendarEventRequest request, Long createdBy) {
        CalendarEvent event = CalendarEvent.builder()
                .title(request.title())
                .description(request.description())
                .eventType(request.eventType())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .createdBy(createdBy)
                .build();
        return toResponse(calendarEventRepository.save(event));
    }

    @Override
    @Transactional
    public CalendarEventResponse update(Long id, CalendarEventRequest request) {
        CalendarEvent event = find(id);
        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setEventType(request.eventType());
        event.setStartDate(request.startDate());
        event.setEndDate(request.endDate());
        return toResponse(calendarEventRepository.save(event));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        calendarEventRepository.delete(find(id));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private CalendarEvent find(Long id) {
        return calendarEventRepository.findById(id)
                .orElseThrow(() -> NexoException.notFound("Evento de calendario no encontrado"));
    }

    private CalendarEventResponse toResponse(CalendarEvent e) {
        return new CalendarEventResponse(
                e.getId(),
                e.getTitle(),
                e.getDescription(),
                e.getEventType().name(),
                e.getStartDate(),
                e.getEndDate(),
                e.getCreatedBy()
        );
    }
}
