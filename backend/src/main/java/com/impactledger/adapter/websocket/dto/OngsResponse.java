package com.impactledger.adapter.websocket.dto;

import java.util.List;

/**
 * Resposta da listagem de ONGs via WebSocket.
 * Nested record Item evita criar um arquivo separado para um tipo tão simples.
 */
public record OngsResponse(List<Item> ongs, int total) {

    public OngsResponse(List<Item> ongs) {
        this(ongs, ongs.size());
    }

    public record Item(String address, String username) {}
}
