package com.kumorai.nexo.academic.repository;

import com.kumorai.nexo.academic.entity.Semester;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface SemesterRepository extends JpaRepository<Semester, Long> {

    Optional<Semester> findByActiveTrue();

    Optional<Semester> findByName(String name);

    List<Semester> findAllByOrderByCreatedAtDesc();

    @Modifying
    @Query("UPDATE Semester s SET s.active = false")
    void deactivateAll();
}
