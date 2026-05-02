package com.kumorai.nexo.content.service;

import com.kumorai.nexo.content.dto.AnnouncementRequest;
import com.kumorai.nexo.content.dto.AnnouncementResponse;
import com.kumorai.nexo.content.entity.Announcement;
import com.kumorai.nexo.content.entity.AnnouncementScope;
import com.kumorai.nexo.content.entity.AnnouncementType;
import com.kumorai.nexo.content.repository.AnnouncementRepository;
import com.kumorai.nexo.shared.exception.NexoException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AnnouncementServiceImpl implements AnnouncementService {

    private final AnnouncementRepository announcementRepository;

    @Override
    @Transactional(readOnly = true)
    public List<AnnouncementResponse> listAll(AnnouncementScope scope, AnnouncementType type, String faculty) {
        return announcementRepository.findFiltered(scope, type, faculty)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AnnouncementResponse getById(Long id) {
        return toResponse(find(id));
    }

    @Override
    @Transactional
    public AnnouncementResponse create(AnnouncementRequest request, Long createdBy) {
        Announcement announcement = Announcement.builder()
                .title(request.title())
                .body(request.body())
                .scope(request.scope())
                .type(request.type())
                .faculty(request.faculty())
                .images(request.images())
                .createdBy(createdBy)
                .build();
        return toResponse(announcementRepository.save(announcement));
    }

    @Override
    @Transactional
    public AnnouncementResponse update(Long id, AnnouncementRequest request) {
        Announcement announcement = find(id);
        announcement.setTitle(request.title());
        announcement.setBody(request.body());
        announcement.setScope(request.scope());
        announcement.setType(request.type());
        announcement.setFaculty(request.faculty());
        announcement.setImages(request.images());
        return toResponse(announcementRepository.save(announcement));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        announcementRepository.delete(find(id));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Announcement find(Long id) {
        return announcementRepository.findById(id)
                .orElseThrow(() -> NexoException.notFound("Aviso no encontrado"));
    }

    private AnnouncementResponse toResponse(Announcement a) {
        return new AnnouncementResponse(
                a.getId(),
                a.getTitle(),
                a.getBody(),
                a.getScope().name(),
                a.getType().name(),
                a.getFaculty(),
                a.getImages(),
                a.getCreatedBy(),
                a.getCreatedAt(),
                a.getUpdatedAt()
        );
    }
}
