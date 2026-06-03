package com.impactledger.infrastructure.persistence.repository;

import com.impactledger.domain.entity.UserType;
import com.impactledger.infrastructure.persistence.entity.UserJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserJpaRepository extends JpaRepository<UserJpaEntity, UUID> {
    Optional<UserJpaEntity> findByAddress(String address);
    List<UserJpaEntity> findByUserType(UserType userType);
    boolean existsByAddress(String address);
}