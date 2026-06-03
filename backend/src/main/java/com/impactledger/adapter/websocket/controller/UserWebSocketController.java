package com.impactledger.adapter.websocket.controller;

import com.impactledger.adapter.websocket.dto.OngsResponse;
import com.impactledger.application.usecase.user.ListOngsUseCase;
import com.impactledger.infrastructure.config.WebSocketTopics;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.util.concurrent.CompletableFuture;

/**
 * Responsabilidade única: responde a mensagens STOMP enviadas pelo frontend.
 * Não gerencia lifecycle de streams — isso é responsabilidade do UserEventBroadcaster.
 *
 * Retorna CompletableFuture em vez de bloquear com .block() —
 * Spring resolve de forma assíncrona antes de enviar ao broker STOMP.
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class UserWebSocketController {

    private final ListOngsUseCase listOngsUseCase;

    /**
     * Frontend envia: stompClient.publish({ destination: '/app/users/ongs' })
     * Backend responde em: /topic/users/ongs
     */
    @MessageMapping("/users/ongs")
    @SendTo(WebSocketTopics.USERS_ONGS)
    public CompletableFuture<OngsResponse> handleOngsRequest() {
        log.debug("Requisição WebSocket recebida: /app/users/ongs");
        return listOngsUseCase.execute()
                .map(result -> new OngsResponse.Item(result.address(), result.username()))
                .collectList()
                .map(OngsResponse::new)
                .toFuture();
    }
}
