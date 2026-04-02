package com.kumorai.nexo.campus.service;

import com.kumorai.nexo.campus.dto.CampusRequest;
import com.kumorai.nexo.campus.dto.CampusResponse;
import com.kumorai.nexo.campus.dto.ClassroomRequest;
import com.kumorai.nexo.campus.dto.ClassroomResponse;

import java.util.List;

public interface CampusService {
    List<CampusResponse> listAll(String faculty);
    CampusResponse getById(Long id);
    CampusResponse create(CampusRequest request);
    CampusResponse update(Long id, CampusRequest request);
    void delete(Long id);

    List<ClassroomResponse> listClassrooms(Long campusId);
    ClassroomResponse addClassroom(Long campusId, ClassroomRequest request);
    ClassroomResponse updateClassroom(Long campusId, Long classroomId, ClassroomRequest request);
    void deleteClassroom(Long campusId, Long classroomId);

    ClassroomResponse addPhoto(Long campusId, Long classroomId, String photoUrl, Long uploadedBy);
    void deletePhoto(Long campusId, Long classroomId, Long photoId);
}
