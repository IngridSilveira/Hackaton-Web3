package com.impactledger.adapter.web.controller;

import com.impactledger.adapter.web.dto.response.UserResponse;
import com.impactledger.application.usecase.user.FindUserUseCase;
import com.impactledger.application.usecase.user.ListOngsUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final FindUserUseCase findUserUseCase;
    private final ListOngsUseCase listOngsUseCase;

    /**
     * Mono<ResponseEntity> — reativo mas compatível com Spring MVC.
     * Spring resolve o Mono automaticamente antes de responder ao cliente.
     */
    @GetMapping("/{address}")
    public Mono<ResponseEntity<UserResponse>> findUser(@PathVariable String address) {
        return findUserUseCase.execute(address)
                .map(UserResponse::from)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    /**
     * Endpoint HTTP padrão — retorna a lista de ONGs como JSON array.
     * Flux é coletado internamente antes de serializar.
     */
    @GetMapping("/ongs")
    public Flux<UserResponse> listOngs() {
        return listOngsUseCase.execute()
                .map(UserResponse::from);
    }

    /**
     * Endpoint SSE — alternativa ao WebSocket para clientes simples.
     * Cada ONG é emitida como um item separado do stream HTTP.
     * Uso: EventSource('/api/users/ongs/stream') no frontend.
     */
    @GetMapping(value = "/ongs/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<UserResponse> streamOngs() {
        return listOngsUseCase.execute()
                .map(UserResponse::from);
    }
}
