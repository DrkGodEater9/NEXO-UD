package com.kumorai.nexo.campus.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "classrooms")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Classroom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String building;

    private String floor;

    @Builder.Default
    @Column(nullable = false)
    private boolean isLab = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campus_id", nullable = false)
    private Campus campus;

    @Builder.Default
    @OneToMany(mappedBy = "classroom", fetch = FetchType.LAZY)
    private List<ClassroomPhoto> photos = new ArrayList<>();
}
