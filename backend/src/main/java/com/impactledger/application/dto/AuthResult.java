package com.impactledger.application.dto;

public record AuthResult(String token, long expiresInMs) {}
