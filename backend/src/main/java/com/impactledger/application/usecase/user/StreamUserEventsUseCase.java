package com.impactledger.application.usecase.user;

import com.impactledger.application.dto.UserResult;
import reactor.core.publisher.Flux;

/**
 * Caso de uso de streaming — expõe um Flux contínuo de novos registros.
 * O controller WebSocket subscreve neste Flux e repassa ao frontend.
 */
public interface StreamUserEventsUseCase {
    Flux<UserResult> execute();
}
