package com.impactledger.adapter.web;

import com.impactledger.adapter.web.controller.UserController;
import com.impactledger.application.dto.UserResult;
import com.impactledger.application.usecase.user.FindUserUseCase;
import com.impactledger.application.usecase.user.ListOngsUseCase;
import com.impactledger.infrastructure.security.JwtAuthFilter;
import com.impactledger.infrastructure.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.asyncDispatch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ActiveProfiles("test")
@AutoConfigureMockMvc(addFilters = false)
@WebMvcTest(value = UserController.class,
        excludeAutoConfiguration = {
                DataSourceAutoConfiguration.class,
                HibernateJpaAutoConfiguration.class,
                JpaRepositoriesAutoConfiguration.class
        })
class UserControllerTest {

    private static final String ADDRESS = "0xabcdef1234567890abcdef1234567890abcdef12";

    @Autowired MockMvc mvc;

    @MockBean FindUserUseCase findUserUseCase;
    @MockBean ListOngsUseCase listOngsUseCase;
    @MockBean JwtAuthFilter   jwtAuthFilter;
    @MockBean JwtService      jwtService;

    // ── GET /api/users/{address} ─────────────────────────────────────────

    @Test
    @WithMockUser
    void findUser_shouldReturn200WithUserWhenFound() throws Exception {
        var result = buildResult(ADDRESS, "TestUser", "ONG");
        when(findUserUseCase.execute(ADDRESS)).thenReturn(Mono.just(result));

        performAsyncGet("/api/users/{address}", ADDRESS)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.address").value(ADDRESS))
                .andExpect(jsonPath("$.username").value("TestUser"))
                .andExpect(jsonPath("$.userType").value("ONG"))
                .andExpect(jsonPath("$.createdAt").exists());
    }

    @Test
    @WithMockUser
    void findUser_shouldReturn404WhenUserNotFound() throws Exception {
        when(findUserUseCase.execute(ADDRESS)).thenReturn(Mono.empty());

        performAsyncGet("/api/users/{address}", ADDRESS)
                .andExpect(status().isNotFound());
    }

    // ── GET /api/users/ongs ──────────────────────────────────────────────

    @Test
    void listOngs_shouldReturn200WithoutAuthentication() throws Exception {
        when(listOngsUseCase.execute()).thenReturn(Flux.empty());

        performAsyncGet("/api/users/ongs")
                .andExpect(status().isOk());
    }

    @Test
    void listOngs_shouldReturnAllOngsAsJsonArray() throws Exception {
        var ong1 = buildResult("0xaaaa001234567890abcdef1234567890abcdef12", "ONG Alpha", "ONG");
        var ong2 = buildResult("0xbbbb001234567890abcdef1234567890abcdef12", "ONG Beta",  "ONG");
        when(listOngsUseCase.execute()).thenReturn(Flux.just(ong1, ong2));

        performAsyncGet("/api/users/ongs")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].username").value("ONG Alpha"))
                .andExpect(jsonPath("$[1].username").value("ONG Beta"));
    }

    @Test
    void listOngs_shouldReturnEmptyArrayWhenNoOngsExist() throws Exception {
        when(listOngsUseCase.execute()).thenReturn(Flux.empty());

        performAsyncGet("/api/users/ongs")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    // ── GET /api/users/ongs/stream ───────────────────────────────────────

    @Test
    void streamOngs_shouldReturn200AsEventStream() throws Exception {
        when(listOngsUseCase.execute()).thenReturn(Flux.empty());

        MvcResult result = mvc.perform(get("/api/users/ongs/stream")
                        .accept(org.springframework.http.MediaType.TEXT_EVENT_STREAM))
                .andExpect(request().asyncStarted())
                .andReturn();

        mvc.perform(asyncDispatch(result))
                .andExpect(status().isOk());
    }

    private ResultActions performAsyncGet(String urlTemplate, Object... uriVariables) throws Exception {
        MvcResult result = mvc.perform(get(urlTemplate, uriVariables))
                .andExpect(request().asyncStarted())
                .andReturn();

        return mvc.perform(asyncDispatch(result));
    }

    private UserResult buildResult(String address, String username, String userType) {
        return new UserResult(address, username, userType, Instant.now());
    }
}
