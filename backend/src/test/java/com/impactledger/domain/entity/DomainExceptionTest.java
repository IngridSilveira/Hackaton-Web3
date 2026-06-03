package com.impactledger.domain.entity;

import com.impactledger.domain.exception.InvalidSignatureException;
import com.impactledger.domain.exception.UserNotFoundException;
import com.impactledger.domain.exception.UserNotRegisteredOnChainException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class DomainExceptionTest {

    @Test
    void userNotFoundException_shouldContainAddress() {
        var address = "0xabcdef1234567890abcdef1234567890abcdef12";
        var ex = new UserNotFoundException(address);
        assertThat(ex.getMessage()).contains(address);
    }

    @Test
    void userNotRegisteredOnChainException_shouldContainAddress() {
        var address = "0xabcdef1234567890abcdef1234567890abcdef12";
        var ex = new UserNotRegisteredOnChainException(address);
        assertThat(ex.getMessage()).contains(address);
    }

    @Test
    void invalidSignatureException_shouldHaveDescriptiveMessage() {
        var ex = new InvalidSignatureException();
        assertThat(ex.getMessage()).isNotBlank();
    }
}
