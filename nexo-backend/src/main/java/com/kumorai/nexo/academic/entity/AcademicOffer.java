package com.kumorai.nexo.academic.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "academic_offers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AcademicOffer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String semester;

    @Column(nullable = false, updatable = false)
    private LocalDateTime uploadedAt;

    @Column(nullable = false)
    private Long uploadedBy;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = false;

    @PrePersist
    private void prePersist() {
        this.uploadedAt = LocalDateTime.now();
    }
}
