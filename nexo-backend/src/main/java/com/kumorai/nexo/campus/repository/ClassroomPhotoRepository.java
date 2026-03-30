package com.kumorai.nexo.campus.repository;

import com.kumorai.nexo.campus.entity.ClassroomPhoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClassroomPhotoRepository extends JpaRepository<ClassroomPhoto, Long> {

    List<ClassroomPhoto> findByClassroomId(Long classroomId);

    // Garantiza que la foto pertenece al aula indicada en la URL
    Optional<ClassroomPhoto> findByIdAndClassroomId(Long id, Long classroomId);
}
