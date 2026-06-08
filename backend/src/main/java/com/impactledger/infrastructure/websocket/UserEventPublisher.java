package com.impactledger.infrastructure.websocket;

import com.impactledger.application.port.out.UserEventStreamPort;
import com.impactledger.domain.entity.User;
import com.impactledger.domain.port.out.UserEventPort;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

/**
 * Adaptador de infraestrutura que implementa:
 *   - UserEventPort       (domínio) — recebe o publish() do BlockchainEventListener
 *   - UserEventStreamPort (aplicação) — fornece Flux para o StreamUserEventsService
 *
 * Sinks.Many.multicast(): hot publisher thread-safe.
 * Cada subscriber recebe eventos a partir do momento de sua inscrição.
 */
@Slf4j
@Component
public class UserEventPublisher implements UserEventPort, UserEventStreamPort {

    private final Sinks.Many<User> sink = Sinks.many()
            .multicast()
            .onBackpressureBuffer(256, false);

    @Override
    public void publish(User user) {
        var result = sink.tryEmitNext(user);

        if (result.isFailure())
            log.warn("Falha ao emitir evento para {}: {}", user.getAddress(), result);

    }

    @Override
    public Flux<User> stream() {
        return sink.asFlux()
                .doOnSubscribe(s -> log.info("Novo subscriber no stream de usuários"))
                .doOnCancel(()   -> log.info("Subscriber desconectado do stream"))
                .doOnError(e     -> log.error("Erro no stream: {}", e.getMessage()));
    }
}
