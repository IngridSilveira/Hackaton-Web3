package com.impactledger.application.usecase.user;

import com.impactledger.domain.entity.User;
import com.impactledger.domain.entity.UserType;
import com.impactledger.domain.port.out.UserRepositoryPort;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.test.StepVerifier;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FindUserServiceTest {

    private static final String ADDRESS = "0xabcdef1234567890abcdef1234567890abcdef12";

    @Mock private UserRepositoryPort userRepository;
    @InjectMocks private FindUserService service;

    @Test
    void shouldReturnUserWhenFound() {
        var user = buildUser(UserType.ONG);
        when(userRepository.findByAddress(ADDRESS)).thenReturn(Optional.of(user));

        StepVerifier.create(service.execute(ADDRESS))
                .assertNext(result -> {
                    assertThat(result.address()).isEqualTo(ADDRESS);
                    assertThat(result.username()).isEqualTo("TestUser");
                    assertThat(result.userType()).isEqualTo("ONG");
                })
                .verifyComplete();
    }

    @Test
    void shouldReturnEmptyMonoWhenUserNotFound() {
        when(userRepository.findByAddress(ADDRESS)).thenReturn(Optional.empty());

        StepVerifier.create(service.execute(ADDRESS))
                .verifyComplete();
    }

    @Test
    void shouldNormalizeAddressBeforeQuerying() {
        var upperAddress = "0xABCDEF1234567890ABCDEF1234567890ABCDEF12";
        when(userRepository.findByAddress(ADDRESS)).thenReturn(Optional.empty());

        service.execute(upperAddress).subscribe();

        verify(userRepository).findByAddress(ADDRESS);
    }

    private User buildUser(UserType type) {
        return User.builder()
                .address(ADDRESS)
                .username("TestUser")
                .userType(type)
                .build();
    }
}
