# ⚡ QUICK REFERENCE - GOVERNANCE IMPLEMENTATION

## 📍 Mapa Mental: Tudo em Uma Página

```
IMPACTLEDGER GOVERNANCE STACK
├─ SignUp.sol (usuários)
│  └─ Registra ONGs/Donors (sem alteração)
│
├─ ImpactGovernor.sol (votação)
│  ├─ 1 address = 1 voto
│  ├─ 7 dias voting
│  ├─ 7 dias timelock
│  └─ Integrado com SignUp
│
├─ GovernanceRegistry.sol (reputação)
│  ├─ Reputação 0-100
│  ├─ Sybil detection
│  └─ Proposer validation
│
├─ TimelockController.sol (segurança)
│  ├─ 7 dias delay
│  ├─ Valida antes de executar
│  └─ Imutável (não pode ser cancelado)
│
└─ Campaign.sol + Donate.sol (governados)
   ├─ Podem ter parâmetros mudados por propostas
   └─ Via Timelock
```

---

## 🔧 Setup em 5 Passos

### Passo 1: Deploy Timelock
```solidity
TimelockController timelock = new TimelockController(
    7 days,           // delay
    [],               // proposers
    [],               // executors
    msg.sender        // admin
);
```

### Passo 2: Deploy GovernanceRegistry
```solidity
GovernanceRegistry registry = new GovernanceRegistry(
    signUpAddress
);
```

### Passo 3: Deploy ImpactGovernor
```solidity
ImpactGovernor governor = new ImpactGovernor(
    signUpAddress,
    timelockAddress
);
```

### Passo 4: Setup Relationships
```solidity
registry.setGovernorContract(governorAddress);
// Optional:
// campaign.setTimelockAndGovernance(timelockAddress, registryAddress);
```

### Passo 5: Inicializar Reputação
```solidity
// Give founding ONGs reputation
for (let ong of foundingONGs) {
    registry.incrementReputation(ong, 5, "Founding ONG");
}
```

---

## 🗳️ Fluxo de Proposta (3 Minutos)

```
T+0: ONG Cria Proposta
    governor.propose(targets, values, signatures, calldatas, description)
         ↓
T+1: Votação Começa (após 1 bloco)
    governor.castVote(proposalId, support)  // 0=against, 1=for, 2=abstain
         ↓
T+7 dias: Votação Termina
    governor.countVotes(proposalId)
         ↓
T+7 a T+14 dias: Timelock (Segurança)
    Comunidade pode fork se discordar
         ↓
T+14: Executa
    governor.execute(proposalId)
    ✅ Proposta executada!
```

---

## 🔐 Segurança - Checklist

### ✅ Antes de Deploy

- [ ] ImpactGovernor tem ACCESS_CONTROL roles?
  ```solidity
  ✓ PROPOSER_ROLE
  ✓ EXECUTOR_ROLE
  ✓ REPUTATION_ADMIN
  ```

- [ ] GovernanceRegistry integrado?
  ```solidity
  ✓ setGovernorContract(address)
  ✓ Reputação mínima para proposer?
  ```

- [ ] Timelock setup correto?
  ```solidity
  ✓ Delay = 7 dias
  ✓ Proposers = [] (qualquer um)
  ✓ Executors = [] (qualquer um)
  ```

- [ ] Testes passam?
  ```bash
  npm test -- --grep "Governance"
  ```

### ✅ Após Deploy

- [ ] Governor pode ser chamado?
- [ ] Registry inicializado com ONGs?
- [ ] Timelock delay testado?
- [ ] Proposta e2e funciona?

---

## 📝 Exemplos de Propostas

### Proposta 1: Mudar Deadline
```solidity
governor.propose(
    targets: [campaignAddress],
    values: [0],
    signatures: ["updateCampaignDeadline(uint256,uint256)"],
    calldatas: [abi.encode(campaignId, 7 days)],
    description: "Extend Campaign 5 deadline by 7 days"
)
```

### Proposta 2: Ativar Fee
```solidity
governor.propose(
    targets: [donateAddress],
    values: [0],
    signatures: ["updateFeePercentage(uint256)"],
    calldatas: [abi.encode(1)],
    description: "Enable 1% platform fee"
)
```

### Proposta 3: Dar Reputação
```solidity
governor.propose(
    targets: [registryAddress],
    values: [0],
    signatures: ["incrementReputation(address,uint256,string)"],
    calldatas: [abi.encode(ongAddress, 5, "Founding ONG")],
    description: "Recognize ONG as founder"
)
```

---

## 🐛 Troubleshooting (30 segundos)

| Erro | Solução |
|------|---------|
| "Only Governor can call" | Setou `setGovernorContract()`? |
| "Proposal not found" | ProposalId está correto? |
| "Voting has not started" | Aguarde 1 bloco após criar |
| "Already voted" | Tentou votar 2x? |
| "Timelock delay not met" | Aguarde 7 dias ou reduza em testes |
| "Must be registered" | Registrou em SignUp? |
| "Only ONGs can propose" | Verificou userType == ONG? |

---

## 📊 Métricas & Limites

```
┌─────────────────────────────────────────┐
│        GOVERNANÇA - PARÂMETROS          │
├─────────────────────────────────────────┤
│                                         │
│ Voting Period:       7 dias             │
│ Voting Delay:        1 bloco            │
│ Timelock Delay:      7 dias             │
│ Min Quorum:          10 votos           │
│ Min Reputation:      5 (para proposer)  │
│ Max Actions/Prop:    10                 │
│ Max Reputation:      100                │
│ Proposer Cooldown:   1 dia              │
│ Max Proposals/ONG:   5 simultâneas      │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔗 Integração Rápida

### Com Campaign.sol
```solidity
// Adicionar ao Campaign.sol

modifier onlyTimelock() {
    require(msg.sender == address(timelockController), "Only Timelock");
    _;
}

function updateCampaignDeadline(
    uint256 _campaignId,
    uint256 _extension
) public onlyTimelock {
    campaigns[_campaignId].deadline += _extension;
}
```

### Com Donate.sol
```solidity
// Adicionar ao Donate.sol

uint256 public feePercentage;

function updateFeePercentage(uint256 newFee) public onlyTimelock {
    feePercentage = newFee;
}

// Depois em donate():
uint256 fee = (msg.value * feePercentage) / 100;
```

---

## 🎯 Decisão Rápida

### Qual modelo usar?
```
ImpactLedger = "1 address = 1 voto"

Porque?
✓ Democrático
✓ Simples
✓ Seguro
✓ Escalável

Quando mudar?
→ Phase 2: Adicionar token + vote escrow
→ Phase 3: Delegated voting
```

---

## 📞 Contato Rápido

### Preciso de ajuda com...

| Tópico | Arquivo |
|--------|---------|
| Arquitetura geral | GOVERNANCE_ARCHITECTURE.md |
| Implementação passo-a-passo | GOVERNANCE_IMPLEMENTATION_GUIDE.md |
| Segurança | GOVERNANCE_ARCHITECTURE.md (Etapa 4) |
| Código Solidity | ImpactGovernor.sol + comentários |
| Testes | Governance.ts |
| Modificações Campaign | GOVERNANCE_CAMPAIGN_MODIFICATIONS.md |
| Resumo executivo | GOVERNANCE_EXECUTIVE_SUMMARY.md |

---

## ✅ Pre-Deploy Checklist

```
ANTES DE FAZER DEPLOY PARA TESTNET/MAINNET:

Code Review:
  ☐ ImpactGovernor.sol auditado
  ☐ GovernanceRegistry.sol auditado
  ☐ Testes passam 100%
  ☐ Gas optimization feito

Segurança:
  ☐ Timelock setup correto
  ☐ Access control tight
  ☐ Reputação inicial setada
  ☐ Nenhum owner backdoors

Documentação:
  ☐ Endereços documentados
  ☐ Parâmetros documentados
  ☐ Fluxos documentados
  ☐ Roadmap futuro claro

Testing:
  ☐ E2E proposta funciona
  ☐ Votação funciona
  ☐ Execution funciona
  ☐ Edge cases testados

Comunidade:
  ☐ Governança apresentada
  ☐ Feedback coletado
  ☐ Ajustes feitos
  ☐ Go/No-go decision
```

---

## 🚀 Go Live!

### Então está pronto?

```
✅ YES!

1. Deploy Timelock + Registry + Governor
2. Setup relationships
3. Inicializar ONGs com reputação
4. Comunicar comunidade
5. Primeira proposta de teste
6. Ajustar se necessário
7. Continuar com Phase 2
```

---

**Pronto para implementar? Comece com GOVERNANCE_IMPLEMENTATION_GUIDE.md**

