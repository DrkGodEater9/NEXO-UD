package com.kumorai.nexo.academic.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "time_blocks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimeBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Día en texto normalizado: LUNES, MARTES, MIERCOLES, JUEVES, VIERNES, SABADO, DOMINGO
    // Campo "dia" en el JSON del extractor
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DayOfWeek dia;

    // Hora de inicio en formato entero de 24h (ej: 6 = 6am, 14 = 2pm)
    // Campo "horaInicio" en el JSON del extractor
    @Column(nullable = false)
    private int horaInicio;

    // Hora de fin en formato entero de 24h
    // Campo "horaFin" en el JSON del extractor
    @Column(nullable = false)
    private int horaFin;

    // Texto de ubicación tal como viene del PDF (sede + edificio + salón concatenados)
    // Campo "ubicacion" en el JSON del extractor; puede ser "POR ASIGNAR"
    @Column(nullable = false)
    private String ubicacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_group_id", nullable = false)
    private SubjectGroup subjectGroup;
}
