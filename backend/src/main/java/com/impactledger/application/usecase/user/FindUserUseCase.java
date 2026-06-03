package com.impactledger.application.usecase.user;

import com.impactledger.application.dto.UserResult;
import reactor.core.publisher.Mono;

public interface FindUserUseCase {
    Mono<UserResult> execute(String walletAddress);
}
