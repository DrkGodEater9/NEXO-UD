package com.kumorai.nexo.academic.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Materia perteneciente al catálogo oficial del plan de estudios.
 * Independiente de la entidad Subject (ligada al extractor de horarios).
 * Se utiliza exclusivamente para el seguimiento de avance académico del estudiante.
 */
@Entity
@Table(
        name = "curriculum_subjects",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_curriculum_subject_code_plan",
                columnNames = {"codigo", "study_plan_id"}
        )
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CurriculumSubject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Código oficial de la materia según el plan de estudios (ej: "2016202")
    @Column(nullable = false)
    private String codigo;

    @Column(nullable = false)
    private String nombre;

    // Número de créditos académicos
    @Column(nullable = false)
    private int credits;

    // Semestre sugerido dentro de la malla curricular (1-10); puede ser nulo si no aplica
    private Integer semester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "study_plan_id", nullable = false)
    private StudyPlan studyPlan;
}
