package com.impactledger.infrastructure.blockchain;

import com.impactledger.domain.exception.InvalidSignatureException;
import com.impactledger.domain.port.out.SignatureVerifierPort;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.web3j.crypto.Keys;
import org.web3j.crypto.Sign;
import org.web3j.utils.Numeric;

import java.util.Arrays;

/**
 * Adaptador de infraestrutura que implementa SignatureVerifierPort via Web3j.
 * A camada de aplicação nunca importa esta classe — só a porta.
 */
@Slf4j
@Component
public class SignatureVerifier implements SignatureVerifierPort {

    private static final int V_OFFSET         = 64;
    private static final int R_START          = 0;
    private static final int R_END            = 32;
    private static final int S_END            = 64;
    private static final byte V_LEGACY_OFFSET = 27;

    @Override
    public String recoverAddress(String message, String signature) {
        try {
            var sigBytes = Numeric.hexStringToByteArray(signature);
            var sigData  = buildSignatureData(sigBytes);
            var pubKey   = Sign.signedPrefixedMessageToKey(message.getBytes(), sigData);
            return "0x" + Keys.getAddress(pubKey);
        } catch (Exception e) {
            log.error("Falha ao recuperar endereço da assinatura: {}", e.getMessage());
            throw new InvalidSignatureException();
        }
    }

    private Sign.SignatureData buildSignatureData(byte[] sigBytes) {
        byte v = sigBytes[V_OFFSET];
        if (v < V_LEGACY_OFFSET) v += V_LEGACY_OFFSET;
        return new Sign.SignatureData(
                v,
                Arrays.copyOfRange(sigBytes, R_START, R_END),
                Arrays.copyOfRange(sigBytes, R_END,   S_END)
        );
    }
}
