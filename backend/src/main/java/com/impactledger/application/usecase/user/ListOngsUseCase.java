package com.impactledger.application.usecase.user;

import com.impactledger.application.dto.UserResult;
import reactor.core.publisher.Flux;

public interface ListOngsUseCase {
    Flux<UserResult> execute();
}
