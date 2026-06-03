package com.impactledger.adapter.web.dto.response;

import com.impactledger.application.dto.AuthResult;

public record JwtResponse(String token, String type, long expiresIn) {
    public static JwtResponse from(AuthResult result) {
        return new JwtResponse(result.token(), "Bearer", result.expiresInMs());
    }
}
