package com.impactledger.adapter.websocket.broadcaster;

import com.impactledger.adapter.websocket.dto.UserRegisteredMessage;
import com.impactledger.application.usecase.user.StreamUserEventsUseCase;
import com.impactledger.infrastructure.config.WebSocketTopics;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

/**
 * Responsabilidade única: subscreve no Flux de eventos de domínio
 * e faz broadcast para todos os clientes WebSocket conectados.
 *
 * Separado do UserWebSocketController (que só lida com @MessageMapping)
 * para respeitar o SRP — cada classe tem exatamente um motivo para mudar.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class UserEventBroadcaster {

    private final StreamUserEventsUseCase streamUserEventsUseCase;
    private final SimpMessagingTemplate   messagingTemplate;

    @PostConstruct
    public void start() {
        streamUserEventsUseCase.execute()
                .map(UserRegisteredMessage::from)
                .subscribe(
                        this::broadcast,
                        error -> log.error("Erro no stream de broadcast: {}", error.getMessage())
                );
    }

    private void broadcast(UserRegisteredMessage message) {
        log.info("Broadcasting novo usuário: {}", message.address());
        messagingTemplate.convertAndSend(WebSocketTopics.USER_REGISTERED, message);
    }
}
