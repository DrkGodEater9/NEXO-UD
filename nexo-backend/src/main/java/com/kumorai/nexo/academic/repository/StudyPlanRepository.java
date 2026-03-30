package com.kumorai.nexo.academic.repository;

import com.kumorai.nexo.academic.entity.StudyPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface StudyPlanRepository extends JpaRepository<StudyPlan, Long> {

    // Clave del upload del extractor Python: get-or-create por código de carrera
    Optional<StudyPlan> findByCodigoPlan(String codigoPlan);

    boolean existsByCodigoPlan(String codigoPlan);

    // Listado con conteo de créditos curriculares para el panel de administrador (DS-13)
    @Query("""
            SELECT sp FROM StudyPlan sp
            ORDER BY sp.facultad ASC, sp.nombre ASC
            """)
    List<StudyPlan> findAllOrderedByFacultyAndName();
}
