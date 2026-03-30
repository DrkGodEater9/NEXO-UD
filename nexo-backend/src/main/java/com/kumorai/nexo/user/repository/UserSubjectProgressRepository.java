package com.kumorai.nexo.user.repository;

import com.kumorai.nexo.user.entity.SubjectStatus;
import com.kumorai.nexo.user.entity.UserSubjectProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserSubjectProgressRepository extends JpaRepository<UserSubjectProgress, Long> {

    List<UserSubjectProgress> findByAcademicProgressId(Long academicProgressId);

    Optional<UserSubjectProgress> findByAcademicProgressIdAndCurriculumSubjectId(
            Long academicProgressId, Long curriculumSubjectId);

    // Ownership + target check al actualizar estado de una materia
    Optional<UserSubjectProgress> findByIdAndAcademicProgressId(Long id, Long academicProgressId);

    // Suma de créditos por estado — query central de getSummary() (StudyProgressService)
    @Query("""
            SELECT COALESCE(SUM(cs.credits), 0)
            FROM UserSubjectProgress usp
            JOIN usp.curriculumSubject cs
            WHERE usp.academicProgress.id = :progressId
            AND usp.status = :status
            """)
    int sumCreditsByProgressIdAndStatus(
            @Param("progressId") Long progressId,
            @Param("status") SubjectStatus status);

    // Protege contra la eliminación de CurriculumSubject con progreso registrado
    boolean existsByCurriculumSubjectId(Long curriculumSubjectId);
}
