package com.impactledger.domain.exception;

public class InvalidSignatureException extends DomainException {
    public InvalidSignatureException() {
        super("Assinatura de carteira inválida ou não corresponde ao endereço informado.");
    }
}
