package com.impactledger.adapter.web.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Payload de autenticação via carteira Ethereum.
 * A validação de formato do endereço acontece aqui (camada de entrada),
 * antes de chegar ao domínio — fail-fast com 400 em vez de 500.
 */
public record AuthRequest(

        @NotBlank(message = "address é obrigatório")
        @Pattern(
            regexp = "^0x[a-fA-F0-9]{40}$",
            message = "address deve ser um endereço Ethereum válido (0x seguido de 40 hex)"
        )
        String address,

        @NotBlank(message = "signature é obrigatória")
        String signature,

        @NotBlank(message = "message é obrigatória")
        String message
) {}
