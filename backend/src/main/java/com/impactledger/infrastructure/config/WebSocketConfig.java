package com.impactledger.infrastructure.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Configura STOMP sobre WebSocket.
 *
 * Canais:
 *   /ws              — endpoint de conexão (SockJS fallback incluso)
 *   /topic/**        — broadcast para múltiplos clientes (pub/sub)
 *   /app/**          — prefixo para @MessageMapping no servidor
 *
 * Frontend conecta em: new SockJS('http://localhost:8080/ws')
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();  // fallback para navegadores sem WebSocket nativo
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");   // broker em memória
        registry.setApplicationDestinationPrefixes("/app");
    }
}
