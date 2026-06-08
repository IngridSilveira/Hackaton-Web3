// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { ISignUp } from "./SignUp.sol";

/**
 * @title GovernanceRegistry
 * @dev Registro de reputação e controle de proposers para ImpactLedger
 * 
 * Funções:
 * - Rastrear reputação de ONGs
 * - Validar elegibilidade de Proposer
 * - Executar Sybil attack prevention
 * - Manter histórico de atividade
 */
contract GovernanceRegistry is Ownable, ReentrancyGuard {
    
    // ============ CONSTANTS ============
    uint256 public constant MIN_REPUTATION_PROPOSER = 5;
    uint256 public constant MAX_REPUTATION = 100;
    uint256 public constant REPUTATION_DECAY_PERIOD = 365 days;  // Reputação decai anualmente
    int256 public constant REPUTATION_PENALTY = 10;              // Penalidade por fraude
    
    // ============ STATE VARIABLES ============
    ISignUp private signUpContract;
    address public governorContract;
    
    // ============ DATA STRUCTURES ============
    
    /**
     * @dev Registro de reputação de um endereço (ONG ou DONOR)
     */
    struct ReputationRecord {
        uint256 score;              // Pontuação de reputação (0-100)
        uint256 lastUpdated;        // Último update
        uint256 proposalCount;      // Quantas propostas criou
        uint256 successfulProposals;// Quantas foram aprovadas
        uint256 failedProposals;    // Quantas foram rejeitadas
        bool isSybilFlagged;        // Marcado como possível Sybil?
        uint256 sybilFlaggedAt;     // Quando foi marcado
        string[] reportedIssues;    // Histórico de problemas
    }
    
    /**
     * @dev Evento de Sybil suspeito (mesmo que múltiplas wallets)
     */
    struct SybilReport {
        address[] suspiciousAddresses;
        string reason;
        uint256 reportedAt;
        address reporter;
    }
    
    // ============ MAPPINGS ============
    mapping(address => ReputationRecord) public reputationRecords;
    mapping(uint256 => SybilReport) private sybilReports;
    mapping(address => address[]) public linkedAddresses;  // Wallets potencialmente ligadas
    
    // ============ EVENTS ============
    event ReputationUpdated(
        address indexed account,
        int256 change,
        string reason
    );
    
    event ProposalRecorded(
        address indexed proposer,
        uint256 proposalId,
        string outcome
    );
    
    event SybilAttackDetected(
        address indexed flaggedAddress,
        string reason
    );
    
    event SybilFlagCleared(address indexed account);
    
    event ReputationReset(address indexed account);
    
    // ============ MODIFIERS ============
    
    /**
     * @dev Apenas Governor pode chamar
     */
    modifier onlyGovernor() {
        require(
            msg.sender == governorContract || msg.sender == owner(),
            "Only Governor or Owner can call this"
        );
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    constructor(address _signUpContract) Ownable(msg.sender) {
        require(_signUpContract != address(0), "Invalid SignUp address");
        signUpContract = ISignUp(_signUpContract);
    }
    
    // ============ SETUP FUNCTIONS ============
    
    /**
     * @dev Setar endereço do Governor contract
     */
    function setGovernorContract(address _governorContract) external onlyOwner {
        require(_governorContract != address(0), "Invalid Governor address");
        governorContract = _governorContract;
    }
    
    // ============ REPUTATION MANAGEMENT ============
    
    /**
     * @dev Obter reputação atual de um endereço
     */
    function getReputation(address account) public view returns (uint256) {
        ReputationRecord memory record = reputationRecords[account];
        
        // Se nunca foi atualizado, iniciar com reputação 0
        if (record.lastUpdated == 0) {
            return 0;
        }
        
        // Se foi marcado como Sybil, reputação vai a zero
        if (record.isSybilFlagged) {
            return 0;
        }
        
        // TODO: Implementar decay de reputação ao longo do tempo
        // Se não foi ativo por > REPUTATION_DECAY_PERIOD, decai
        
        return record.score;
    }
    
    /**
     * @dev Validar se é elegível para ser Proposer
     */
    function isProposerEligible(address account) public view returns (bool) {
        // Precisa estar registrado
        try signUpContract.getUser(account) returns (ISignUp.User memory user) {
            // Precisa ser ONG
            if (user.userType != ISignUp.UserType.ONG) {
                return false;
            }
        } catch {
            return false;
        }
        
        // Precisa ter reputação >= MIN
        uint256 rep = getReputation(account);
        if (rep < MIN_REPUTATION_PROPOSER) {
            return false;
        }
        
        // Não pode estar marcado como Sybil
        if (reputationRecords[account].isSybilFlagged) {
            return false;
        }
        
        return true;
    }
    
    /**
     * @dev Incrementar reputação (recompensa por boa ação)
     */
    function incrementReputation(
        address account,
        uint256 amount,
        string calldata reason
    ) external onlyGovernor nonReentrant {
        require(account != address(0), "Invalid address");
        require(amount > 0 && amount <= 10, "Invalid reputation amount");
        
        ReputationRecord storage record = reputationRecords[account];
        
        // Garantir que não exceda MAX
        uint256 newScore = record.score + amount;
        if (newScore > MAX_REPUTATION) {
            newScore = MAX_REPUTATION;
        }
        
        int256 change = int256(newScore) - int256(record.score);
        record.score = newScore;
        record.lastUpdated = block.timestamp;
        
        emit ReputationUpdated(account, change, reason);
    }
    
    /**
     * @dev Decrementar reputação (penalidade por má ação)
     */
    function decrementReputation(
        address account,
        uint256 amount,
        string calldata reason
    ) external onlyGovernor nonReentrant {
        require(account != address(0), "Invalid address");
        require(amount > 0 && amount <= 10, "Invalid reputation amount");
        
        ReputationRecord storage record = reputationRecords[account];
        
        // Não pode ir abaixo de 0
        if (amount >= record.score) {
            record.score = 0;
        } else {
            record.score -= amount;
        }
        
        record.lastUpdated = block.timestamp;
        
        emit ReputationUpdated(account, -int256(amount), reason);
    }
    
    /**
     * @dev Resetar reputação para 0
     */
    function resetReputation(address account, string calldata reason) external onlyGovernor {
        require(account != address(0), "Invalid address");
        
        ReputationRecord storage record = reputationRecords[account];
        int256 change = -int256(record.score);
        record.score = 0;
        record.lastUpdated = block.timestamp;
        
        emit ReputationReset(account);
        emit ReputationUpdated(account, change, reason);
    }
    
    // ============ PROPOSAL TRACKING ============
    
    /**
     * @dev Registrar que uma proposta foi criada
     */
    function recordProposalCreated(
        address proposer,
        uint256 proposalId
    ) external onlyGovernor {
        require(proposer != address(0), "Invalid proposer");
        
        ReputationRecord storage record = reputationRecords[proposer];
        record.proposalCount++;
        record.lastUpdated = block.timestamp;
        
        // Inicializar se primeira vez
        if (record.score == 0 && record.lastUpdated == block.timestamp) {
            record.score = 1;  // ONGs começam com 1 reputação
        }
    }
    
    /**
     * @dev Registrar resultado de proposta
     */
    function recordProposalResult(
        address proposer,
        uint256 proposalId,
        bool succeeded
    ) external onlyGovernor {
        require(proposer != address(0), "Invalid proposer");
        
        ReputationRecord storage record = reputationRecords[proposer];
        
        if (succeeded) {
            record.successfulProposals++;
            // Recompensar com +1 reputação por proposta bem-sucedida
            if (record.score < MAX_REPUTATION) {
                record.score++;
            }
            emit ReputationUpdated(proposer, 1, "Proposal succeeded");
        } else {
            record.failedProposals++;
            // Penalizar com -1 reputação por proposta rejeitada
            if (record.score > 0) {
                record.score--;
            }
            emit ReputationUpdated(proposer, -1, "Proposal failed");
        }
        
        record.lastUpdated = block.timestamp;
    }
    
    // ============ SYBIL ATTACK DETECTION ============
    
    /**
     * @dev Detectar e marcar possível Sybil attack
     */
    function flagSybilAttack(
        address[] calldata suspiciousAddresses,
        string calldata reason
    ) external onlyGovernor {
        require(suspiciousAddresses.length >= 2, "Need at least 2 addresses for Sybil flag");
        require(suspiciousAddresses.length <= 100, "Too many addresses");
        
        // Marcar todas as addresses suspeitas
        for (uint256 i = 0; i < suspiciousAddresses.length; i++) {
            address addr = suspiciousAddresses[i];
            require(addr != address(0), "Invalid address");
            
            ReputationRecord storage record = reputationRecords[addr];
            record.isSybilFlagged = true;
            record.sybilFlaggedAt = block.timestamp;
            record.score = 0;
            
            emit SybilAttackDetected(addr, reason);
        }
        
        // Registrar padrão de Sybil
        // TODO: Implementar histórico de Sybil reports
    }
    
    /**
     * @dev Limpar marcação de Sybil (reabilitação)
     */
    function clearSybilFlag(address account) external onlyOwner {
        require(account != address(0), "Invalid address");
        
        ReputationRecord storage record = reputationRecords[account];
        record.isSybilFlagged = false;
        record.score = 0;
        
        emit SybilFlagCleared(account);
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Obter todas as informações de reputação
     */
    function getFullRecord(address account) external view returns (
        uint256 score,
        uint256 proposalCount,
        uint256 successfulProposals,
        uint256 failedProposals,
        bool isSybilFlagged,
        uint256 sybilFlaggedAt
    ) {
        ReputationRecord memory record = reputationRecords[account];
        return (
            record.score,
            record.proposalCount,
            record.successfulProposals,
            record.failedProposals,
            record.isSybilFlagged,
            record.sybilFlaggedAt
        );
    }
    
    /**
     * @dev Verificar se está marcado como Sybil
     */
    function isSybilFlagged(address account) public view returns (bool) {
        return reputationRecords[account].isSybilFlagged;
    }
    
    /**
     * @dev Obter taxa de sucesso de propostas
     */
    function getProposalSuccessRate(address account) external view returns (uint256) {
        ReputationRecord memory record = reputationRecords[account];
        
        uint256 totalProposals = record.proposalCount;
        if (totalProposals == 0) {
            return 0;
        }
        
        return (record.successfulProposals * 100) / totalProposals;
    }
}
