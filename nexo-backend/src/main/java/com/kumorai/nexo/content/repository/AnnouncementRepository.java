package com.kumorai.nexo.content.repository;

import com.kumorai.nexo.content.entity.Announcement;
import com.kumorai.nexo.content.entity.AnnouncementScope;
import com.kumorai.nexo.content.entity.AnnouncementType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    // Filtrado con parámetros opcionales (DS-08, DS-06)
    @Query("""
            SELECT a FROM Announcement a
            WHERE (:scope IS NULL OR a.scope = :scope)
            AND (:type IS NULL OR a.type = :type)
            AND (:faculty IS NULL OR a.faculty = :faculty)
            ORDER BY a.createdAt DESC
            """)
    List<Announcement> findFiltered(
            @Param("scope") AnnouncementScope scope,
            @Param("type") AnnouncementType type,
            @Param("faculty") String faculty);
}
