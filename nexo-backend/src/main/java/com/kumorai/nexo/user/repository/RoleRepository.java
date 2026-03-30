package com.kumorai.nexo.user.repository;

import com.kumorai.nexo.user.entity.Role;
import com.kumorai.nexo.user.entity.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoleRepository extends JpaRepository<Role, Long> {

    List<Role> findByUserId(Long userId);

    boolean existsByUserIdAndRoleName(Long userId, RoleName roleName);

    // Para impedir revocar el último rol de un usuario
    long countByUserId(Long userId);
}
