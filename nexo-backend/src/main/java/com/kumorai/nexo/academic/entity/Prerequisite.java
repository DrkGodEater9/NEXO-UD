package com.kumorai.nexo.academic.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "prerequisites")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Prerequisite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long prerequisiteSubjectId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;
}
