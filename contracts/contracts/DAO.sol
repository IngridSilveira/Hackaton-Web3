// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


import { IVotes } from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import { Governor } from "@openzeppelin/contracts/governance/Governor.sol";
import { GovernorVotes } from "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import { GovernorCountingSimple } from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import { GovernorVotesQuorumFraction } from "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import { GovernorTimelockControl } from "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import { TimelockController } from "@openzeppelin/contracts/governance/TimelockController.sol";


interface IDAO {
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) external returns (uint256);
}


/**
 * @title DAO
 *
 * @dev Contrato de DAO. Ele é responsável por gerenciar as decisões da comunidade
 * em relação às campanhas e às ONGs. Esse contrato será utilizado para criar propostas,
 * de saques. Para liberar os fundos para as ONGs, os membros da comunidade poderão votar
 * nas propostas criadas.
 */
contract DAO is 
    Governor,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{

    /**
     * @dev Endereço do contrato de campanha. Ele é private porque ele só é 
     * utilizado internamente para validar as informações do usuário
     */
    address private campaignContractAddress;

    /**
     * @dev Endereço do proprietário do contrato. Ele é private porque ele só é 
     * utilizado internamente para validar as informações do usuário
     */
    address private owner;

    /**
     * @dev Construtor do contrato de DAO. Ele é responsável por inicializar 
     * o contrato com os parâmetros necessários.
     *
     * @param _token O contrato de token de votação.
     * @param _timelock O timelock controller.
     *
     * O Quorum é definido como 10% do total de tokens de votação, o que significa 
     * que para uma proposta ser aprovada, pelo menos 10% dos tokens de votação 
     * devem ser votados a favor da proposta.
     */
    constructor(IVotes _token, TimelockController _timelock)
        Governor("DAO")
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(10)
        GovernorTimelockControl(_timelock)
    {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Apenas o owner pode chamar essa funcao");
        _;
    }

    /**
     * @dev Modificador que restringe a chamada de uma função apenas ao contrato de campanha.
     */
    modifier onlyCampaignContract() {
        require(
            msg.sender == campaignContractAddress,
            "Apenas o contrato de campanha pode chamar essa funcao"
        );
        _;
    }

    /**
     * @dev Função para definir o endereço do contrato de campanha.
     * Essa função só pode ser chamada pelo owner do contrato.
     *
     * @param _campaignContractAddress O endereço do contrato de campanha.
     */
    function setCampaignContractAddress(address _campaignContractAddress) public onlyOwner {
        campaignContractAddress = _campaignContractAddress;
    }


    /**
     * @dev Função que vai definir o tempo até a votação começar depois de ser criada. 
     * Em blocos, 7200 equivale a 1 dia.
     *
     * @return O atraso de votação em blocos.
     */
    function votingDelay() public pure override returns (uint256) {
        /**
         * @dev 25 blocos equivale a aproximadamente cinco minutos..
         */
        return 25;
    }


    /**
     * @dev Função que vai definir o tempo de duração da votação.
     *
     * @return O período de votação em blocos.
     */
    function votingPeriod() public pure override returns (uint256) {
        /**
         * @dev 100 blocos equivale a aproximadamente 20 minutos.
         */
        return 100;
    }


    /**
     * @dev Função para criar uma proposta. Essa função só pode ser chamada 
     * pelo contrato de campanha, garantindo que apenas as campanhas criadas 
     * possam gerar propostas para votação. Ela recebe uma lista de endereços 
     * de contratos a serem chamados, os valores a serem enviados com cada 
     * chamada, os dados de chamada para cada transação e uma descrição 
     * da proposta. A função retorna o ID da proposta criada.
     *
     * @param targets Lista de endereços de contratos a serem chamados.
     * @param values Lista de valores a serem enviados com cada chamada.
     * @param calldatas Lista de dados de chamada para cada transação.
     * @param description Descrição da proposta.
     * @return O ID da proposta criada.
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override onlyCampaignContract returns (uint256) {
        return super.propose(targets, values, calldatas, description);
    }


    /**
     * @dev Retorna o estado da proposta (Pending, Active, Succeeded, Executed)
     */
    function state(uint256 proposalId) public view override(Governor, GovernorTimelockControl) returns (ProposalState) {
        return super.state(proposalId);
    }

    /**
     * @dev Diz se a proposta precisa passar pelo time lock antes de executar.
     */
    function proposalNeedsQueuing(uint256 proposalId) public view virtual override(Governor, GovernorTimelockControl) returns (bool) {
        return super.proposalNeedsQueuing(proposalId);
    }


    function _executor() 
        internal 
        view 
        virtual 
        override (Governor, GovernorTimelockControl) 
        returns (address) 
    {
        return super._executor();
    }


    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal virtual override (Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }


    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal virtual override (Governor, GovernorTimelockControl) {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }


    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal virtual override (Governor, GovernorTimelockControl) returns (uint48) {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

}