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

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ListOngsServiceTest {

    @Mock private UserRepositoryPort userRepository;
    @InjectMocks private ListOngsService service;

    @Test
    void shouldReturnAllOngsAsFlux() {
        var ong1 = buildUser("0xaaaa001234567890abcdef1234567890abcdef12", "ONG Alpha");
        var ong2 = buildUser("0xbbbb001234567890abcdef1234567890abcdef12", "ONG Beta");
        when(userRepository.findAllByType(UserType.ONG)).thenReturn(List.of(ong1, ong2));

        StepVerifier.create(service.execute())
                .assertNext(r -> assertThat(r.username()).isEqualTo("ONG Alpha"))
                .assertNext(r -> assertThat(r.username()).isEqualTo("ONG Beta"))
                .verifyComplete();
    }

    @Test
    void shouldReturnEmptyFluxWhenNoOngsExist() {
        when(userRepository.findAllByType(UserType.ONG)).thenReturn(List.of());

        StepVerifier.create(service.execute())
                .verifyComplete();
    }

    @Test
    void shouldQueryOnlyOngType() {
        when(userRepository.findAllByType(UserType.ONG)).thenReturn(List.of());

        service.execute().subscribe();

        verify(userRepository).findAllByType(UserType.ONG);
        verify(userRepository, never()).findAllByType(UserType.DONOR);
    }

    @Test
    void shouldMapUserTypeToString() {
        var ong = buildUser("0xaaaa001234567890abcdef1234567890abcdef12", "ONG Alpha");
        when(userRepository.findAllByType(UserType.ONG)).thenReturn(List.of(ong));

        StepVerifier.create(service.execute())
                .assertNext(r -> assertThat(r.userType()).isEqualTo("ONG"))
                .verifyComplete();
    }

    private User buildUser(String address, String username) {
        return User.builder()
                .address(address)
                .username(username)
                .userType(UserType.ONG)
                .build();
    }
}
