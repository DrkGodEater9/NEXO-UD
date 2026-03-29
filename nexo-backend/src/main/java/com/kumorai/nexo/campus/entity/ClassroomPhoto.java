package com.kumorai.nexo.campus.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "classroom_photos")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassroomPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String photoUrl;

    @Column(nullable = false)
    private Long uploadedBy;

    @Column(nullable = false, updatable = false)
    private LocalDateTime uploadedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id", nullable = false)
    private Classroom classroom;

    @PrePersist
    private void prePersist() {
        this.uploadedAt = LocalDateTime.now();
    }
}
