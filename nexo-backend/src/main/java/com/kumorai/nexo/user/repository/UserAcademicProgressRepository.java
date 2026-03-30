package com.kumorai.nexo.user.repository;

import com.kumorai.nexo.user.entity.UserAcademicProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserAcademicProgressRepository extends JpaRepository<UserAcademicProgress, Long> {

    // Todas las carreras de un usuario (soporte a doble titulación)
    List<UserAcademicProgress> findByUserId(Long userId);

    // Valida constraint único (user, studyPlan) en StudyProgressService.enroll()
    boolean existsByUserIdAndStudyPlanId(Long userId, Long studyPlanId);

    // Ownership check al actualizar o consultar el avance
    Optional<UserAcademicProgress> findByIdAndUserId(Long id, Long userId);
}
