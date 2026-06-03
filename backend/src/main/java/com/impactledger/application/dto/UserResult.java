package com.impactledger.application.dto;

import com.impactledger.domain.entity.User;

import java.time.Instant;

public record UserResult(
        String  address,
        String  username,
        String  userType,
        Instant createdAt
) {
    public static UserResult from(User user) {
        return new UserResult(
                user.getAddress(),
                user.getUsername(),
                user.getUserType().name(),
                user.getCreatedAt()
        );
    }
}
