package com.impactledger.adapter.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.impactledger.adapter.web.controller.AuthController;
import com.impactledger.application.dto.AuthResult;
import com.impactledger.application.dto.NonceResult;
import com.impactledger.application.usecase.auth.AuthenticateWalletUseCase;
import com.impactledger.application.usecase.auth.GenerateNonceUseCase;
import com.impactledger.domain.exception.InvalidSignatureException;
import com.impactledger.domain.exception.UserNotRegisteredOnChainException;
import com.impactledger.infrastructure.security.JwtAuthFilter;
import com.impactledger.infrastructure.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
class AuthControllerTest {

    private static final String ADDRESS   = "0xabcdef1234567890abcdef1234567890abcdef12";
    private static final String NONCE     = "550e8400-e29b-41d4-a716-446655440000";
    private static final String MESSAGE   = "Bem-vindo ao ImpactLedger!\n\nNonce: " + NONCE;
    private static final String SIGNATURE = "0xdeadbeef";
    private static final String TOKEN     = "jwt.test.token";

    @Autowired MockMvc       mvc;
    @Autowired ObjectMapper  objectMapper;

    @MockBean GenerateNonceUseCase      generateNonceUseCase;
    @MockBean AuthenticateWalletUseCase authenticateWalletUseCase;
    @MockBean JwtAuthFilter             jwtAuthFilter;
    @MockBean JwtService                jwtService;

    // ── GET /api/auth/nonce/{address} ────────────────────────────────────

    @Test
    void getNonce_shouldReturn200WithNonceAndMessage() throws Exception {
        when(generateNonceUseCase.execute(ADDRESS))
                .thenReturn(new NonceResult(NONCE, MESSAGE));

        mvc.perform(get("/api/auth/nonce/{address}", ADDRESS))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nonce").value(NONCE))
                .andExpect(jsonPath("$.message").value(MESSAGE));
    }

    @Test
    void getNonce_shouldReturn401WhenUserNotRegisteredOnChain() throws Exception {
        when(generateNonceUseCase.execute(ADDRESS))
                .thenThrow(new UserNotRegisteredOnChainException(ADDRESS));

        mvc.perform(get("/api/auth/nonce/{address}", ADDRESS))
                .andExpect(status().isUnauthorized());
    }

    // ── POST /api/auth/wallet ─────────────────────────────────────────────

    @Test
    @WithMockUser
    void authenticate_shouldReturn200WithJwtOnValidPayload() throws Exception {
        when(authenticateWalletUseCase.execute(ADDRESS, SIGNATURE, MESSAGE))
                .thenReturn(new AuthResult(TOKEN, 86400000L));

        mvc.perform(post("/api/auth/wallet")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildBody(ADDRESS, SIGNATURE, MESSAGE)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value(TOKEN))
                .andExpect(jsonPath("$.type").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").value(86400000));
    }

    @Test
    @WithMockUser
    void authenticate_shouldReturn401OnInvalidSignature() throws Exception {
        when(authenticateWalletUseCase.execute(anyString(), anyString(), anyString()))
                .thenThrow(new InvalidSignatureException());

        mvc.perform(post("/api/auth/wallet")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildBody(ADDRESS, SIGNATURE, MESSAGE)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser
    void authenticate_shouldReturn400WhenAddressFormatIsInvalid() throws Exception {
        mvc.perform(post("/api/auth/wallet")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildBody("not-an-ethereum-address", SIGNATURE, MESSAGE)))
                .andExpect(status().isBadRequest());

        verify(authenticateWalletUseCase, never()).execute(anyString(), anyString(), anyString());
    }

    @Test
    @WithMockUser
    void authenticate_shouldReturn400WhenSignatureIsMissing() throws Exception {
        mvc.perform(post("/api/auth/wallet")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildBody(ADDRESS, "", MESSAGE)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void authenticate_shouldReturn400WhenMessageIsMissing() throws Exception {
        mvc.perform(post("/api/auth/wallet")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildBody(ADDRESS, SIGNATURE, "")))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void authenticate_shouldReturn400WhenBodyIsEmpty() throws Exception {
        mvc.perform(post("/api/auth/wallet")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    private String buildBody(String address, String signature, String message) throws Exception {
        return objectMapper.writeValueAsString(
                Map.of("address", address, "signature", signature, "message", message));
    }
}
