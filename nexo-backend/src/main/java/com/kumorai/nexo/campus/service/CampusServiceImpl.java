package com.kumorai.nexo.campus.service;

import com.kumorai.nexo.campus.dto.CampusRequest;
import com.kumorai.nexo.campus.dto.CampusResponse;
import com.kumorai.nexo.campus.dto.ClassroomRequest;
import com.kumorai.nexo.campus.dto.ClassroomResponse;
import com.kumorai.nexo.campus.entity.Campus;
import com.kumorai.nexo.campus.entity.Classroom;
import com.kumorai.nexo.campus.entity.ClassroomPhoto;
import com.kumorai.nexo.campus.repository.CampusRepository;
import com.kumorai.nexo.campus.repository.ClassroomPhotoRepository;
import com.kumorai.nexo.campus.repository.ClassroomRepository;
import com.kumorai.nexo.shared.exception.NexoException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CampusServiceImpl implements CampusService {

    private final CampusRepository campusRepository;
    private final ClassroomRepository classroomRepository;
    private final ClassroomPhotoRepository photoRepository;

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

    @Override
    @Transactional
    public CampusResponse create(CampusRequest request) {
        Campus campus = Campus.builder()
                .name(request.name())
                .address(request.address())
                .faculty(request.faculty())
                .latitude(request.latitude())
                .longitude(request.longitude())
                .mapUrl(request.mapUrl())
                .build();
        return toResponse(campusRepository.save(campus));
    }

    @Override
    @Transactional
    public CampusResponse update(Long id, CampusRequest request) {
        Campus campus = campusRepository.findById(id)
                .orElseThrow(() -> NexoException.notFound("Sede no encontrada"));
        campus.setName(request.name());
        campus.setAddress(request.address());
        campus.setFaculty(request.faculty());
        campus.setLatitude(request.latitude());
        campus.setLongitude(request.longitude());
        campus.setMapUrl(request.mapUrl());
        return toResponse(campusRepository.save(campus));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!campusRepository.existsById(id)) {
            throw NexoException.notFound("Sede no encontrada");
        }
        campusRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassroomResponse> listClassrooms(Long campusId) {
        if (!campusRepository.existsById(campusId)) {
            throw NexoException.notFound("Sede no encontrada");
        }
        return classroomRepository.findByCampusId(campusId)
                .stream().map(this::toClassroomResponse).toList();
    }

    @Override
    @Transactional
    public ClassroomResponse addClassroom(Long campusId, ClassroomRequest request) {
        Campus campus = campusRepository.findById(campusId)
                .orElseThrow(() -> NexoException.notFound("Sede no encontrada"));
        Classroom classroom = Classroom.builder()
                .campus(campus)
                .name(request.name())
                .building(request.building())
                .floor(request.floor())
                .isLab(Boolean.TRUE.equals(request.isLab()))
                .build();
        return toClassroomResponse(classroomRepository.save(classroom));
    }

    @Override
    @Transactional
    public ClassroomResponse updateClassroom(Long campusId, Long classroomId, ClassroomRequest request) {
        Classroom classroom = classroomRepository.findByIdAndCampusId(classroomId, campusId)
                .orElseThrow(() -> NexoException.notFound("Salón no encontrado"));
        classroom.setName(request.name());
        classroom.setBuilding(request.building());
        classroom.setFloor(request.floor());
        classroom.setLab(Boolean.TRUE.equals(request.isLab()));
        return toClassroomResponse(classroomRepository.save(classroom));
    }

    @Override
    @Transactional
    public void deleteClassroom(Long campusId, Long classroomId) {
        Classroom classroom = classroomRepository.findByIdAndCampusId(classroomId, campusId)
                .orElseThrow(() -> NexoException.notFound("Salón no encontrado"));
        classroomRepository.delete(classroom);
    }

    @Override
    @Transactional
    public ClassroomResponse addPhoto(Long campusId, Long classroomId, String photoUrl, Long uploadedBy) {
        Classroom classroom = classroomRepository.findByIdAndCampusId(classroomId, campusId)
                .orElseThrow(() -> NexoException.notFound("Salón no encontrado"));
        ClassroomPhoto photo = ClassroomPhoto.builder()
                .classroom(classroom)
                .photoUrl(photoUrl)
                .uploadedBy(uploadedBy)
                .build();
        photoRepository.save(photo);
        return toClassroomResponse(classroomRepository.findById(classroomId).get());
    }

    @Override
    @Transactional
    public void deletePhoto(Long campusId, Long classroomId, Long photoId) {
        classroomRepository.findByIdAndCampusId(classroomId, campusId)
                .orElseThrow(() -> NexoException.notFound("Salón no encontrado"));
        ClassroomPhoto photo = photoRepository.findByIdAndClassroomId(photoId, classroomId)
                .orElseThrow(() -> NexoException.notFound("Foto no encontrada"));
        photoRepository.delete(photo);
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
                        .map(ClassroomPhoto::getPhotoUrl)
                        .toList()
        );
    }
}
