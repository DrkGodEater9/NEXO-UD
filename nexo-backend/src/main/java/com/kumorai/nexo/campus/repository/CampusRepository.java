package com.kumorai.nexo.campus.repository;

import com.kumorai.nexo.campus.entity.Campus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CampusRepository extends JpaRepository<Campus, Long> {

    // Con filtro de facultad (DS-06 categoría "Sede", DS-10)
    List<Campus> findByFacultyOrderByNameAsc(String faculty);

    // Sin filtro — todas las sedes
    List<Campus> findAllByOrderByFacultyAscNameAsc();
}
