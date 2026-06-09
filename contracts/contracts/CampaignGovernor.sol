// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import { ISignUp } from "./SignUp.sol";
import { ICampaign } from "./Campaign.sol";

/**
 * @title IDonate
 * @dev Interface mínima do contrato Donate.
 * Necessária para que o CampaignGovernor consiga codificar a chamada
 * de releaseFunds() no calldata da proposta.
 */
interface IDonate {
    function releaseFunds(uint256 campaignId, address payable ongWallet, uint256 amount) external;
}

/**
 * @title CampaignGovernor
 * @dev Contrato de governança baseado no padrão OpenZeppelin Governor.
 *
 * Fluxo de votação para saque de fundos:
 *
 * 1. ONG chama requestWithdrawal(campaignId, ongWallet, amount, "Descrição")
 *    → O contrato valida que a ONG é criadora da campanha e que o valor
 *      não excede o arrecadado.
 *    → Uma proposta é criada com o calldata de Donate.releaseFunds().
 *
 * 2. Doadores votam usando o poder de voto do ImpactToken
 *    (proporcional às doações feitas).
 *
 * 3. Após o período de votação, qualquer um pode chamar execute()
 *    → Se aprovada: o Governor chama Donate.releaseFunds()
 *    → ETH é transferido da custódia do Donate para a carteira da ONG.
 *
 * Parâmetros de votação (ajustados para demo do hackathon na Sepolia):
 *   - votingDelay:  0 blocos   (votação começa imediatamente)
 *   - votingPeriod: 50 blocos  (~10 minutos a 12s/bloco)
 *   - quorum:       1e15 wei   (0.001 ETH em ImpactToken)
 */
contract CampaignGovernor is Governor, GovernorSettings, GovernorCountingSimple, GovernorVotes {

    /**
     * @dev Referência ao contrato de registro de usuários.
     * Utilizado para verificar que apenas ONGs podem solicitar saques.
     */
    ISignUp private signUpContract;

    /**
     * @dev Referência ao contrato de campanhas.
     * Utilizado para validar o criador e o valor arrecadado antes de criar a proposta.
     */
    ICampaign private campaignContract;

    /**
     * @dev Referência ao contrato de doações (escrow).
     * O endereço é usado como target da proposta para chamar releaseFunds().
     */
    IDonate private donateContract;


    /**
     * @dev Emitido quando uma ONG solicita o saque de uma campanha,
     * registrando na blockchain a associação entre a proposta e a campanha.
     *
     * @param proposalId ID da proposta criada no Governor.
     * @param campaignId ID da campanha para a qual o saque foi solicitado.
     * @param ongWallet  Endereço que receberá os fundos se a proposta passar.
     * @param amount     Valor solicitado (em Wei).
     */
    event WithdrawalRequested(
        uint256 indexed proposalId,
        uint256 indexed campaignId,
        address indexed ongWallet,
        uint256 amount
    );


    /**
     * @dev Inicializa o contrato com os endereços de todos os contratos dependentes.
     *
     * @param _token           Endereço do ImpactToken (ERC20Votes) — define o poder de voto.
     * @param _signUpContract  Endereço do contrato SignUp — para verificar ONGs.
     * @param _campaignContract Endereço do contrato Campaign — para validar campanhas.
     * @param _donateContract  Endereço do contrato Donate — target do releaseFunds().
     */
    constructor(
        IVotes _token,
        address _signUpContract,
        address _campaignContract,
        address _donateContract
    )
        Governor("CampaignGovernor")
        GovernorSettings(
            0,   // votingDelay:  0 blocos — votação começa no bloco seguinte ao da proposta
            50,  // votingPeriod: 50 blocos ≈ 10 minutos na Sepolia (12s/bloco)
            0    // proposalThreshold: sem mínimo de tokens para criar proposta genérica
        )
        GovernorVotes(_token)
    {
        signUpContract = ISignUp(_signUpContract);
        campaignContract = ICampaign(_campaignContract);
        donateContract = IDonate(_donateContract);
    }


    // ==========================================================
    // FUNÇÃO PRINCIPAL: SOLICITAÇÃO DE SAQUE
    // ==========================================================

    /**
     * @dev Permite que uma ONG solicite o saque dos fundos arrecadados em uma campanha.
     *
     * Esta função é o ponto de entrada para o fluxo de governança. Ela:
     * 1. Valida que o chamador é uma ONG registrada.
     * 2. Valida que a campanha pertence à ONG.
     * 3. Valida que o valor solicitado não excede o arrecadado (anti-fraude).
     * 4. Codifica automaticamente o calldata de Donate.releaseFunds().
     * 5. Cria a proposta no Governor via propose().
     *
     * @param _campaignId  ID da campanha para a qual o saque está sendo solicitado.
     * @param _ongWallet   Endereço da carteira da ONG que receberá os fundos.
     * @param _amount      Valor a ser sacado (em Wei).
     * @param _description Descrição da proposta (ex: "Compra de alimentos — Nota Fiscal #123").
     * @return proposalId  ID da proposta criada no Governor.
     */
    function requestWithdrawal(
        uint256 _campaignId,
        address payable _ongWallet,
        uint256 _amount,
        string memory _description
    ) public returns (uint256) {
        // Apenas ONGs registradas podem solicitar saque
        require(
            signUpContract.isONG(msg.sender),
            "CampaignGovernor: apenas ONGs registradas podem solicitar saque."
        );

        // Apenas o criador da campanha pode solicitar o saque dela
        require(
            campaignContract.getCampaignCreator(_campaignId) == msg.sender,
            "CampaignGovernor: apenas o criador da campanha pode solicitar o saque."
        );

        // Anti-fraude: impede que a ONG solicite mais do que o arrecadado
        require(
            _amount <= campaignContract.getCampaignCurrentAmount(_campaignId),
            "CampaignGovernor: valor solicitado excede o total arrecadado na campanha."
        );

        require(_ongWallet != address(0), "CampaignGovernor: endereco da ONG invalido.");
        require(_amount > 0, "CampaignGovernor: o valor do saque deve ser maior que zero.");

        // Monta os arrays no formato esperado pelo Governor.propose()
        address[] memory targets = new address[](1);
        uint256[] memory values  = new uint256[](1);
        bytes[]   memory calldatas = new bytes[](1);

        // Target: o contrato Donate (que custodia os fundos)
        targets[0] = address(donateContract);
        // Value: 0 (nenhum ETH enviado junto — o ETH já está no Donate)
        values[0] = 0;
        // Calldata: codifica a chamada releaseFunds(campaignId, ongWallet, amount)
        calldatas[0] = abi.encodeWithSignature(
            "releaseFunds(uint256,address,uint256)",
            _campaignId,
            _ongWallet,
            _amount
        );

        uint256 proposalId = propose(targets, values, calldatas, _description);

        emit WithdrawalRequested(proposalId, _campaignId, _ongWallet, _amount);

        return proposalId;
    }


    // ==========================================================
    // QUÓRUM
    // ==========================================================

    /**
     * @dev Quórum mínimo de ImpactTokens para que uma proposta seja válida.
     *
     * Valor: 1e15 wei = 0.001 ETH em ImpactToken.
     * Como o ImpactToken é mintado 1:1 com Wei doados, isso equivale
     * a 0.001 ETH em doações participando da votação.
     *
     * Para produção, esse valor seria muito maior. Ajustado para o demo.
     *
     * @param  (timepoint) Parâmetro obrigatório do OZ Governor v5 — não utilizado aqui.
     * @return Quórum mínimo em unidades de ImpactToken (Wei).
     */
    function quorum(uint256) public pure override returns (uint256) {
        return 1e15;
    }


    // ==========================================================
    // OVERRIDES OBRIGATÓRIOS DO OPENZEPPELIN V5
    // ==========================================================

    function votingDelay()
        public view override(Governor, GovernorSettings) returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public view override(Governor, GovernorSettings) returns (uint256)
    {
        return super.votingPeriod();
    }

    function proposalThreshold()
        public view override(Governor, GovernorSettings) returns (uint256)
    {
        return super.proposalThreshold();
    }

    function state(uint256 proposalId)
        public view override(Governor) returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function proposalNeedsQueuing(uint256 proposalId)
        public view override(Governor) returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }

    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor) returns (uint48) {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor) {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor() internal view override(Governor) returns (address) {
        return super._executor();
    }
}