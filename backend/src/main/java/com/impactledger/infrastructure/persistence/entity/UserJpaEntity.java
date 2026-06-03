package com.impactledger.infrastructure.persistence.entity;

import com.impactledger.domain.entity.UserType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_users_address", columnList = "address"),
        @Index(name = "idx_users_user_type", columnList = "userType")
})
@EntityListeners(AuditingEntityListener.class)
public class UserJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false, length = 42)
    private String address;

    @Column(nullable = false, length = 100)
    private String username;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private UserType userType;

    @Column(length = 66)   // hash tx: 0x + 64 hex
    private String txHash;

    @Column(length = 36)   // UUID: 36 chars
    private String nonce;

    @CreatedDate
    @Column(updatable = false)
    private Instant createdAt;
}
