package com.impactledger.infrastructure.config;

/**
 * Constantes dos tópicos STOMP expostos ao frontend.
 * Broadcaster e Config referenciam estas constantes —
 * nenhuma string mágica espalhada pelo código.
 */
public final class WebSocketTopics {

    public static final String USER_REGISTERED = "/topic/users/registered";
    public static final String USERS_ONGS      = "/topic/users/ongs";

    private WebSocketTopics() {}
}
