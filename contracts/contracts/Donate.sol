// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { ICampaign } from "./Campaign.sol";
import { ImpactToken } from "./ImpactToken.sol";

/**
 * @title Donate 
 *
 * @dev Contrato de doações e gestão financeira do ecossistema.
 * Ele é responsável por receber as doações em moeda nativa feitas pelos usuários,
 * emitir o token de governança proporcional ao valor doado e manter a custódia 
 * dos fundos até que a DAO aprove a liberação para a ONG correspondente.
 */
contract Donate is Ownable, ReentrancyGuard {

    /**
     * @dev Interface do contrato de Campaign.
     * Utilizada internamente para verificar o estado das campanhas antes de aceitar uma doação
     * e atualizar o valor arrecadado nas campanhas correspondentes.
     */
    ICampaign private campaignContract;

    /**
     * @dev Instância do contrato do Token de Governança (ImpactToken).
     * Utilizada para cunhar (mintar) tokens de poder de voto para os doadores 
     * como recompensa por sua participação financeira.
     */
    ImpactToken public impactToken;

    /**
     * @dev Endereço do contrato Governor (DAO).
     * Este endereço detém a permissão exclusiva para invocar a função de liberação de fundos.
     */
    address public governorContract;

    /**
     * @dev Mapeamento que armazena o valor total das doações recebidas para cada campanha.
     * O primeiro uint256 é o ID da campanha, que aponta para o endereço do doador, 
     * que por sua vez aponta para o valor total das doações feitas.
     */
    mapping(uint256 => mapping(address => uint256)) private donationsByCampaign;

    /**
     * @dev Mapeamento para garantir que os fundos de uma campanha sejam sacados apenas uma vez.
     * Retorna true se os fundos da campanha já foram transferidos para a ONG.
     */
    mapping(uint256 => bool) public fundsReleased;

    /**
     * @dev Evento emitido quando uma doação é recebida com sucesso.
     *
     * @param campaignId O ID da campanha para a qual a doação foi feita.
     * @param donor O endereço do doador que fez a doação.
     * @param amount O valor da doação feita (em Wei).
     */
    event DonationReceived(uint256 indexed campaignId, address indexed donor, uint256 amount);

    /**
     * @dev Evento emitido quando a DAO aprova e executa o repasse dos fundos para a ONG.
     *
     * @param campaignId O ID da campanha referente aos fundos liberados.
     * @param ong O endereço da carteira da ONG que recebeu os fundos.
     * @param amount O valor total transferido (em Wei).
     */
    event FundsReleased(uint256 indexed campaignId, address indexed ong, uint256 amount);

    /**
     * @dev Construtor do contrato de Donate.
     * Define o proprietário do contrato e inicializa a referência ao token de governança.
     *
     * @param _impactTokenAddress O endereço do contrato ImpactToken (ERC20Votes) já deployado.
     */
    constructor(address _impactTokenAddress) Ownable(msg.sender) {
        impactToken = ImpactToken(_impactTokenAddress);
    }

    /**
     * @dev Define o contrato de Campaign para que o contrato de Donate possa interagir com ele.
     * Apenas o owner (deployer) pode realizar esta configuração inicial.
     *
     * @param _campaignContract O endereço do contrato de Campaign a ser definido.
     */
    function setCampaignContract(address _campaignContract) public onlyOwner {
        campaignContract = ICampaign(_campaignContract);
    }

    /**
     * @dev Define o contrato da DAO (Governor) que terá poder de autorizar saques.
     * Apenas o owner (deployer) pode realizar esta configuração inicial.
     *
     * @param _governorContract O endereço do contrato CampaignGovernor.
     */
    function setGovernorContract(address _governorContract) public onlyOwner {
        governorContract = _governorContract;
    }

    /**
     * @dev Realiza uma doação para uma campanha específica e emite tokens de voto.
     * Esta função exige que a campanha esteja aceitando doações. O doador recebe
     * tokens de governança na proporção exata do valor doado (1:1).
     * O modifier `nonReentrant` previne ataques de reentrada durante a doação.
     *
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

        // Atualiza o estado da campanha no contrato parceiro
        campaignContract.updateCurrentAmount(_campaignId, msg.value);
        
        // Registra a doação no mapeamento interno
        donationsByCampaign[_campaignId][msg.sender] += msg.value;

        // Cunhagem do token promocional de votação para a carteira do doador
        impactToken.mint(msg.sender, msg.value);

        emit DonationReceived(_campaignId, msg.sender, msg.value);
    }

    /**
     * @dev Transfere os fundos arrecadados de uma campanha para a carteira da ONG.
     * Esta função atua como um mecanismo de "Escrow" (garantia), garantindo que
     * os fundos só saiam do contrato quando a comunidade aprovar via governança.
     *
     * @param _campaignId O ID da campanha cujos fundos serão liberados.
     * @param _ongWallet O endereço pagável (payable) da ONG que receberá os fundos.
     * @param _amount A quantia exata a ser transferida.
     */
    function releaseFunds(uint256 _campaignId, address payable _ongWallet, uint256 _amount) public nonReentrant {
        // Validação estrita de Controle de Acesso: Apenas a DAO pode executar esta função
        require(
            msg.sender == governorContract, 
            "Acesso negado: Apenas a DAO pode liberar os fundos."
        );
        
        // Proteção contra duplo-saque
        require(
            !fundsReleased[_campaignId], 
            "Os fundos desta campanha ja foram sacados anteriormente."
        );

        // Atualiza o estado ANTES da transferência (Padrão Checks-Effects-Interactions)
        fundsReleased[_campaignId] = true;

        // Transfere a moeda nativa para a ONG usando call
        (bool success, ) = _ongWallet.call{value: _amount}("");
        require(success, "Falha na transferencia de fundos para a ONG.");

        emit FundsReleased(_campaignId, _ongWallet, _amount);
    }
}