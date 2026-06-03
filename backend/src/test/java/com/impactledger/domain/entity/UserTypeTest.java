package com.impactledger.domain.entity;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.*;

class UserTypeTest {

    @ParameterizedTest
    @CsvSource({ "0,ONG", "1,DONOR" })
    void shouldResolveUserTypeFromContractIndex(int index, UserType expected) {
        assertThat(UserType.fromIndex(index)).isEqualTo(expected);
    }

    @Test
    void shouldThrowForUnknownIndex() {
        assertThatThrownBy(() -> UserType.fromIndex(99))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("99");
    }
}
