package com.kumorai.nexo.content.service;

import com.kumorai.nexo.content.dto.AnnouncementRequest;
import com.kumorai.nexo.content.dto.AnnouncementResponse;
import com.kumorai.nexo.content.entity.AnnouncementScope;
import com.kumorai.nexo.content.entity.AnnouncementType;

import java.util.List;

public interface AnnouncementService {
    List<AnnouncementResponse> listAll(AnnouncementScope scope, AnnouncementType type, String faculty);
    AnnouncementResponse getById(Long id);
    AnnouncementResponse create(AnnouncementRequest request, Long createdBy);
    AnnouncementResponse update(Long id, AnnouncementRequest request);
    void delete(Long id);
}
