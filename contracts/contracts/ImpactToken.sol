// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ImpactToken is ERC20, ERC20Permit, ERC20Votes, Ownable {
    
    constructor() ERC20("ImpactToken", "IMPACT") ERC20Permit("ImpactToken") Ownable(msg.sender) {}

    /**
     * @dev Cria novos tokens para o destinatário e ativa automaticamente
     * o poder de voto. Sem a delegação, o saldo existe mas não conta
     * como voto no Governor — o doador precisaria chamar delegate() manualmente.
     * 
     * A delegação automática ocorre apenas na primeira vez que o endereço recebe tokens
     * (delegates(to) == address(0) indica que ainda não delegou para ninguém).
     *
     * @param to Endereço que receberá os tokens.
     * @param amount Quantidade de tokens a cunhar (em Wei, proporcional à doação em ETH).
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
        // Auto-delega votos ao próprio destinatário na primeira vez que recebe tokens
        if (delegates(to) == address(0)) {
            _delegate(to, to);
        }
    }

    // Funções obrigatórias exigidas pelo OpenZeppelin para o funcionamento dos votos
    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }

    function nonces(address owner) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}