package com.impactledger.domain.entity;

import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;

import java.time.Instant;

/**
 * Entidade de domínio pura — zero dependência de frameworks.
 * Construída integralmente via @Builder, incluindo o nonce.
 * Mutations controladas (assignNonce, invalidateNonce) são
 * intencionais e expressam regras de negócio do ciclo de autenticação.
 */
@Getter
@Builder
@EqualsAndHashCode(of = "address")
public class User {

    private final String   address;
    private final String   username;
    private final UserType userType;
    private final String   txHash;
    private final Instant  createdAt;
    private       String   nonce;

    public void assignNonce(String nonce) {
        this.nonce = nonce;
    }

    public void invalidateNonce() {
        this.nonce = null;
    }

    public boolean isOng() {
        return UserType.ONG.equals(userType);
    }

    public boolean isDonor() {
        return UserType.DONOR.equals(userType);
    }
}
