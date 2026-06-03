package com.impactledger.application.usecase.auth;

import com.impactledger.application.dto.AuthResult;
import com.impactledger.domain.exception.InvalidSignatureException;
import com.impactledger.domain.exception.UserNotRegisteredOnChainException;
import com.impactledger.domain.port.out.SignatureVerifierPort;
import com.impactledger.domain.port.out.TokenGeneratorPort;
import com.impactledger.domain.port.out.UserRepositoryPort;
import com.impactledger.domain.valueobject.WalletAddress;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Caso de uso de autenticação via carteira Ethereum.
 *
 * Depende exclusivamente de portas (interfaces) — zero imports de infraestrutura.
 * Isso garante que a lógica de negócio é independente de Web3j, JWT ou qualquer lib.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthenticateWalletService implements AuthenticateWalletUseCase {

    private final UserRepositoryPort  userRepository;
    private final SignatureVerifierPort signatureVerifier;
    private final TokenGeneratorPort  tokenGenerator;

    @Override
    public AuthResult execute(String rawAddress, String signature, String message) {
        var address = new WalletAddress(rawAddress);
        var user   =  findRegisteredUser(address);

        verifySignatureOwnership(message, signature, address);

        user.invalidateNonce();
        userRepository.save(user);

        log.info("Autenticação bem-sucedida: {}", address);
        return new AuthResult(
                tokenGenerator.generateToken(address.value()),
                tokenGenerator.expirationMs()
        );
    }

    private com.impactledger.domain.entity.User findRegisteredUser(WalletAddress address) {
        return userRepository.findByAddress(address.value())
                .orElseThrow(() -> new UserNotRegisteredOnChainException(address.value()));
    }

    private void verifySignatureOwnership(String message, String signature, WalletAddress expected) {
        var recovered = new WalletAddress(signatureVerifier.recoverAddress(message, signature));
        if (!recovered.equals(expected)) {
            log.warn("Assinatura inválida. Esperado: {}, Recuperado: {}", expected, recovered);
            throw new InvalidSignatureException();
        }
    }
}
