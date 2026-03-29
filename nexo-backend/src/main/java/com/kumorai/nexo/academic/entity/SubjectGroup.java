package com.kumorai.nexo.academic.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "subject_groups")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubjectGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Código del grupo tal como viene del PDF (ej: "020-81", "IMPL-1")
    // Campo "grupo" en el JSON del extractor
    @Column(nullable = false)
    private String grupoCode;

    // Número de estudiantes inscritos (campo "inscritos")
    @Column(nullable = false)
    private int inscritos;

    // Nombre del docente principal (campo "docente"; "POR ASIGNAR" si no está definido)
    @Column(nullable = false)
    private String docente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_offer_id")
    private AcademicOffer academicOffer;

    @Builder.Default
    @OneToMany(mappedBy = "subjectGroup", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<TimeBlock> horarios = new ArrayList<>();
}
