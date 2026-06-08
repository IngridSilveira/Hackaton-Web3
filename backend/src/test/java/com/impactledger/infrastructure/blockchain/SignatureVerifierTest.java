package com.impactledger.infrastructure.blockchain;

import com.impactledger.domain.exception.InvalidSignatureException;
import org.junit.jupiter.api.Test;
import org.web3j.crypto.ECKeyPair;
import org.web3j.crypto.Keys;
import org.web3j.crypto.Sign;
import org.web3j.utils.Numeric;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SignatureVerifierTest {

    private final SignatureVerifier verifier = new SignatureVerifier();

    @Test
    void shouldRecoverAddressFromValidSignature() throws Exception {
        var keyPair = Keys.createEcKeyPair();
        var expectedAddress = "0x" + Keys.getAddress(keyPair.getPublicKey());
        var message = "ImpactLedger test message";

        var signatureData = Sign.signPrefixedMessage(message.getBytes(StandardCharsets.UTF_8), keyPair);
        var signatureBytes = new byte[65];
        System.arraycopy(signatureData.getR(), 0, signatureBytes, 0, 32);
        System.arraycopy(signatureData.getS(), 0, signatureBytes, 32, 32);
        var vBytes = signatureData.getV();
        signatureBytes[64] = vBytes[vBytes.length - 1];
        var signature = Numeric.toHexString(signatureBytes);

        var recoveredAddress = verifier.recoverAddress(message, signature);

        assertThat(recoveredAddress).isEqualTo(expectedAddress);
    }

    @Test
    void shouldThrowInvalidSignatureExceptionForMalformedSignature() {
        assertThatThrownBy(() -> verifier.recoverAddress("hello world", "0x1234"))
                .isInstanceOf(InvalidSignatureException.class);
    }
}
