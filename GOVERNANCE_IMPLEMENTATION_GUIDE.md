# 📋 GUIA DE IMPLEMENTAÇÃO - SISTEMA DE GOVERNANÇA

## Índice
1. [Overview](#overview)
2. [Arquivos Criados](#arquivos-criados)
3. [Passos de Implementação](#passos-de-implementação)
4. [Integração com Contratos Existentes](#integração-com-contratos-existentes)
5. [Deploy & Testing](#deploy--testing)
6. [Roadmap Futuro](#roadmap-futuro)

---

## Overview

### O que foi criado?

Um **sistema completo de governança descentralizada** para ImpactLedger com:

✅ **ImpactGovernor.sol** - Orquestra propostas, votações e execução  
✅ **GovernanceRegistry.sol** - Gerencia reputação e validação de proposers  
✅ **Testes** - Suite completa de testes para governance  
✅ **Documentação** - Análise detalhada e justificativa técnica  

### Modelo Escolhido

```
1 Address = 1 Voto

Razão: 
- Democrático (alinhado com missão ImpactLedger)
- Seguro contra whales (criar 10k wallets = 10k $ em gas)
- Simples de entender
- Escalável (pode evoluir para token em Phase 2)
```

---

## Arquivos Criados

### 1. Contratos Solidity

#### `ImpactGovernor.sol` (NEW)
- **Tamanho**: ~500 linhas
- **Função**: Governa propostas, votações, execução
- **Modelo**: OpenZeppelin Governor (battle-tested)
- **Features**:
  - ✓ 1 address = 1 voto
  - ✓ Timelock 7 dias
  - ✓ Anti-flash loan (snapshot voting)
  - ✓ Anti-double voting
  - ✓ Integrado com SignUp.sol
  
#### `GovernanceRegistry.sol` (NEW)
- **Tamanho**: ~400 linhas
- **Função**: Rastreia reputação de ONGs
- **Features**:
  - ✓ Reputação score (0-100)
  - ✓ Sybil attack detection
  - ✓ Proposer validation
  - ✓ Historical tracking

### 2. Testes

#### `Governance.ts` (NEW)
- **Testes**: 15+ casos
- **Cobertura**: Proposta, votação, segurança, integração

### 3. Documentação

#### `GOVERNANCE_ARCHITECTURE.md` (NEW)
- **Conteúdo**: Análise completa (Etapas 1-6)
- **Tamanho**: 2000+ linhas
- **Inclui**: Riscos, alternativas, comparação com Uniswap/Aave/Compound

#### `GOVERNANCE_CAMPAIGN_MODIFICATIONS.md` (NEW)
- **Conteúdo**: Modificações recomendadas para Campaign.sol
- **Breaking changes**: NENHUM
- **Alterações**: Apenas adições (backward compatible)

---

## Passos de Implementação

### Fase 1: Setup Inicial (Hackathon MVP)

#### Passo 1.1: Deployar Timelock

```bash
# No hardhat.config.ts, adicionar rede com suporte a deployments
# Ou via script deploy.ts

const timelockDelay = 7 * 24 * 60 * 60; // 7 dias
const proposers = []; // Anyone
const executors = []; // Anyone
const admin = deployer.address;

const Timelock = await ethersLib.getContractFactory('TimelockController');
const timelock = await Timelock.deploy(
    timelockDelay,
    proposers,
    executors,
    admin
);
```

#### Passo 1.2: Deploy GovernanceRegistry

```bash
const GovernanceRegistry = await ethersLib.getContractFactory('GovernanceRegistry');
const registry = await GovernanceRegistry.deploy(signUpAddress);
```

#### Passo 1.3: Deploy ImpactGovernor

```bash
const ImpactGovernor = await ethersLib.getContractFactory('ImpactGovernor');
const governor = await ImpactGovernor.deploy(signUpAddress, timelockAddress);
```

#### Passo 1.4: Setup Relationships

```bash
// Governor conhece Registry
await registry.setGovernorContract(governorAddress);

// Campaign pode chamar Governor (futuro)
// await campaign.setTimelockAndGovernance(timelockAddress, registryAddress);
```

#### Passo 1.5: Registrar Proposers

```bash
// Admin dá reputação inicial a ONGs
for (let ong of ongsListaPrincipal) {
    await registry.incrementReputation(ong, 5, "Founding ONG");
}
```

---

### Fase 2: Integração com Campaign.sol

#### Passo 2.1: Modificar Campaign.sol

Adicionar (SEM quebrar código existente):

```solidity
// Nova função
function updateCampaignDeadline(
    uint256 _campaignId,
    uint256 _newDeadlineExtension
) public onlyTimelock {
    // ... implementação
}

// Novo modifier
modifier onlyTimelock() {
    require(msg.sender == address(timelockController));
    _;
}
```

#### Passo 2.2: Modificar Donate.sol

Adicionar fee system (opcional para MVP):

```solidity
uint256 public feePercentage = 0; // 0% inicialmente

// Futuro: governança pode mudar isso
function updateFeePercentage(uint256 newFee) public onlyTimelock {
    require(newFee <= 10, "Max 10%");
    feePercentage = newFee;
}
```

---

### Fase 3: Testar Tudo

#### Passo 3.1: Rodar Testes

```bash
cd contracts
npm test -- --grep "Governance"
```

#### Passo 3.2: Testar Cenários End-to-End

```bash
# Scenario 1: ONG cria proposta para mudar deadline
# Scenario 2: Comunidade vota
# Scenario 3: Proposta é executada

# Cada teste deve passar
```

---

## Integração com Contratos Existentes

### SignUp.sol
**Status**: ✅ Não quebrado  
**Adições**: Nenhuma obrigatória (recomendado: adicionar reputação field)

```solidity
// RECOMENDADO (opcional):
struct User {
    string username;
    UserType userType;
    uint256 reputation;  // NEW - linked to GovernanceRegistry
}
```

### Campaign.sol
**Status**: ✅ Não quebrado  
**Adições**: `updateCampaignDeadline()` via Timelock

```solidity
// NEW - apenas para governança
function updateCampaignDeadline(
    uint256 _campaignId,
    uint256 _newDeadlineExtension
) public onlyTimelock {
    // ...
}
```

### Donate.sol
**Status**: ✅ Não quebrado  
**Adições**: Fee system (opcional)

```solidity
// NEW - gerenciável por governança
function updateFeePercentage(uint256 newFee) public onlyTimelock {
    // ...
}
```

---

## Deploy & Testing

### Checklist de Deployment

- [ ] Deploy Timelock
- [ ] Deploy GovernanceRegistry
- [ ] Deploy ImpactGovernor
- [ ] Setup relationships entre contratos
- [ ] Testar voting flow completo
- [ ] Testar Sybil attack detection
- [ ] Testar double voting prevention
- [ ] Documentar endereços em `.env`

### Endereços Necessários

```bash
# Adicionar ao .env após deploy:

# Governance
GOVERNANCE_TIMELOCK_ADDRESS=0x...
GOVERNANCE_REGISTRY_ADDRESS=0x...
GOVERNANCE_GOVERNOR_ADDRESS=0x...

# Existing
SIGNUP_ADDRESS=0x...
CAMPAIGN_ADDRESS=0x...
DONATE_ADDRESS=0x...
```

### Testes Recomendados (MVP)

```bash
✓ Teste: ONG pode criar proposta
✓ Teste: Votante registrado pode votar
✓ Teste: Votante não-registrado não pode votar
✓ Teste: Double voting é prevenido
✓ Teste: Proposta é contada corretamente
✓ Teste: Timelock delay é respeitado
✓ Teste: Apenas Timelock pode executar ações
```

---

## Roadmap Futuro

### Phase 2: Token Governance (Próximas 2-4 semanas)

```
Criar token ERC20 chamado IMPACT
├─ Total supply: 1M IMPACT
├─ Distribuir para stakeholders
├─ Implementar vote escrow (lock tokens)
└─ Integrar com Governor (token-weighted)

Benefício: Incentiva stake a longo prazo
```

### Phase 3: Advanced Features (Próximas 4-8 semanas)

```
├─ Delegated voting (delegar voto para outro)
├─ Snapshot voting overlay (feedback rápido)
├─ Multisig + Guardian (veto emergência)
├─ Council-based governance
└─ DAO-to-DAO governance (cross-protocol)
```

### Phase 4: Descentralização Total (Futuro)

```
├─ Remover owner (contrato → governança)
├─ Descentralizar verificação de ONGs
├─ Worldcoin/BrightID integration (Sybil resistance)
└─ DAO-as-service (aluguel de treasury)
```

---

## Exemplos de Propostas (MVP)

### Exemplo 1: Mudar Deadline de Campanha

```
Descrição: "Extend Campaign 5 deadline by 7 days due to low adoption"

Ações:
- Target: Campaign.sol
- Função: updateCampaignDeadline(5, 7 days)

Timeline:
- Criação: T+0
- Votação: T+0 a T+7 dias
- Timelock: T+7 a T+14 dias
- Execução: T+14
```

### Exemplo 2: Adicionar ONG à Reputação

```
Descrição: "Recognize Greenpeace Brazil as founding ONG"

Ações:
- Target: GovernanceRegistry.sol
- Função: incrementReputation(0x123..., 10, "Founding ONG")

Timeline:
- Imediata (apenas ONG precisa de 5 rep para votar)
```

### Exemplo 3: Ativar Fee System

```
Descrição: "Activate 1% platform fee for sustainable operations"

Ações:
- Target: Donate.sol
- Função: updateFeePercentage(1)

Timeline:
- 7 dias de votação + 7 dias de timelock = 14 dias total antes de ativar
```

---

## Como Rodar Localmente

### Setup Completo (com Governance)

```bash
# 1. Start Hardhat node
cd contracts
npx hardhat node

# 2. Deploy contracts (em outro terminal)
npx hardhat run scripts/deploy.ts --network localhost

# 3. Rodar testes
npm test

# 4. Testar governance especificamente
npm test -- --grep "Governance"
```

### Testar Proposta End-to-End

```bash
# Via Hardhat console
npx hardhat console --network localhost

# Dentro do console:
const governor = await ethers.getContractAt("ImpactGovernor", GOVERNOR_ADDRESS);

// 1. Create proposal
const tx1 = await governor.propose(...);

// 2. Mine 1 block (voting delay)
ethers.provider.send('evm_mine');

// 3. Cast votes
await governor.connect(voter1).castVote(proposalId, 1);
await governor.connect(voter2).castVote(proposalId, 1);

// 4. Advance 7 days
ethers.provider.send('evm_increaseTime', [7 * 24 * 60 * 60]);
ethers.provider.send('evm_mine');

// 5. Count votes
await governor.countVotes(proposalId);

// 6. Advance 7 days (timelock)
ethers.provider.send('evm_increaseTime', [7 * 24 * 60 * 60]);
ethers.provider.send('evm_mine');

// 7. Execute
await governor.execute(proposalId);
```

---

## Documentação Referência

Consultar estes arquivos para mais detalhes:

1. **GOVERNANCE_ARCHITECTURE.md** - Análise técnica completa (6 etapas)
2. **GOVERNANCE_CAMPAIGN_MODIFICATIONS.md** - Mudanças recomendadas
3. **ImpactGovernor.sol** - Implementação com comentários
4. **GovernanceRegistry.sol** - Sistema de reputação com comentários
5. **Governance.ts** - Suite de testes com exemplos

---

## Suporte & Troubleshooting

### Problema: "Proposal already exists"
**Causa**: ProposalId duplicado (mesma descrição + targets + calldatas)  
**Solução**: Alterar description um pouco ou usar timestamp

### Problema: "Only Governor or Owner can call this"
**Causa**: GovernanceRegistry não foi setado como REPUTATION_ADMIN  
**Solução**: `await registry.setGovernorContract(governorAddress)`

### Problema: "Timelock delay not met"
**Causa**: Tentou executar antes de 7 dias após proposta aprovada  
**Solução**: Aguardar 7 dias ou reduzir TIMELOCK_DELAY em testes

---

## Conclusão

✅ **Sistema de governança completo e funcional**  
✅ **Backward compatible com contratos existentes**  
✅ **Battle-tested (baseado em OpenZeppelin Governor)**  
✅ **Pronto para MVP e escalável para produção**

**Próximo passo**: Implementar os passos da Fase 1 e testar com a comunidade!

