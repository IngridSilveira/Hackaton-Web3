package com.impactledger.adapter.web.controller;

import com.impactledger.adapter.web.dto.request.AuthRequest;
import com.impactledger.adapter.web.dto.response.JwtResponse;
import com.impactledger.adapter.web.dto.response.NonceResponse;
import com.impactledger.application.usecase.auth.AuthenticateWalletUseCase;
import com.impactledger.application.usecase.auth.GenerateNonceUseCase;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controlador de autenticação Web3.
 * Depende apenas das interfaces de caso de uso — nunca das implementações.
 * (Princípio da Inversão de Dependências)
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final GenerateNonceUseCase       generateNonceUseCase;
    private final AuthenticateWalletUseCase  authenticateWalletUseCase;

    @GetMapping("/nonce/{address}")
    public ResponseEntity<NonceResponse> getNonce(@PathVariable String address) {
        var result = generateNonceUseCase.execute(address);
        return ResponseEntity.ok(NonceResponse.from(result));
    }

    @PostMapping("/wallet")
    public ResponseEntity<JwtResponse> authenticate(@Valid @RequestBody AuthRequest request) {
        var result = authenticateWalletUseCase.execute(
                request.address(),
                request.signature(),
                request.message()
        );
        return ResponseEntity.ok(JwtResponse.from(result));
    }
}
