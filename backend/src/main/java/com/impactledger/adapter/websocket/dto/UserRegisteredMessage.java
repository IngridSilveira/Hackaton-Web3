package com.impactledger.adapter.websocket.dto;

import com.impactledger.application.dto.UserResult;

import java.time.Instant;

/**
 * Mensagem enviada ao frontend via WebSocket quando um novo
 * usuário é registrado no contrato SignUp.sol.
 * Record garante imutabilidade e serialização JSON automática.
 */
public record UserRegisteredMessage(
        String  address,
        String  username,
        String  userType,
        Instant createdAt,
        Instant emittedAt
) {
    public static UserRegisteredMessage from(UserResult result) {
        return new UserRegisteredMessage(
                result.address(),
                result.username(),
                result.userType(),
                result.createdAt(),
                Instant.now()
        );
    }
}
