package com.impactledger.infrastructure.config;

/**
 * Centraliza os endpoints públicos da aplicação.
 * SecurityConfig e testes referenciam estas constantes —
 * uma renomeação de rota tem impacto visível em um único lugar.
 */
public final class SecurityEndpoints {

    public static final String AUTH_BASE          = "/api/auth/**";
    public static final String USERS_ONGS         = "/api/users/ongs";
    public static final String USERS_ONGS_STREAM  = "/api/users/ongs/stream";
    public static final String WEBSOCKET_HANDSHAKE = "/ws/**";

    private SecurityEndpoints() {}
}
