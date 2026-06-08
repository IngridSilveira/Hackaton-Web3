package com.impactledger.infrastructure.blockchain;

import com.impactledger.domain.entity.User;
import com.impactledger.domain.port.out.UserEventPort;
import com.impactledger.domain.port.out.UserRepositoryPort;
import io.reactivex.Flowable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.web3j.abi.EventEncoder;
import org.web3j.abi.FunctionEncoder;
import org.web3j.abi.TypeReference;
import org.web3j.abi.datatypes.Event;
import org.web3j.abi.datatypes.Utf8String;
import org.web3j.abi.datatypes.generated.Uint8;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.methods.request.EthFilter;
import org.web3j.protocol.core.methods.response.Log;

import java.lang.reflect.Method;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BlockchainEventListenerTest {

    private static final TypeReference<org.web3j.abi.datatypes.Address> ADDRESS_REFERENCE =
            TypeReference.create(org.web3j.abi.datatypes.Address.class, true);
    private static final TypeReference<Utf8String> UTF8_STRING_REFERENCE =
            TypeReference.create(Utf8String.class);
    private static final TypeReference<Uint8> UINT8_REFERENCE =
            TypeReference.create(Uint8.class);

    @Mock
    private Web3j web3j;

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private UserEventPort userEventPort;

    @Mock
    private Flowable<Log> flowable;

    @Captor
    private ArgumentCaptor<EthFilter> filterCaptor;

    private BlockchainEventListener listener;

    @BeforeEach
    void setUp() {
        listener = new BlockchainEventListener(web3j, userRepository, userEventPort);
        ReflectionTestUtils.setField(listener, "contractAddress", "0x1234567890abcdef1234567890abcdef12345678");
    }

    @Test
    void shouldSubscribeToEthLogFlowableWhenStarted() {
        when(web3j.ethLogFlowable(any(EthFilter.class))).thenReturn(Flowable.<Log>empty());

        listener.startListening();

        verify(web3j).ethLogFlowable(filterCaptor.capture());
        EthFilter captured = filterCaptor.getValue();

        assertThat(captured.getAddress()).containsExactly("0x1234567890abcdef1234567890abcdef12345678");
        assertThat(captured.getTopics()).hasSize(1);
    }

    @Test
    void shouldPersistUserWhenUserRegisteredEventIsReceived() throws Exception {
        when(userRepository.existsByAddress("0x1234567890abcdef1234567890abcdef12345678")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var signature = EventEncoder.encode(new Event(
                "UserRegistered",
                List.of(
                        ADDRESS_REFERENCE,
                        UTF8_STRING_REFERENCE,
                        UINT8_REFERENCE
                )
        ));

        var log = new Log();
        log.setTopics(List.of(signature, "0x0000000000000000000000001234567890abcdef1234567890abcdef12345678"));
        log.setData(FunctionEncoder.encodeConstructor(List.of(new Utf8String("alice"), new Uint8(1))));
        log.setTransactionHash("0xabcdef");

        Method handler = BlockchainEventListener.class.getDeclaredMethod("handleUserRegisteredEvent", Log.class);
        handler.setAccessible(true);
        handler.invoke(listener, log);

        verify(userRepository).save(any(User.class));
        verify(userEventPort).publish(any(User.class));
    }
}
