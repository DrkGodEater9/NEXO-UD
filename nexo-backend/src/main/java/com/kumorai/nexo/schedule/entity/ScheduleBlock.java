package com.kumorai.nexo.schedule.entity;

import com.kumorai.nexo.academic.entity.DayOfWeek;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;

@Entity
@Table(name = "schedule_blocks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long groupId;

    private Long subjectId;

    private String color;

    @Builder.Default
    @Column(nullable = false)
    private boolean manual = false;

    private String manualLabel;

    @Enumerated(EnumType.STRING)
    private DayOfWeek manualDay;

    private LocalTime manualStartTime;

    private LocalTime manualEndTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id", nullable = false)
    private Schedule schedule;
}
