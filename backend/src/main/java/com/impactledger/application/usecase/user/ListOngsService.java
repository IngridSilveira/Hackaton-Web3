package com.impactledger.application.usecase.user;

import com.impactledger.application.dto.UserResult;
import com.impactledger.domain.entity.UserType;
import com.impactledger.domain.port.out.UserRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

/**
 * Retorna um Flux das ONGs persistidas.
 * Flux.fromIterable() envolve a lista JPA em um stream reativo,
 * permitindo que o controller decida se entrega via HTTP ou WebSocket.
 */
@Service
@RequiredArgsConstructor
public class ListOngsService implements ListOngsUseCase {

    private final UserRepositoryPort userRepository;

    @Override
    public Flux<UserResult> execute() {
        return Flux.fromIterable(userRepository.findAllByType(UserType.ONG))
                .map(UserResult::from);
    }
}
