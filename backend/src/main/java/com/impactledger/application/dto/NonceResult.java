package com.impactledger.application.dto;

/**
 * Resultado da geração de nonce — transporta os dados entre
 * camada de aplicação e adaptador web sem expor a entidade.
 */
public record NonceResult(String nonce, String messageToSign) {}
