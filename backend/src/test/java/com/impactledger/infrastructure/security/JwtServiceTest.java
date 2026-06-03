package com.impactledger.infrastructure.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class JwtServiceTest {

    private static final String SECRET        = "test-secret-com-pelo-menos-256-bits-para-hmac-sha-256";
    private static final long   EXPIRATION_MS = 86400000L;
    private static final String ADDRESS       = "0xabcdef1234567890abcdef1234567890abcdef12";

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(SECRET, EXPIRATION_MS);
    }

    @Test
    void shouldGenerateNonBlankToken() {
        var token = jwtService.generateToken(ADDRESS);
        assertThat(token).isNotBlank();
    }

    @Test
    void shouldExtractCorrectAddress() {
        var token    = jwtService.generateToken(ADDRESS);
        var extracted = jwtService.extractAddress(token);
        assertThat(extracted).isEqualTo(ADDRESS);
    }

    @Test
    void shouldValidateTokenSuccessfully() {
        var token = jwtService.generateToken(ADDRESS);
        assertThat(jwtService.isValid(token)).isTrue();
    }

    @Test
    void shouldRejectTamperedToken() {
        var token    = jwtService.generateToken(ADDRESS);
        var tampered = token + "tampered";
        assertThat(jwtService.isValid(tampered)).isFalse();
    }

    @Test
    void shouldRejectExpiredToken() {
        var expiredService = new JwtService(SECRET, -1L);
        var token          = expiredService.generateToken(ADDRESS);
        assertThat(jwtService.isValid(token)).isFalse();
    }

    @Test
    void shouldRejectBlankToken() {
        assertThat(jwtService.isValid("")).isFalse();
    }

    @Test
    void shouldExposeConfiguredExpirationMs() {
        assertThat(jwtService.expirationMs()).isEqualTo(EXPIRATION_MS);
    }

    @Test
    void differentAddressesShouldProduceDifferentTokens() {
        var address2 = "0x9999991234567890abcdef1234567890abcdef12";
        assertThat(jwtService.generateToken(ADDRESS))
                .isNotEqualTo(jwtService.generateToken(address2));
    }
}
