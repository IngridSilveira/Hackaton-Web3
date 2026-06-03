package com.impactledger.adapter.websocket;

import com.impactledger.adapter.websocket.broadcaster.UserEventBroadcaster;
import com.impactledger.adapter.websocket.dto.UserRegisteredMessage;
import com.impactledger.application.dto.UserResult;
import com.impactledger.application.usecase.user.StreamUserEventsUseCase;
import com.impactledger.infrastructure.config.WebSocketTopics;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserEventBroadcasterTest {

    @Mock private StreamUserEventsUseCase streamUserEventsUseCase;
    @Mock private SimpMessagingTemplate   messagingTemplate;

    @InjectMocks private UserEventBroadcaster broadcaster;

    @Test
    void start_shouldSubscribeToStreamAndBroadcastEachEvent() {
        var result = buildResult("0xaaaa001234567890abcdef1234567890abcdef12", "ONG Alpha");
        when(streamUserEventsUseCase.execute()).thenReturn(Flux.just(result));

        broadcaster.start();

        var topicCaptor   = ArgumentCaptor.forClass(String.class);
        var messageCaptor = ArgumentCaptor.forClass(UserRegisteredMessage.class);
        verify(messagingTemplate).convertAndSend(topicCaptor.capture(), messageCaptor.capture());

        assertThat(topicCaptor.getValue()).isEqualTo(WebSocketTopics.USER_REGISTERED);
        assertThat(messageCaptor.getValue().address()).isEqualTo(result.address());
        assertThat(messageCaptor.getValue().username()).isEqualTo("ONG Alpha");
        assertThat(messageCaptor.getValue().emittedAt()).isNotNull();
    }

    @Test
    void start_shouldBroadcastAllEventsFromStream() {
        var r1 = buildResult("0xaaaa001234567890abcdef1234567890abcdef12", "User1");
        var r2 = buildResult("0xbbbb001234567890abcdef1234567890abcdef12", "User2");
        var r3 = buildResult("0xcccc001234567890abcdef1234567890abcdef12", "User3");
        when(streamUserEventsUseCase.execute()).thenReturn(Flux.just(r1, r2, r3));

        broadcaster.start();

        verify(messagingTemplate, times(3))
                .convertAndSend(eq(WebSocketTopics.USER_REGISTERED), any(UserRegisteredMessage.class));
    }

    @Test
    void start_shouldNotBroadcastWhenStreamIsEmpty() {
        when(streamUserEventsUseCase.execute()).thenReturn(Flux.empty());

        broadcaster.start();

        verify(messagingTemplate, never())
                .convertAndSend(anyString(), any(Object.class));
    }

    @Test
    void start_shouldContinueBroadcastingAfterOneEvent() {
        var sink   = Sinks.many().multicast().<UserResult>onBackpressureBuffer();
        var result = buildResult("0xaaaa001234567890abcdef1234567890abcdef12", "User");
        when(streamUserEventsUseCase.execute()).thenReturn(sink.asFlux());

        broadcaster.start();

        sink.tryEmitNext(result);
        sink.tryEmitNext(result);

        verify(messagingTemplate, times(2))
                .convertAndSend(eq(WebSocketTopics.USER_REGISTERED), any(UserRegisteredMessage.class));
    }

    private UserResult buildResult(String address, String username) {
        return new UserResult(address, username, "ONG", Instant.now());
    }
}
