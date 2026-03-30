package com.kumorai.nexo.user.entity;

import com.kumorai.nexo.academic.entity.CurriculumSubject;
import jakarta.persistence.*;
import lombok.*;

/**
 * Registro del estado de una materia concreta dentro del avance académico de un usuario.
 * Vincula el progreso del usuario (UserAcademicProgress) con una materia del plan (CurriculumSubject).
 */
@Entity
@Table(
        name = "user_subject_progress",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_progress_subject",
                columnNames = {"academic_progress_id", "curriculum_subject_id"}
        )
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSubjectProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_progress_id", nullable = false)
    private UserAcademicProgress academicProgress;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "curriculum_subject_id", nullable = false)
    private CurriculumSubject curriculumSubject;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubjectStatus status = SubjectStatus.PENDIENTE;

    // Calificación final (null mientras no esté APROBADA)
    private Double grade;
}
