package com.impactledger.domain.valueobject;

/**
 * Value Object que encapsula e valida um endereço Ethereum.
 * Toda normalização (lowercase, prefixo 0x) acontece aqui —
 * nenhum service precisa saber como normalizar um endereço.
 */
public record WalletAddress(String value) {

    private static final String HEX_PREFIX    = "0x";
    private static final int    ADDRESS_LENGTH = 42;

    public WalletAddress {
        if (value == null || value.isBlank())
            throw new IllegalArgumentException("Wallet address não pode ser vazio.");

        value = value.toLowerCase();

        if (!value.startsWith(HEX_PREFIX) || value.length() != ADDRESS_LENGTH)
            throw new IllegalArgumentException("Wallet address inválido: " + value);
    }                    // ← fecha o compact constructor (estava faltando)

    @Override
    public String toString() {
        return value;
    }
}                        // ← fecha o record (estava faltando)