package com.kumorai.nexo.academic.repository;

import com.kumorai.nexo.academic.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SubjectRepository extends JpaRepository<Subject, Long> {

    List<Subject> findByStudyPlanId(Long studyPlanId);

    // Detectar duplicados al procesar el JSON del extractor (AcademicOfferService.upload)
    Optional<Subject> findByCodigoAndStudyPlanId(String codigo, Long studyPlanId);

    // Consulta pública de oferta activa con studyPlanId opcional (DS-01, DS-04)
    @Query("""
            SELECT DISTINCT s FROM Subject s
            JOIN s.grupos g
            WHERE g.academicOffer.id = :offerId
            AND (:studyPlanId IS NULL OR s.studyPlan.id = :studyPlanId)
            ORDER BY s.nombre
            """)
    List<Subject> findByOfferIdAndOptionalStudyPlan(
            @Param("offerId") Long offerId,
            @Param("studyPlanId") Long studyPlanId);
}
