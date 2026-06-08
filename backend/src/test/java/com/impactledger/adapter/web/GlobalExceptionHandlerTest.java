package com.impactledger.adapter.web;

import com.impactledger.adapter.web.controller.UserController;
import com.impactledger.adapter.web.exception.GlobalExceptionHandler;
import com.impactledger.application.usecase.user.FindUserUseCase;
import com.impactledger.application.usecase.user.ListOngsUseCase;
import com.impactledger.domain.exception.InvalidSignatureException;
import com.impactledger.domain.exception.UserNotFoundException;
import com.impactledger.domain.exception.UserNotRegisteredOnChainException;
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
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import reactor.core.publisher.Mono;

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
@Import(GlobalExceptionHandler.class)
class GlobalExceptionHandlerTest {

    private static final String ADDRESS = "0xabcdef1234567890abcdef1234567890abcdef12";

    @Autowired MockMvc mvc;

    @MockBean FindUserUseCase findUserUseCase;
    @MockBean ListOngsUseCase listOngsUseCase;
    @MockBean JwtAuthFilter   jwtAuthFilter;
    @MockBean JwtService      jwtService;

    @Test
    @WithMockUser
    void shouldReturn404WithProblemDetailWhenUserNotFound() throws Exception {
        when(findUserUseCase.execute(ADDRESS))
                .thenReturn(Mono.error(new UserNotFoundException(ADDRESS)));

        performAsyncGet("/api/users/{address}", ADDRESS)
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").exists())
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    @WithMockUser
    void shouldReturn401WithProblemDetailOnInvalidSignature() throws Exception {
        when(findUserUseCase.execute(ADDRESS))
                .thenReturn(Mono.error(new InvalidSignatureException()));

        performAsyncGet("/api/users/{address}", ADDRESS)
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail").exists());
    }

    @Test
    @WithMockUser
    void shouldReturn401WhenUserNotRegisteredOnChain() throws Exception {
        when(findUserUseCase.execute(ADDRESS))
                .thenReturn(Mono.error(new UserNotRegisteredOnChainException(ADDRESS)));

        performAsyncGet("/api/users/{address}", ADDRESS)
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString(ADDRESS)));
    }

    @Test
    @WithMockUser
    void shouldReturn500WithoutStackTraceOnUnexpectedError() throws Exception {
        when(findUserUseCase.execute(ADDRESS))
                .thenReturn(Mono.error(new RuntimeException("erro inesperado interno")));

        performAsyncGet("/api/users/{address}", ADDRESS)
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.detail").value("Erro interno no servidor"));
    }

    @Test
    @WithMockUser
    void shouldIncludeTimestampInAllErrorResponses() throws Exception {
        when(findUserUseCase.execute(ADDRESS))
                .thenReturn(Mono.error(new UserNotFoundException(ADDRESS)));

        performAsyncGet("/api/users/{address}", ADDRESS)
                .andExpect(jsonPath("$.timestamp").exists());
    }

    private ResultActions performAsyncGet(String urlTemplate, Object... uriVariables) throws Exception {
        MvcResult result = mvc.perform(get(urlTemplate, uriVariables))
                .andExpect(request().asyncStarted())
                .andReturn();

        return mvc.perform(asyncDispatch(result));
    }
}
