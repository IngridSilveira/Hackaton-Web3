package com.impactledger.application.usecase.auth;

import com.impactledger.application.dto.NonceResult;
import com.impactledger.domain.exception.UserNotRegisteredOnChainException;
import com.impactledger.domain.port.out.UserRepositoryPort;
import com.impactledger.domain.valueobject.NonceMessage;
import com.impactledger.domain.valueobject.WalletAddress;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class GenerateNonceService implements GenerateNonceUseCase {

    private final UserRepositoryPort userRepository;

    @Override
    public NonceResult execute(String rawAddress) {
        var address = new WalletAddress(rawAddress);
        var user    = userRepository.findByAddress(address.value())
                .orElseThrow(() -> new UserNotRegisteredOnChainException(address.value()));

        var nonceMessage = NonceMessage.from(UUID.randomUUID().toString());
        user.assignNonce(nonceMessage.nonce());
        userRepository.save(user);

        log.debug("Nonce gerado para {}", address);
        return new NonceResult(nonceMessage.nonce(), nonceMessage.text());
    }
}
