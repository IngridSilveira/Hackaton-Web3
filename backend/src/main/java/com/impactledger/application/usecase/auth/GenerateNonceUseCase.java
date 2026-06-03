package com.impactledger.application.usecase.auth;

import com.impactledger.application.dto.NonceResult;

public interface GenerateNonceUseCase {
    NonceResult execute(String walletAddress);
}
