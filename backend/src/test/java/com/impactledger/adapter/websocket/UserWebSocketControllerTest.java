package com.impactledger.adapter.websocket;

import com.impactledger.adapter.websocket.controller.UserWebSocketController;
import com.impactledger.application.dto.UserResult;
import com.impactledger.application.usecase.user.ListOngsUseCase;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;

import java.time.Instant;
import java.util.concurrent.ExecutionException;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserWebSocketControllerTest {

    @Mock private ListOngsUseCase listOngsUseCase;
    @InjectMocks private UserWebSocketController controller;

    @Test
    void handleOngsRequest_shouldReturnOngsResponse() throws ExecutionException, InterruptedException {
        var ong1 = buildResult("0xaaaa001234567890abcdef1234567890abcdef12", "ONG Alpha");
        var ong2 = buildResult("0xbbbb001234567890abcdef1234567890abcdef12", "ONG Beta");
        when(listOngsUseCase.execute()).thenReturn(Flux.just(ong1, ong2));

        var future   = controller.handleOngsRequest();
        var response = future.get();

        assertThat(response.ongs()).hasSize(2);
        assertThat(response.total()).isEqualTo(2);
        assertThat(response.ongs().get(0).username()).isEqualTo("ONG Alpha");
        assertThat(response.ongs().get(1).username()).isEqualTo("ONG Beta");
    }

    @Test
    void handleOngsRequest_shouldReturnEmptyResponseWhenNoOngs()
            throws ExecutionException, InterruptedException {
        when(listOngsUseCase.execute()).thenReturn(Flux.empty());

        var response = controller.handleOngsRequest().get();

        assertThat(response.ongs()).isEmpty();
        assertThat(response.total()).isZero();
    }

    @Test
    void handleOngsRequest_shouldReturnCorrectTotal()
            throws ExecutionException, InterruptedException {
        var ongsFlux = Flux.just(
                buildResult("0xaaaa001234567890abcdef1234567890abcdef12", "A"),
                buildResult("0xbbbb001234567890abcdef1234567890abcdef12", "B"),
                buildResult("0xcccc001234567890abcdef1234567890abcdef12", "C")
        );
        when(listOngsUseCase.execute()).thenReturn(ongsFlux);

        var response = controller.handleOngsRequest().get();

        assertThat(response.total()).isEqualTo(3);
    }

    private UserResult buildResult(String address, String username) {
        return new UserResult(address, username, "ONG", Instant.now());
    }
}
