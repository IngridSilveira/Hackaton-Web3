package com.impactledger.application.usecase.auth;

import com.impactledger.domain.entity.User;
import com.impactledger.domain.entity.UserType;
import com.impactledger.domain.exception.InvalidSignatureException;
import com.impactledger.domain.exception.UserNotRegisteredOnChainException;
import com.impactledger.domain.port.out.SignatureVerifierPort;
import com.impactledger.domain.port.out.TokenGeneratorPort;
import com.impactledger.domain.port.out.UserRepositoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthenticateWalletServiceTest {

    private static final String ADDRESS   = "0xabcdef1234567890abcdef1234567890abcdef12";
    private static final String SIGNATURE = "0xsignature";
    private static final String MESSAGE   = "Bem-vindo ao ImpactLedger!\n\nNonce: abc-123";
    private static final String TOKEN     = "jwt.token.value";

    @Mock private UserRepositoryPort   userRepository;
    @Mock private SignatureVerifierPort signatureVerifier;
    @Mock private TokenGeneratorPort   tokenGenerator;

    @InjectMocks
    private AuthenticateWalletService service;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .address(ADDRESS)
                .username("TestUser")
                .userType(UserType.ONG)
                .nonce("abc-123")
                .build();
    }

    @Test
    void shouldReturnJwtTokenOnValidSignature() {
        when(userRepository.findByAddress(ADDRESS)).thenReturn(Optional.of(user));
        when(signatureVerifier.recoverAddress(MESSAGE, SIGNATURE)).thenReturn(ADDRESS);
        when(tokenGenerator.generateToken(ADDRESS)).thenReturn(TOKEN);
        when(tokenGenerator.expirationMs()).thenReturn(86400000L);
        when(userRepository.save(any())).thenReturn(user);

        var result = service.execute(ADDRESS, SIGNATURE, MESSAGE);

        assertThat(result.token()).isEqualTo(TOKEN);
        assertThat(result.expiresInMs()).isEqualTo(86400000L);
    }

    @Test
    void shouldInvalidateNonceAfterSuccessfulAuth() {
        when(userRepository.findByAddress(ADDRESS)).thenReturn(Optional.of(user));
        when(signatureVerifier.recoverAddress(MESSAGE, SIGNATURE)).thenReturn(ADDRESS);
        when(tokenGenerator.generateToken(ADDRESS)).thenReturn(TOKEN);
        when(tokenGenerator.expirationMs()).thenReturn(86400000L);
        when(userRepository.save(any())).thenReturn(user);

        service.execute(ADDRESS, SIGNATURE, MESSAGE);

        assertThat(user.getNonce()).isNull();
        verify(userRepository).save(user);
    }

    @Test
    void shouldThrowInvalidSignatureWhenAddressMismatch() {
        var differentAddress = "0x9999991234567890abcdef1234567890abcdef12";
        when(userRepository.findByAddress(ADDRESS)).thenReturn(Optional.of(user));
        when(signatureVerifier.recoverAddress(MESSAGE, SIGNATURE))
                .thenReturn(differentAddress);

        assertThatThrownBy(() -> service.execute(ADDRESS, SIGNATURE, MESSAGE))
                .isInstanceOf(InvalidSignatureException.class);
    }

    @Test
    void shouldNeverSaveWhenSignatureIsInvalid() {
        var differentAddress = "0x9999991234567890abcdef1234567890abcdef12";
        when(userRepository.findByAddress(ADDRESS)).thenReturn(Optional.of(user));
        when(signatureVerifier.recoverAddress(MESSAGE, SIGNATURE))
                .thenReturn(differentAddress);

        assertThatThrownBy(() -> service.execute(ADDRESS, SIGNATURE, MESSAGE));
        verify(userRepository, never()).save(any());
    }

    @Test
    void shouldThrowWhenUserNotFound() {
        when(userRepository.findByAddress(ADDRESS)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.execute(ADDRESS, SIGNATURE, MESSAGE))
                .isInstanceOf(UserNotRegisteredOnChainException.class);

        verify(signatureVerifier, never()).recoverAddress(anyString(), anyString());
    }

    @Test
    void shouldAcceptAddressInUppercase() {
        var upperAddress = "0xABCDEF1234567890ABCDEF1234567890ABCDEF12";
        when(userRepository.findByAddress(ADDRESS)).thenReturn(Optional.of(user));
        when(signatureVerifier.recoverAddress(MESSAGE, SIGNATURE)).thenReturn(ADDRESS);
        when(tokenGenerator.generateToken(ADDRESS)).thenReturn(TOKEN);
        when(tokenGenerator.expirationMs()).thenReturn(86400000L);
        when(userRepository.save(any())).thenReturn(user);

        assertThatCode(() -> service.execute(upperAddress, SIGNATURE, MESSAGE))
                .doesNotThrowAnyException();
    }
}
