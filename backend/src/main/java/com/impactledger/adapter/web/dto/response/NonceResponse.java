package com.impactledger.adapter.web.dto.response;

import com.impactledger.application.dto.NonceResult;

public record NonceResponse(String nonce, String message) {
    public static NonceResponse from(NonceResult result) {
        return new NonceResponse(result.nonce(), result.messageToSign());
    }
}
