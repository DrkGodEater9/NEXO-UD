package com.kumorai.nexo.academic.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "study_plans")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudyPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Código numérico de la carrera (campo "carrera_codigo" en el JSON del extractor)
    @Column(nullable = false, unique = true)
    private String codigoPlan;

    // Nombre completo de la carrera (campo "carrera")
    @Column(nullable = false)
    private String nombre;

    // Nombre de la facultad (campo "facultad")
    @Column(nullable = false)
    private String facultad;

    @Builder.Default
    @OneToMany(mappedBy = "studyPlan", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Subject> subjects = new ArrayList<>();
}
