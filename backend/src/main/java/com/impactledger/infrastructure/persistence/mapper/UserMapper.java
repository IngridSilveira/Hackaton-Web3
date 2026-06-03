package com.impactledger.infrastructure.persistence.mapper;

import com.impactledger.domain.entity.User;
import com.impactledger.infrastructure.persistence.entity.UserJpaEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper bidirecional entre entidade de domínio e entidade JPA.
 * toDomain() constrói o User completamente via builder —
 * sem mutação após a construção (violação de imutabilidade resolvida).
 */
@Component
public class UserMapper {

    public User toDomain(UserJpaEntity entity) {
        return User.builder()
                .address(entity.getAddress())
                .username(entity.getUsername())
                .userType(entity.getUserType())
                .txHash(entity.getTxHash())
                .nonce(entity.getNonce())       // nonce incluído no builder
                .createdAt(entity.getCreatedAt())
                .build();
    }

    public UserJpaEntity toJpaEntity(User user) {
        return UserJpaEntity.builder()
                .address(user.getAddress())
                .username(user.getUsername())
                .userType(user.getUserType())
                .txHash(user.getTxHash())
                .nonce(user.getNonce())
                .build();
    }

    public void updateJpaEntity(UserJpaEntity entity, User user) {
        entity.setNonce(user.getNonce());
    }
}
