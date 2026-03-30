package com.kumorai.nexo.user.entity;

import com.kumorai.nexo.academic.entity.StudyPlan;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Registro de la carrera seleccionada por un usuario y su avance académico.
 * Un usuario puede tener más de un registro para soportar doble titulación.
 */
@Entity
@Table(
        name = "user_academic_progress",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_user_study_plan",
                columnNames = {"user_id", "study_plan_id"}
        )
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAcademicProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "study_plan_id", nullable = false)
    private StudyPlan studyPlan;

    // Fecha en que el usuario seleccionó/registró esta carrera
    @Column(nullable = false, updatable = false)
    private LocalDateTime enrolledAt;

    @Builder.Default
    @OneToMany(mappedBy = "academicProgress", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<UserSubjectProgress> subjectProgressList = new ArrayList<>();

    @PrePersist
    private void prePersist() {
        this.enrolledAt = LocalDateTime.now();
    }
}
