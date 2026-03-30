package com.kumorai.nexo.academic.repository;

import com.kumorai.nexo.academic.entity.AcademicOffer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface AcademicOfferRepository extends JpaRepository<AcademicOffer, Long> {

    // Oferta activa actual — consulta más frecuente del sistema
    Optional<AcademicOffer> findByActiveTrue();

    // Desactiva todas las ofertas antes de activar una nueva (se usa en una transacción)
    @Modifying
    @Query("UPDATE AcademicOffer a SET a.active = false")
    void deactivateAll();
}
