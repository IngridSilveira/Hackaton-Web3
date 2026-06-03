package com.impactledger.infrastructure.persistence;

import com.impactledger.domain.entity.User;
import com.impactledger.domain.entity.UserType;
import com.impactledger.infrastructure.persistence.adapter.UserRepositoryAdapter;
import com.impactledger.infrastructure.persistence.entity.UserJpaEntity;
import com.impactledger.infrastructure.persistence.mapper.UserMapper;
import com.impactledger.infrastructure.persistence.repository.UserJpaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserRepositoryAdapterTest {

    private static final String ADDRESS  = "0xabcdef1234567890abcdef1234567890abcdef12";
    private static final String USERNAME = "TestUser";

    @Mock private UserJpaRepository jpaRepository;
    @Mock private UserMapper        mapper;

    @InjectMocks private UserRepositoryAdapter adapter;

    private User       domainUser;
    private UserJpaEntity jpaEntity;

    @BeforeEach
    void setUp() {
        domainUser = User.builder()
                .address(ADDRESS)
                .username(USERNAME)
                .userType(UserType.ONG)
                .nonce("test-nonce")
                .build();

        jpaEntity = UserJpaEntity.builder()
                .id(UUID.randomUUID())
                .address(ADDRESS)
                .username(USERNAME)
                .userType(UserType.ONG)
                .createdAt(Instant.now())
                .build();
    }

    @Test
    void save_shouldCreateNewEntityWhenUserDoesNotExist() {
        when(jpaRepository.findByAddress(ADDRESS)).thenReturn(Optional.empty());
        when(mapper.toJpaEntity(domainUser)).thenReturn(jpaEntity);
        when(jpaRepository.save(jpaEntity)).thenReturn(jpaEntity);
        when(mapper.toDomain(jpaEntity)).thenReturn(domainUser);

        adapter.save(domainUser);

        verify(mapper).toJpaEntity(domainUser);
        verify(mapper, never()).updateJpaEntity(any(), any());
    }

    @Test
    void save_shouldUpdateExistingEntityWhenUserAlreadyExists() {
        when(jpaRepository.findByAddress(ADDRESS)).thenReturn(Optional.of(jpaEntity));
        when(jpaRepository.save(jpaEntity)).thenReturn(jpaEntity);
        when(mapper.toDomain(jpaEntity)).thenReturn(domainUser);

        adapter.save(domainUser);

        verify(mapper).updateJpaEntity(jpaEntity, domainUser);
        verify(mapper, never()).toJpaEntity(any());
    }

    @Test
    void save_shouldReturnMappedDomainUser() {
        when(jpaRepository.findByAddress(ADDRESS)).thenReturn(Optional.empty());
        when(mapper.toJpaEntity(domainUser)).thenReturn(jpaEntity);
        when(jpaRepository.save(jpaEntity)).thenReturn(jpaEntity);
        when(mapper.toDomain(jpaEntity)).thenReturn(domainUser);

        var result = adapter.save(domainUser);

        assertThat(result).isEqualTo(domainUser);
    }

    @Test
    void findByAddress_shouldReturnMappedUserWhenFound() {
        when(jpaRepository.findByAddress(ADDRESS)).thenReturn(Optional.of(jpaEntity));
        when(mapper.toDomain(jpaEntity)).thenReturn(domainUser);

        var result = adapter.findByAddress(ADDRESS);

        assertThat(result).isPresent();
        assertThat(result.get().getAddress()).isEqualTo(ADDRESS);
    }

    @Test
    void findByAddress_shouldReturnEmptyWhenNotFound() {
        when(jpaRepository.findByAddress(ADDRESS)).thenReturn(Optional.empty());

        var result = adapter.findByAddress(ADDRESS);

        assertThat(result).isEmpty();
        verify(mapper, never()).toDomain(any());
    }

    @Test
    void findAllByType_shouldReturnMappedListForOng() {
        var jpa2 = UserJpaEntity.builder()
                .address("0xbbbb001234567890abcdef1234567890abcdef12")
                .username("ONG Beta").userType(UserType.ONG)
                .createdAt(Instant.now()).build();

        var user2 = User.builder()
                .address("0xbbbb001234567890abcdef1234567890abcdef12")
                .username("ONG Beta").userType(UserType.ONG).build();

        when(jpaRepository.findByUserType(UserType.ONG)).thenReturn(List.of(jpaEntity, jpa2));
        when(mapper.toDomain(jpaEntity)).thenReturn(domainUser);
        when(mapper.toDomain(jpa2)).thenReturn(user2);

        var result = adapter.findAllByType(UserType.ONG);

        assertThat(result).hasSize(2);
        assertThat(result).extracting(User::getUsername)
                .containsExactly(USERNAME, "ONG Beta");
    }

    @Test
    void existsByAddress_shouldReturnTrueWhenExists() {
        when(jpaRepository.existsByAddress(ADDRESS)).thenReturn(true);
        assertThat(adapter.existsByAddress(ADDRESS)).isTrue();
    }

    @Test
    void existsByAddress_shouldReturnFalseWhenNotExists() {
        when(jpaRepository.existsByAddress(ADDRESS)).thenReturn(false);
        assertThat(adapter.existsByAddress(ADDRESS)).isFalse();
    }
}
