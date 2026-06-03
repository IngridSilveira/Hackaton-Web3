package com.impactledger.infrastructure.persistence;

import com.impactledger.domain.entity.User;
import com.impactledger.domain.entity.UserType;
import com.impactledger.infrastructure.persistence.entity.UserJpaEntity;
import com.impactledger.infrastructure.persistence.mapper.UserMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

class UserMapperTest {

    private static final String ADDRESS  = "0xabcdef1234567890abcdef1234567890abcdef12";
    private static final String USERNAME = "MapperTestUser";
    private static final String NONCE    = "test-nonce-xyz";
    private static final String TX_HASH  = "0xtxhash123";

    private UserMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new UserMapper();
    }

    @Test
    void shouldMapJpaEntityToDomainPreservingAllFields() {
        var entity = buildJpaEntity();

        var domain = mapper.toDomain(entity);

        assertThat(domain.getAddress()).isEqualTo(ADDRESS);
        assertThat(domain.getUsername()).isEqualTo(USERNAME);
        assertThat(domain.getUserType()).isEqualTo(UserType.ONG);
        assertThat(domain.getTxHash()).isEqualTo(TX_HASH);
        assertThat(domain.getNonce()).isEqualTo(NONCE);
    }

    @Test
    void shouldMapDomainToJpaEntityPreservingAllFields() {
        var domain = buildDomainUser();

        var entity = mapper.toJpaEntity(domain);

        assertThat(entity.getAddress()).isEqualTo(ADDRESS);
        assertThat(entity.getUsername()).isEqualTo(USERNAME);
        assertThat(entity.getUserType()).isEqualTo(UserType.ONG);
        assertThat(entity.getNonce()).isEqualTo(NONCE);
    }

    @Test
    void shouldUpdateOnlyNonceOnExistingEntity() {
        var entity    = buildJpaEntity();
        var newNonce  = "new-nonce-after-auth";
        var updatedUser = User.builder()
                .address(ADDRESS)
                .username(USERNAME)
                .userType(UserType.ONG)
                .nonce(null)
                .build();

        mapper.updateJpaEntity(entity, updatedUser);

        assertThat(entity.getNonce()).isNull();
        assertThat(entity.getAddress()).isEqualTo(ADDRESS); // não alterado
        assertThat(entity.getUsername()).isEqualTo(USERNAME); // não alterado
    }

    @Test
    void shouldPreserveNullNonceWhenMappingToDomain() {
        var entity = buildJpaEntity();
        entity.setNonce(null);

        var domain = mapper.toDomain(entity);

        assertThat(domain.getNonce()).isNull();
    }

    @Test
    void shouldPreserveNullNonceWhenMappingToJpa() {
        var domain = User.builder()
                .address(ADDRESS)
                .username(USERNAME)
                .userType(UserType.ONG)
                .nonce(null)
                .build();

        var entity = mapper.toJpaEntity(domain);

        assertThat(entity.getNonce()).isNull();
    }

    private UserJpaEntity buildJpaEntity() {
        return UserJpaEntity.builder()
                .id(UUID.randomUUID())
                .address(ADDRESS)
                .username(USERNAME)
                .userType(UserType.ONG)
                .txHash(TX_HASH)
                .nonce(NONCE)
                .createdAt(Instant.now())
                .build();
    }

    private User buildDomainUser() {
        var user = User.builder()
                .address(ADDRESS)
                .username(USERNAME)
                .userType(UserType.ONG)
                .txHash(TX_HASH)
                .nonce(NONCE)
                .build();
        return user;
    }
}
