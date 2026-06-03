package com.impactledger.domain.entity;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class UserTest {

    private static final String VALID_ADDRESS = "0xabcdef1234567890abcdef1234567890abcdef12";

    @Test
    void shouldIdentifyOngCorrectly() {
        var user = buildUser(UserType.ONG);
        assertThat(user.isOng()).isTrue();
        assertThat(user.isDonor()).isFalse();
    }

    @Test
    void shouldIdentifyDonorCorrectly() {
        var user = buildUser(UserType.DONOR);
        assertThat(user.isDonor()).isTrue();
        assertThat(user.isOng()).isFalse();
    }

    @Test
    void shouldAssignAndRetrieveNonce() {
        var user  = buildUser(UserType.ONG);
        var nonce = "test-nonce-123";
        user.assignNonce(nonce);
        assertThat(user.getNonce()).isEqualTo(nonce);
    }

    @Test
    void shouldInvalidateNonce() {
        var user = buildUser(UserType.ONG);
        user.assignNonce("some-nonce");
        user.invalidateNonce();
        assertThat(user.getNonce()).isNull();
    }

    @Test
    void twoUsersWithSameAddressShouldBeEqual() {
        var user1 = buildUser(UserType.ONG);
        var user2 = buildUser(UserType.DONOR);
        assertThat(user1).isEqualTo(user2);
    }

    private User buildUser(UserType type) {
        return User.builder()
                .address(VALID_ADDRESS)
                .username("TestUser")
                .userType(type)
                .build();
    }
}
