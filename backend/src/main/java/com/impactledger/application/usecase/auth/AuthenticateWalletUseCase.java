package com.impactledger.application.usecase.auth;

import com.impactledger.application.dto.AuthResult;

public interface AuthenticateWalletUseCase {
    AuthResult execute(String address, String signature, String message);
}
