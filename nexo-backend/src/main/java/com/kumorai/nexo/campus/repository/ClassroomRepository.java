package com.kumorai.nexo.campus.repository;

import com.kumorai.nexo.campus.entity.Classroom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClassroomRepository extends JpaRepository<Classroom, Long> {

    List<Classroom> findByCampusId(Long campusId);

    // Garantiza que el aula pertenece a la sede indicada en la URL (evita acceso cruzado)
    Optional<Classroom> findByIdAndCampusId(Long id, Long campusId);

    // Verifica dependencias antes de eliminar una sede
    boolean existsByCampusId(Long campusId);
}
