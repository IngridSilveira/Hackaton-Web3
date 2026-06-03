package com.impactledger.application.usecase.user;

import com.impactledger.application.port.out.UserEventStreamPort;
import com.impactledger.domain.entity.User;
import com.impactledger.domain.entity.UserType;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StreamUserEventsServiceTest {

    @Mock private UserEventStreamPort userEventStream;
    @InjectMocks private StreamUserEventsService service;

    @Test
    void shouldMapDomainEventsToUserResults() {
        var user = User.builder()
                .address("0xabcdef1234567890abcdef1234567890abcdef12")
                .username("StreamUser")
                .userType(UserType.DONOR)
                .build();
        when(userEventStream.stream()).thenReturn(Flux.just(user));

        StepVerifier.create(service.execute())
                .assertNext(result -> {
                    assertThat(result.address()).isEqualTo(user.getAddress());
                    assertThat(result.username()).isEqualTo("StreamUser");
                    assertThat(result.userType()).isEqualTo("DONOR");
                })
                .verifyComplete();
    }

    @Test
    void shouldPropagateMultipleEvents() {
        var user1 = buildUser("0xaaaa001234567890abcdef1234567890abcdef12", "User1");
        var user2 = buildUser("0xbbbb001234567890abcdef1234567890abcdef12", "User2");
        when(userEventStream.stream()).thenReturn(Flux.just(user1, user2));

        StepVerifier.create(service.execute())
                .expectNextCount(2)
                .verifyComplete();
    }

    @Test
    void shouldPropagateErrors() {
        var error = new RuntimeException("Stream error");
        when(userEventStream.stream()).thenReturn(Flux.error(error));

        StepVerifier.create(service.execute())
                .expectError(RuntimeException.class)
                .verify();
    }

    private User buildUser(String address, String username) {
        return User.builder()
                .address(address)
                .username(username)
                .userType(UserType.DONOR)
                .build();
    }
}
