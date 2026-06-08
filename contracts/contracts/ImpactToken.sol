// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ImpactToken is ERC20, ERC20Permit, ERC20Votes, Ownable {
    
    constructor() ERC20("ImpactToken", "IMPACT") ERC20Permit("ImpactToken") Ownable(msg.sender) {}

    // Apenas o dono (que será o contrato Donate) pode mintar novos tokens
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // Funções obrigatórias exigidas pelo OpenZeppelin para o funcionamento dos votos
    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }

    function nonces(address owner) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}