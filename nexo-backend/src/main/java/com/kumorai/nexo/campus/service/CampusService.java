package com.kumorai.nexo.campus.service;

import com.kumorai.nexo.campus.dto.CampusResponse;

import java.util.List;

public interface CampusService {
    List<CampusResponse> listAll(String faculty);
    CampusResponse getById(Long id);
}
