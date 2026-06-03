package com.impactledger.infrastructure.blockchain;

import com.impactledger.domain.entity.User;
import com.impactledger.domain.entity.UserType;
import com.impactledger.infrastructure.websocket.UserEventPublisher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import reactor.test.StepVerifier;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

class UserEventPublisherTest {

    private UserEventPublisher publisher;

    @BeforeEach
    void setUp() {
        publisher = new UserEventPublisher();
    }

    @Test
    void shouldEmitPublishedEventToSubscriber() {
        var user = buildUser("0xaaaa001234567890abcdef1234567890abcdef12", "UserA");

        StepVerifier.create(publisher.stream().take(1))
                .then(() -> publisher.publish(user))
                .assertNext(received -> {
                    assertThat(received.getAddress()).isEqualTo(user.getAddress());
                    assertThat(received.getUsername()).isEqualTo("UserA");
                })
                .verifyComplete();
    }

    @Test
    void shouldBroadcastToMultipleSubscribers() {
        var user  = buildUser("0xaaaa001234567890abcdef1234567890abcdef12", "Broadcast");

        var sub1  = publisher.stream().take(1);
        var sub2  = publisher.stream().take(1);

        StepVerifier.create(sub1)
                .then(() -> publisher.publish(user))
                .assertNext(r -> assertThat(r.getUsername()).isEqualTo("Broadcast"))
                .verifyComplete();

        StepVerifier.create(sub2)
                .then(() -> publisher.publish(user))
                .assertNext(r -> assertThat(r.getUsername()).isEqualTo("Broadcast"))
                .verifyComplete();
    }

    @Test
    void shouldEmitMultipleEventsInOrder() {
        var user1 = buildUser("0xaaaa001234567890abcdef1234567890abcdef12", "First");
        var user2 = buildUser("0xbbbb001234567890abcdef1234567890abcdef12", "Second");

        StepVerifier.create(publisher.stream().take(2))
                .then(() -> {
                    publisher.publish(user1);
                    publisher.publish(user2);
                })
                .assertNext(r -> assertThat(r.getUsername()).isEqualTo("First"))
                .assertNext(r -> assertThat(r.getUsername()).isEqualTo("Second"))
                .verifyComplete();
    }

    @Test
    void streamShouldNotCompleteWhilePublisherIsActive() {
        StepVerifier.create(publisher.stream().take(Duration.ofMillis(50)))
                .expectNextCount(0)
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
