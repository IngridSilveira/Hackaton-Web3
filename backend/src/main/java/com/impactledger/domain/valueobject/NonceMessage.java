package com.impactledger.domain.valueobject;

/**
 * Value Object que representa a mensagem de autenticação assinada pelo usuário.
 * A composição da mensagem é uma regra de negócio do domínio —
 * não pertence à camada de aplicação nem à infraestrutura.
 */
public record NonceMessage(String nonce, String text) {

    private static final String TEMPLATE =
            "Bem-vindo ao ImpactLedger!\n\nAssine para autenticar sua carteira.\n\nNonce: %s";

    public static NonceMessage from(String nonce) {
        if (nonce == null || nonce.isBlank()) {
            throw new IllegalArgumentException("Nonce não pode ser vazio.");
        }
        return new NonceMessage(nonce, TEMPLATE.formatted(nonce));
    }
}
