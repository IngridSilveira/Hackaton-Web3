package com.impactledger.adapter.web.dto.response;

import com.impactledger.application.dto.UserResult;

import java.time.Instant;

public record UserResponse(
        String  address,
        String  username,
        String  userType,
        Instant createdAt
) {
    public static UserResponse from(UserResult result) {
        return new UserResponse(
                result.address(),
                result.username(),
                result.userType(),
                result.createdAt()
        );
    }
}
