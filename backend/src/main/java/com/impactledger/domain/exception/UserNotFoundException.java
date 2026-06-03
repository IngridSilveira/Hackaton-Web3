package com.impactledger.domain.exception;

public class UserNotFoundException extends DomainException {
    public UserNotFoundException(String address) {
        super("Usuário não encontrado para o endereço: " + address);
    }
}
