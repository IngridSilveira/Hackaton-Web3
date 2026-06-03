package com.impactledger.domain.valueobject;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class NonceMessageTest {

    @Test
    void shouldCreateMessageContainingNonce() {
        var nonce   = "550e8400-e29b-41d4-a716-446655440000";
        var message = NonceMessage.from(nonce);

        assertThat(message.nonce()).isEqualTo(nonce);
        assertThat(message.text()).contains(nonce);
    }

    @Test
    void shouldContainExpectedGreeting() {
        var message = NonceMessage.from("any-nonce");
        assertThat(message.text()).contains("ImpactLedger");
    }

    @Test
    void shouldRejectBlankNonce() {
        assertThatThrownBy(() -> NonceMessage.from(""))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void shouldRejectNullNonce() {
        assertThatThrownBy(() -> NonceMessage.from(null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void differentNoncesShouldProduceDifferentMessages() {
        var m1 = NonceMessage.from("nonce-1");
        var m2 = NonceMessage.from("nonce-2");
        assertThat(m1.text()).isNotEqualTo(m2.text());
    }
}
