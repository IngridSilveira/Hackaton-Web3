package com.impactledger.application.usecase.user;

import com.impactledger.application.dto.UserResult;
import com.impactledger.application.port.out.UserEventStreamPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

@Service
@RequiredArgsConstructor
public class StreamUserEventsService implements StreamUserEventsUseCase {

    private final UserEventStreamPort userEventStream;

    @Override
    public Flux<UserResult> execute() {
        return userEventStream.stream()
                .map(UserResult::from);
    }
}
