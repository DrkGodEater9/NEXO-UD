package com.kumorai.nexo.campus.service;

import com.kumorai.nexo.campus.dto.CampusResponse;
import com.kumorai.nexo.campus.dto.ClassroomResponse;
import com.kumorai.nexo.campus.entity.Campus;
import com.kumorai.nexo.campus.entity.Classroom;
import com.kumorai.nexo.campus.repository.CampusRepository;
import com.kumorai.nexo.shared.exception.NexoException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CampusServiceImpl implements CampusService {

    private final CampusRepository campusRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CampusResponse> listAll(String faculty) {
        List<Campus> campuses = (faculty != null && !faculty.isBlank())
                ? campusRepository.findByFacultyOrderByNameAsc(faculty)
                : campusRepository.findAllByOrderByFacultyAscNameAsc();
        return campuses.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CampusResponse getById(Long id) {
        return toResponse(campusRepository.findById(id)
                .orElseThrow(() -> NexoException.notFound("Sede no encontrada")));
    }

    // ── Mappers ──────────────────────────────────────────────────────────────

    private CampusResponse toResponse(Campus campus) {
        return new CampusResponse(
                campus.getId(),
                campus.getName(),
                campus.getAddress(),
                campus.getFaculty(),
                campus.getLatitude(),
                campus.getLongitude(),
                campus.getMapUrl(),
                campus.getClassrooms().stream().map(this::toClassroomResponse).toList()
        );
    }

    private ClassroomResponse toClassroomResponse(Classroom classroom) {
        return new ClassroomResponse(
                classroom.getId(),
                classroom.getName(),
                classroom.getBuilding(),
                classroom.getFloor(),
                classroom.isLab(),
                classroom.getPhotos().stream()
                        .map(p -> p.getPhotoUrl())
                        .toList()
        );
    }
}
