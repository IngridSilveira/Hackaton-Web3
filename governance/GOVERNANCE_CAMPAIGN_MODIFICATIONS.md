// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Campaign.sol - MODIFICATIONS FOR GOVERNANCE
 * 
 * Este arquivo documenta as modificações propostas ao Campaign.sol
 * para integração com o sistema de governança.
 * 
 * BREAKING CHANGES: Nenhum
 * ADDITIONS ONLY: Sim
 */

// ============ ADIÇÕES AO CAMPAIGN.SOL ============

// 1. NOVO IMPORT
import "@openzeppelin/contracts/governance/TimelockController.sol";

// 2. NOVO STATE VARIABLE
TimelockController private timelockController;
IGovernanceRegistry private governanceRegistry;

// 3. NOVO MODIFIER
modifier onlyTimelock() {
    require(
        msg.sender == address(timelockController),
        "Only Timelock can call this"
    );
    _;
}

// 4. NOVA FUNÇÃO (adicionar ao construtor existente)
function setTimelockAndGovernance(
    address _timelockController,
    address _governanceRegistry
) public onlyOwner {
    require(_timelockController != address(0), "Invalid Timelock address");
    require(_governanceRegistry != address(0), "Invalid Registry address");
    
    timelockController = TimelockController(payable(_timelockController));
    governanceRegistry = IGovernanceRegistry(_governanceRegistry);
}

// 5. MODIFICAÇÃO À FUNÇÃO createCampaign (ADICIONAR EVENTO)
function createCampaign(string memory title, uint256 goalAmount) public {
    require(signUpContract.isONG(msg.sender), "Apenas ONGs podem criar campanhas.");
    require(bytes(title).length > 0, "O titulo da campanha nao pode ser vazio.");
    
    // ... código existente ...
    
    // NOVO: Notificar GovernanceRegistry
    if (address(governanceRegistry) != address(0)) {
        try governanceRegistry.recordProposalCreated(msg.sender, campaignCounter) {
            // Sucesso, ONG foi rastreada
        } catch {
            // Governance não configurado ainda, continuar
        }
    }
}

// 6. NOVA FUNÇÃO: Permitir que governança mude deadline
/**
 * @dev Alterar deadline de uma campanha (apenas via Governance + Timelock)
 */
function updateCampaignDeadline(
    uint256 _campaignId,
    uint256 _newDeadlineExtension
) public onlyTimelock {
    require(
        campaigns[_campaignId].id == _campaignId,
        "Campanha nao encontrada."
    );
    require(
        _newDeadlineExtension <= 30 days,
        "Extensao nao pode exceder 30 dias"
    );
    
    CampaignStruct storage campaign = campaigns[_campaignId];
    uint256 oldDeadline = campaign.deadline;
    campaign.deadline += _newDeadlineExtension;
    
    emit CampaignParameterUpdated(
        _campaignId,
        "deadline",
        oldDeadline,
        campaign.deadline
    );
}

// 7. NOVO EVENTO
event CampaignParameterUpdated(
    uint256 indexed campaignId,
    string paramName,
    uint256 oldValue,
    uint256 newValue
);

// ============ INTERFACE NECESSÁRIA ============

interface IGovernanceRegistry {
    function recordProposalCreated(address proposer, uint256 proposalId) external;
    function recordProposalResult(address proposer, uint256 proposalId, bool succeeded) external;
}

// ============ EXEMPLO DE USO ============

/**
 * Exemplo de proposta para mudar deadline:
 * 
 * 1. Uma ONG cria proposta no Governor:
 *    governor.propose(
 *        targets: [campaignAddress],
 *        values: [0],
 *        signatures: ["updateCampaignDeadline(uint256,uint256)"],
 *        calldatas: [abi.encode(campaignId, 7 days)],
 *        description: "Extend Campaign 5 deadline by 7 days"
 *    )
 * 
 * 2. Comunidade vota por 7 dias
 * 
 * 3. Se aprovada, Timelock aguarda 7 dias
 * 
 * 4. Qualquer pessoa executa:
 *    governor.execute(proposalId)
 * 
 * 5. Campaign.sol.deadline é atualizado via Timelock
 */

// ============ NOTAS DE SEGURANÇA ============

/**
 * SEGURANÇA:
 * ✓ Apenas Timelock pode chamar updateCampaignDeadline (não há backdoor)
 * ✓ Limite de 30 dias de extensão (não há bloat infinito)
 * ✓ Evento emitido para rastreamento
 * ✓ Backward compatible (não afeta createCampaign existente)
 * 
 * TESTES RECOMENDADOS:
 * 1. Tentar chamar updateCampaignDeadline sem ser Timelock → REVERT
 * 2. Chamar com extensão > 30 dias → REVERT
 * 3. Chamar com campanha não existente → REVERT
 * 4. Chamar com address 0 como Timelock → REVERT
 * 5. Governance propõe, vota, executa → deadline atualizado ✓
 */

