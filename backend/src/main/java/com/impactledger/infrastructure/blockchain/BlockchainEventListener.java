package com.impactledger.infrastructure.blockchain;

import com.impactledger.domain.entity.User;
import com.impactledger.domain.entity.UserType;
import com.impactledger.domain.port.out.UserEventPort;
import com.impactledger.domain.port.out.UserRepositoryPort;
import com.impactledger.domain.valueobject.WalletAddress;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.web3j.abi.EventEncoder;
import org.web3j.abi.FunctionReturnDecoder;
import org.web3j.abi.TypeReference;
import org.web3j.abi.datatypes.Event;
import org.web3j.abi.datatypes.Utf8String;
import org.web3j.abi.datatypes.generated.Uint8;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameterName;
import org.web3j.protocol.core.methods.request.EthFilter;
import org.web3j.protocol.core.methods.response.Log;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class BlockchainEventListener {

    private static final int   TOPIC_INDEX_ADDRESS = 1;
    private static final int   ADDRESS_TOPIC_START = 26;
    private static final Event USER_REGISTERED_EVENT = new Event(
            "UserRegistered",
            List.of(
                    new TypeReference<org.web3j.abi.datatypes.Address>(true) {},
                    new TypeReference<Utf8String>() {},
                    new TypeReference<Uint8>() {}
            )
    );

    private final Web3j              web3j;
    private final UserRepositoryPort userRepository;
    private final UserEventPort      userEventPort;

    @Value("${web3.contract-address}")
    private String contractAddress;

    @PostConstruct
    public void startListening() {
        log.info("Listener ativado para o contrato {}", contractAddress);
        web3j.ethLogFlowable(buildFilter())
                .subscribe(
                        this::handleUserRegisteredEvent,
                        error -> log.error("Erro no listener: {}", error.getMessage())
                );
    }

    private void handleUserRegisteredEvent(Log ethLog) {
        try {
            processEvent(ethLog);
        } catch (Exception e) {
            log.error("Erro ao processar evento UserRegistered: {}", e.getMessage(), e);
        }
    }

    private void processEvent(Log ethLog) {
        var address = extractWalletAddress(ethLog);
        if (isDuplicate(address)) return;

        var decoded = decodeNonIndexedParams(ethLog);
        var user    = buildUser(address, decoded, ethLog.getTransactionHash());
        var saved   = userRepository.save(user);
        userEventPort.publish(saved);

        log.info("Usuário indexado: {} ({}) — tx: {}",
                user.getUsername(), user.getUserType(), ethLog.getTransactionHash());
    }

    private boolean isDuplicate(WalletAddress address) {
        if (userRepository.existsByAddress(address.value())) {
            log.debug("Usuário {} já indexado, ignorando duplicata", address);
            return true;
        }
        return false;
    }

    private User buildUser(WalletAddress address, List<?> decoded, String txHash) {
        // Cast para os tipos Web3j corretos antes de chamar .getValue()
        var usernameType = (Utf8String) decoded.get(0);
        var userTypeVal  = (Uint8)      decoded.get(1);

        return User.builder()
                .address(address.value())
                .username(usernameType.getValue())
                .userType(UserType.fromIndex(userTypeVal.getValue().intValue()))
                .txHash(txHash)
                .build();
    }

    private WalletAddress extractWalletAddress(Log ethLog) {
        return new WalletAddress("0x" + ethLog.getTopics()
                .get(TOPIC_INDEX_ADDRESS)
                .substring(ADDRESS_TOPIC_START));
    }

    private List<?> decodeNonIndexedParams(Log ethLog) {
        return FunctionReturnDecoder.decode(
                ethLog.getData(),
                USER_REGISTERED_EVENT.getNonIndexedParameters()
        );
    }

    private EthFilter buildFilter() {
        var filter = new EthFilter(
                DefaultBlockParameterName.LATEST,
                DefaultBlockParameterName.LATEST,
                contractAddress
        );
        filter.addSingleTopic(EventEncoder.encode(USER_REGISTERED_EVENT));
        return filter;
    }
}