package com.impactledger.domain.exception;

public class UserNotRegisteredOnChainException extends DomainException {
    public UserNotRegisteredOnChainException(String address) {
        super("Endereço ainda não registrado no contrato: " + address);
    }
}
