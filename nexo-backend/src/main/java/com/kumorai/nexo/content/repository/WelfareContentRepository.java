package com.kumorai.nexo.content.repository;

import com.kumorai.nexo.content.entity.WelfareCategory;
import com.kumorai.nexo.content.entity.WelfareContent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WelfareContentRepository extends JpaRepository<WelfareContent, Long> {

    // Con filtro de categoría (DS-09)
    List<WelfareContent> findByCategoryOrderByCreatedAtDesc(WelfareCategory category);

    // Sin filtro — todos los contenidos de bienestar
    List<WelfareContent> findAllByOrderByCreatedAtDesc();
}
