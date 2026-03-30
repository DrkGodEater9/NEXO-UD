package com.kumorai.nexo.academic.repository;

import com.kumorai.nexo.academic.entity.TimeBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TimeBlockRepository extends JpaRepository<TimeBlock, Long> {

    List<TimeBlock> findBySubjectGroupId(Long subjectGroupId);

    // Elimina todos los bloques asociados a una oferta académica antes de borrarla
    @Modifying
    @Query("""
            DELETE FROM TimeBlock tb
            WHERE tb.subjectGroup.id IN (
                SELECT g.id FROM SubjectGroup g WHERE g.academicOffer.id = :offerId
            )
            """)
    void deleteByAcademicOfferId(@Param("offerId") Long offerId);
}
