package com.impactledger.domain.valueobject;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.*;

class WalletAddressTest {

    @Test
    void shouldNormalizeToLowercase() {
        var address = new WalletAddress("0xAbCdEf1234567890abcdef1234567890ABCDEF12");
        assertThat(address.value()).isEqualTo("0xabcdef1234567890abcdef1234567890abcdef12");
    }

    @Test
    void shouldAcceptValidLowercaseAddress() {
        var raw     = "0xabcdef1234567890abcdef1234567890abcdef12";
        var address = new WalletAddress(raw);
        assertThat(address.value()).isEqualTo(raw);
    }

    @Test
    void shouldBeEqualWhenSameAddressWithDifferentCase() {
        var lower = new WalletAddress("0xabcdef1234567890abcdef1234567890abcdef12");
        var upper = new WalletAddress("0xABCDEF1234567890ABCDEF1234567890ABCDEF12");
        assertThat(lower).isEqualTo(upper);
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "",
        "   ",
        "abcdef",                                      // sem prefixo 0x
        "0x123",                                       // muito curto
        "0xabcdef1234567890abcdef1234567890abcdef1200" // muito longo
    })
    void shouldRejectInvalidAddresses(String invalid) {
        assertThatThrownBy(() -> new WalletAddress(invalid))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void shouldRejectNullAddress() {
        assertThatThrownBy(() -> new WalletAddress(null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void toStringShouldReturnNormalizedValue() {
        var address = new WalletAddress("0xABCDEF1234567890ABCDEF1234567890ABCDEF12");
        assertThat(address.toString()).isEqualTo(address.value());
    }
}
