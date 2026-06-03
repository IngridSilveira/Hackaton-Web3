package com.impactledger.domain.entity;

import java.util.Arrays;

/**
 * Espelha o enum Solidity: ONG = 0, DONOR = 1.
 * fromIndex() elimina o número mágico do BlockchainEventListener.
 */
public enum UserType {
    ONG(0),
    DONOR(1);

    private final int contractIndex;

    UserType(int contractIndex) {
        this.contractIndex = contractIndex;
    }

    public static UserType fromIndex(int index) {
        return Arrays.stream(values())
                .filter(t -> t.contractIndex == index)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "UserType desconhecido para o índice: " + index));
    }
}
