package com.impactledger.application.usecase.user;

import com.impactledger.application.dto.UserResult;
import com.impactledger.domain.port.out.UserRepositoryPort;
import com.impactledger.domain.valueobject.WalletAddress;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class FindUserService implements FindUserUseCase {

    private final UserRepositoryPort userRepository;

    @Override
    public Mono<UserResult> execute(String rawAddress) {
        var address = new WalletAddress(rawAddress);
        return Mono.justOrEmpty(
                userRepository.findByAddress(address.value()).map(UserResult::from)
        );
    }
}
