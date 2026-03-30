package com.kumorai.nexo.academic.repository;

import com.kumorai.nexo.academic.entity.CurriculumSubject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CurriculumSubjectRepository extends JpaRepository<CurriculumSubject, Long> {

    List<CurriculumSubject> findByStudyPlanId(Long studyPlanId);

    // Valida constraint único (codigo, study_plan_id) antes de crear (DS-13)
    boolean existsByCodigoAndStudyPlanId(String codigo, Long studyPlanId);

    // Garantiza que el subject pertenece al plan indicado en la URL (evita acceso cruzado)
    Optional<CurriculumSubject> findByIdAndStudyPlanId(Long id, Long studyPlanId);

    // Total de créditos de un plan (para StudyPlanService — no es campo físico en la entidad)
    @Query("""
            SELECT COALESCE(SUM(cs.credits), 0)
            FROM CurriculumSubject cs
            WHERE cs.studyPlan.id = :planId
            """)
    int sumCreditsByStudyPlanId(@Param("planId") Long planId);
}
