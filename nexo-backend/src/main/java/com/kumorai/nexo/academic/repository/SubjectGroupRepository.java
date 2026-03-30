package com.kumorai.nexo.academic.repository;

import com.kumorai.nexo.academic.entity.SubjectGroup;
import com.kumorai.nexo.academic.entity.TimeBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SubjectGroupRepository extends JpaRepository<SubjectGroup, Long> {

    List<SubjectGroup> findBySubjectId(Long subjectId);

    List<SubjectGroup> findByAcademicOfferId(Long academicOfferId);

    // Carga todos los TimeBlocks de los grupos seleccionados para validar cruces (DS-01)
    @Query("""
            SELECT tb FROM TimeBlock tb
            WHERE tb.subjectGroup.id IN :groupIds
            ORDER BY tb.dia, tb.horaInicio
            """)
    List<TimeBlock> findTimeBlocksByGroupIds(@Param("groupIds") List<Long> groupIds);
}
