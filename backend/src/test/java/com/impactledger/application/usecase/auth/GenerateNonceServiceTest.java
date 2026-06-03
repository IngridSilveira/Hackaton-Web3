package com.impactledger.application.usecase.auth;

import com.impactledger.domain.entity.User;
import com.impactledger.domain.entity.UserType;
import com.impactledger.domain.exception.UserNotRegisteredOnChainException;
import com.impactledger.domain.port.out.UserRepositoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GenerateNonceServiceTest {

    private static final String RAW_ADDRESS = "0xabcdef1234567890abcdef1234567890abcdef12";

    @Mock
    private UserRepositoryPort userRepository;

    @InjectMocks
    private GenerateNonceService service;

    private User existingUser;

    @BeforeEach
    void setUp() {
        existingUser = User.builder()
                .address(RAW_ADDRESS)
                .username("TestUser")
                .userType(UserType.ONG)
                .build();
    }

    @Test
    void shouldReturnNonceAndMessageWhenUserExists() {
        when(userRepository.findByAddress(RAW_ADDRESS))
                .thenReturn(Optional.of(existingUser));
        when(userRepository.save(any())).thenReturn(existingUser);

        var result = service.execute(RAW_ADDRESS);

        assertThat(result.nonce()).isNotBlank();
        assertThat(result.messageToSign()).contains(result.nonce());
        assertThat(result.messageToSign()).contains("ImpactLedger");
    }

    @Test
    void shouldAssignNonceToUserBeforeSaving() {
        when(userRepository.findByAddress(RAW_ADDRESS))
                .thenReturn(Optional.of(existingUser));
        when(userRepository.save(any())).thenReturn(existingUser);

        service.execute(RAW_ADDRESS);

        var captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getNonce()).isNotBlank();
    }

    @Test
    void shouldGenerateUniqueNonceOnEachCall() {
        when(userRepository.findByAddress(RAW_ADDRESS))
                .thenReturn(Optional.of(existingUser));
        when(userRepository.save(any())).thenReturn(existingUser);

        var result1 = service.execute(RAW_ADDRESS);
        var result2 = service.execute(RAW_ADDRESS);

        assertThat(result1.nonce()).isNotEqualTo(result2.nonce());
    }

    @Test
    void shouldNormalizeAddressToLowercase() {
        var upperAddress = "0xABCDEF1234567890ABCDEF1234567890ABCDEF12";
        when(userRepository.findByAddress(RAW_ADDRESS))
                .thenReturn(Optional.of(existingUser));
        when(userRepository.save(any())).thenReturn(existingUser);

        service.execute(upperAddress);

        verify(userRepository).findByAddress(RAW_ADDRESS);
    }

    @Test
    void shouldThrowWhenUserNotFound() {
        when(userRepository.findByAddress(RAW_ADDRESS)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.execute(RAW_ADDRESS))
                .isInstanceOf(UserNotRegisteredOnChainException.class)
                .hasMessageContaining(RAW_ADDRESS);
    }

    @Test
    void shouldNeverSaveWhenUserNotFound() {
        when(userRepository.findByAddress(RAW_ADDRESS)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.execute(RAW_ADDRESS));
        verify(userRepository, never()).save(any());
    }
}
