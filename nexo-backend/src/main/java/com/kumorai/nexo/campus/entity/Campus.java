package com.kumorai.nexo.campus.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "campuses")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Campus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String address;

    @Column(nullable = false)
    private String faculty;

    private Double latitude;

    private Double longitude;

    private String mapUrl;

    private LocalDateTime updatedAt;

    @Builder.Default
    @OneToMany(mappedBy = "campus", fetch = FetchType.LAZY)
    private List<Classroom> classrooms = new ArrayList<>();

    @PreUpdate
    private void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
