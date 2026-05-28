// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { ICampaign } from "./Campaign.sol";

/**
 * @title Donate 
 *
 * @dev Contrato de donate. Ele é responsável por receber as doações feitas
 * pelos usuários. Esse contrato deve verificar se a campanha para a qual a doação 
 * está sendo feita é válida e ativa e deve atualizar o valor arrecadado na campanha 
 * correspondente.
 */
contract Donate is Ownable, ReentrancyGuard {

    /**
     * @dev O contrato de Campaign é private porque ele só é utilizado 
     * internamente para verificar o estado das campanhas antes de aceitar uma doação.
     * E atualizar o valor arrecadado nas campanhas quando uma doação é feita.
     */
    ICampaign private campaignContract;


    /**
     * @dev Evento emitido quando uma doação é recebida.
     *
     * @param campaignId O ID da campanha para a qual a doação foi feita.
     * @param donor O endereço do doador que fez a doação.
     * @param amount O valor da doação feita.
     */
    event DonationReceived(uint256 indexed campaignId, address indexed donor, uint256 amount);


    /**
     * @dev Construtor do contrato de Donate. Ele é responsável por inicializar o contrato
     * de Donate definindo o proprietário do contrato como o endereço que o deployou. Isso 
     * é importante para garantir que apenas o proprietário do contrato possa definir o 
     * contrato de Campaign.
     */
    constructor() Ownable(msg.sender) {
    }


    /**
     * @dev Define o contrato de Campaign para que o contrato de Donate possa interagir com ele.
     * @param _campaignContract O endereço do contrato de Campaign a ser definido.
     */
    function setCampaignContract(address _campaignContract) public onlyOwner {
        campaignContract = ICampaign(_campaignContract);
    }


    /**
     * @dev Realiza uma doação para uma campanha específica.
     * @param _campaignId O ID da campanha para a qual a doação será feita.
     */
    function donate(uint256 _campaignId) public payable nonReentrant {
        require(
            campaignContract.campaignIsAcceptingDonations(_campaignId), 
            "Essa campanha nao esta aceitando doacoes no momento."
        );

        require(
            msg.value > 0, 
            "O valor da doacao deve ser maior que zero."
        );

        campaignContract.updateCurrentAmount(_campaignId, msg.value);
        
        emit DonationReceived(_campaignId, msg.sender, msg.value);
    }

}
