package com.kumorai.nexo.user.repository;

import com.kumorai.nexo.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByNickname(String nickname);

    boolean existsByStudentCode(String studentCode);

    // Listado paginado para el administrador (DS-11)
    Page<User> findByEmailContainingIgnoreCase(String email, Pageable pageable);
}
