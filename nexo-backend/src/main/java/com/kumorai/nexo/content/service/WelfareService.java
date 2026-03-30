package com.kumorai.nexo.content.service;

import com.kumorai.nexo.content.dto.WelfareContentRequest;
import com.kumorai.nexo.content.dto.WelfareContentResponse;
import com.kumorai.nexo.content.entity.WelfareCategory;

import java.util.List;

public interface WelfareService {
    List<WelfareContentResponse> listAll(WelfareCategory category);
    WelfareContentResponse getById(Long id);
    WelfareContentResponse create(WelfareContentRequest request, Long createdBy);
    WelfareContentResponse update(Long id, WelfareContentRequest request);
    void delete(Long id);
}
