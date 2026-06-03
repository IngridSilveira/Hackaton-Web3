package com.impactledger.infrastructure.persistence.adapter;

import com.impactledger.domain.entity.User;
import com.impactledger.domain.entity.UserType;
import com.impactledger.domain.port.out.UserRepositoryPort;
import com.impactledger.infrastructure.persistence.entity.UserJpaEntity;
import com.impactledger.infrastructure.persistence.mapper.UserMapper;
import com.impactledger.infrastructure.persistence.repository.UserJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * Adaptador que implementa UserRepositoryPort via Spring Data JPA.
 * Cada método tem responsabilidade única — nenhum efeito colateral em lambdas.
 */
@Component
@RequiredArgsConstructor
public class UserRepositoryAdapter implements UserRepositoryPort {

    private final UserJpaRepository jpaRepository;
    private final UserMapper        mapper;

    @Override
    public User save(User user) {
        var entity = resolveEntityForSave(user);
        return mapper.toDomain(jpaRepository.save(entity));
    }

    @Override
    public Optional<User> findByAddress(String address) {
        return jpaRepository.findByAddress(address).map(mapper::toDomain);
    }

    @Override
    public List<User> findAllByType(UserType type) {
        return jpaRepository.findByUserType(type).stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public boolean existsByAddress(String address) {
        return jpaRepository.existsByAddress(address);
    }

    /**
     * Se o usuário já existe, atualiza a entidade JPA existente (preserva ID e auditoria).
     * Se não existe, cria uma nova entidade a partir do domínio.
     */
    private UserJpaEntity resolveEntityForSave(User user) {
        return jpaRepository.findByAddress(user.getAddress())
                .map(existing -> applyUpdates(existing, user))
                .orElseGet(() -> mapper.toJpaEntity(user));
    }

    private UserJpaEntity applyUpdates(UserJpaEntity existing, User user) {
        mapper.updateJpaEntity(existing, user);
        return existing;
    }
}
