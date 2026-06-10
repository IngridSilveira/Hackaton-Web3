// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

import { Nonces } from "@openzeppelin/contracts/utils/Nonces.sol";


/**
 * @title IVoteToken
 * @dev Interface para o contrato de token de votação. Isso é utilizado
 * para o contrato de Donate interagir com o contrato de VoteToken 
 * sem precisar conhecer a implementação
 */
interface IVoteToken {
    function mint(address _to, uint256 _tokens) external;
    function burn(address _from, uint256 _tokens) external;
}


/**
 * @title VoteToken
 *
 * @dev Contrato de token ERC20 para votação. Ele é responsável por criar 
 * um token de votação. Esse token é utilizado para representar o poder de 
 * voto dos usuários nas decisões relacionadas às campanhas.
 */
contract VoteToken is ERC20, ERC20Permit, ERC20Votes, Ownable {
    
    constructor() Ownable(msg.sender) ERC20("Vote Token", "vVOTE") ERC20Permit("Vote Token")
    {}


    /**
     * @dev Função para fazer o mint de tokens. Apenas o proprietario pode chamar 
     * essa função.
     */
    function mint(address _to, uint256 _tokens) external onlyOwner {
        _mint(_to, _tokens);

        if (delegates(_to) == address(0))
            _delegate(_to, _to);
    }


    /**
     * @dev Função para queimar os tokens. Apenas o proprietario pode chamar 
     * essa função.
     */
    function burn(address _from, uint256 _tokens) external onlyOwner {
        _burn(_from, _tokens);
    }


    /**
     * @dev Override a documentação diz para sobrescrever.
     */
    function _update(address from, address to, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._update(from, to, amount);
    }

    function nonces(address owner) public view virtual override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}
