import { ethers } from 'ethers';
import { ContractException } from '../exceptions/ContractException';

// ============================================================
// Types
// ============================================================

export type ProposalState =
  | 'Pending'
  | 'Active'
  | 'Canceled'
  | 'Defeated'
  | 'Succeeded'
  | 'Queued'
  | 'Executed';

const PROPOSAL_STATES: ProposalState[] = [
  'Pending',
  'Active',
  'Canceled',
  'Defeated',
  'Succeeded',
  'Queued',
  'Executed',
];

export interface ProposalData {
  id: string;           // proposalId (uint256 como string)
  campaignId: string;   // ID da campanha vinculada ao saque
  proposer: string;     // Endereço da ONG que criou a proposta
  ongWallet: string;    // Carteira que receberá os fundos se aprovado
  amount: bigint;       // Valor solicitado (em Wei)
  description: string;  // Texto da proposta (pode incluir link IPFS do comprovante)
  forVotes: bigint;
  againstVotes: bigint;
  abstainVotes: bigint;
  startBlock: bigint;
  endBlock: bigint;
  canceled: boolean;
  succeeded: boolean;
  executed: boolean;
  state: ProposalState;
}

export interface RequestWithdrawalParams {
  campaignId: string;
  ongWallet: string;
  amount: bigint;
  description: string;
}

// ============================================================
// ABIs (Minimal — apenas funções e eventos utilizados)
// ============================================================

/**
 * ABI do CampaignGovernor — inclui a função requestWithdrawal(),
 * funções padrão do OZ Governor e os eventos necessários para
 * reconstruir o estado das propostas sem subgraph.
 */
const CAMPAIGN_GOVERNOR_ABI = [
  // Função principal: ONG solicita saque de uma campanha
  'function requestWithdrawal(uint256 campaignId, address ongWallet, uint256 amount, string description) external returns (uint256)',

  // Votação
  'function castVote(uint256 proposalId, uint8 support) external returns (uint256)',

  // Execução (parâmetros idênticos ao propose para reconstruir o calldata)
  'function execute(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) external payable returns (uint256)',

  // Consultas de estado
  'function state(uint256 proposalId) external view returns (uint8)',
  'function proposalDeadline(uint256 proposalId) external view returns (uint256)',
  'function proposalSnapshot(uint256 proposalId) external view returns (uint256)',
  'function proposalVotes(uint256 proposalId) external view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)',
  'function proposalProposer(uint256 proposalId) external view returns (address)',

  // Evento emitido pelo requestWithdrawal — usado para buscar propostas
  'event WithdrawalRequested(uint256 indexed proposalId, uint256 indexed campaignId, address indexed ongWallet, uint256 amount)',

  // Evento padrão do OZ Governor — contém a description da proposta
  'event ProposalCreated(uint256 indexed proposalId, address indexed proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)',

  // Evento de voto — útil para detectar se o usuário já votou
  'event VoteCast(address indexed voter, uint256 indexed proposalId, uint8 support, uint256 weight, string reason)',
];

const IMPACT_TOKEN_ABI = [
  'function getVotes(address account) external view returns (uint256)',
  'function getPastVotes(address account, uint256 blockNumber) external view returns (uint256)',
  'function delegates(address account) external view returns (address)',
  'function delegate(address delegatee) external',
];

// Apenas para reconstruir o calldata do execute()
const DONATE_ABI = [
  'function releaseFunds(uint256 campaignId, address ongWallet, uint256 amount) external',
];

// ============================================================
// GovernanceContract
// ============================================================

export class GovernanceContract {
  private governorAddress: string = import.meta.env.VITE_GOVERNANCE_ADDRESS || '';
  private tokenAddress: string    = import.meta.env.VITE_IMPACT_TOKEN_ADDRESS || '';
  private donateAddress: string   = import.meta.env.VITE_DONATE_ADDRESS || '';

  private governorContract: ethers.Contract;
  private tokenContract:    ethers.Contract;

  constructor(signer: ethers.Signer, provider: ethers.Provider) {
    if (!this.governorAddress) {
      throw new Error('VITE_GOVERNANCE_ADDRESS não configurado no .env');
    }
    if (!this.tokenAddress) {
      throw new Error('VITE_IMPACT_TOKEN_ADDRESS não configurado no .env');
    }

    this.governorContract = new ethers.Contract(
      this.governorAddress,
      CAMPAIGN_GOVERNOR_ABI,
      signer
    );
    this.tokenContract = new ethers.Contract(
      this.tokenAddress,
      IMPACT_TOKEN_ABI,
      signer
    );
  }

  // ============================================================
  // CONSULTAS
  // ============================================================

  /**
   * Retorna o poder de voto (ImpactToken delegado) do endereço.
   * Proporcional ao valor doado: 1 Wei doado = 1 ImpactToken = 1 unidade de voto.
   */
  async getVotingPower(address: string): Promise<[bigint | null, Error | null]> {
    try {
      const votes = await this.tokenContract.getVotes(address);
      return [votes as bigint, null];
    } catch (err) {
      return [null, new ContractException(extractReason(err, 'Falha ao buscar poder de voto'))];
    }
  }

  /**
   * Busca todas as propostas de saque criadas via requestWithdrawal().
   * Usa o evento WithdrawalRequested (emitido pelo CampaignGovernor) como
   * fonte de verdade e consulta o estado atual de cada proposta on-chain.
   *
   * @param fromBlock Bloco inicial para busca de eventos (padrão: 0).
   */
  async getProposals(fromBlock: number = 0): Promise<[ProposalData[] | null, Error | null]> {
    try {
      // 1. Busca eventos WithdrawalRequested
      const withdrawalFilter = this.governorContract.filters.WithdrawalRequested();
      const withdrawalEvents  = await this.governorContract.queryFilter(withdrawalFilter, fromBlock);

      if (withdrawalEvents.length === 0) return [[], null];

      // 2. Busca eventos ProposalCreated para obter as descriptions
      const createdFilter = this.governorContract.filters.ProposalCreated();
      const createdEvents  = await this.governorContract.queryFilter(createdFilter, fromBlock);

      const descriptionMap = new Map<string, string>();
      for (const ev of createdEvents) {
        if ('args' in ev && ev.args) {
          descriptionMap.set(ev.args.proposalId.toString(), ev.args.description as string);
        }
      }

      // 3. Para cada WithdrawalRequested, monta o ProposalData consultando o contrato
      const proposals = await Promise.all(
        withdrawalEvents.map(async (ev): Promise<ProposalData | null> => {
          if (!('args' in ev) || !ev.args) return null;

          const { proposalId, campaignId, ongWallet, amount } = ev.args;
          const proposalIdStr = proposalId.toString();

          try {
            const [stateValue, votes, proposer] = await Promise.all([
              this.governorContract.state(proposalId),
              this.governorContract.proposalVotes(proposalId),
              this.governorContract.proposalProposer(proposalId),
            ]);

            // proposalVotes retorna (againstVotes, forVotes, abstainVotes)
            const [againstVotes, forVotes, abstainVotes] = votes;
            const stateIndex = Number(stateValue);

            return {
              id:           proposalIdStr,
              campaignId:   campaignId.toString(),
              proposer:     proposer as string,
              ongWallet:    ongWallet as string,
              amount:       BigInt(amount),
              description:  descriptionMap.get(proposalIdStr) || '',
              forVotes:     BigInt(forVotes),
              againstVotes: BigInt(againstVotes),
              abstainVotes: BigInt(abstainVotes),
              startBlock:   0n,
              endBlock:     0n,
              canceled:     stateIndex === 2,
              succeeded:    stateIndex === 4,
              executed:     stateIndex === 6,
              state:        PROPOSAL_STATES[stateIndex] ?? 'Pending',
            };
          } catch {
            return null;
          }
        })
      );

      return [proposals.filter(Boolean) as ProposalData[], null];
    } catch (err) {
      return [null, new ContractException(extractReason(err, 'Falha ao buscar propostas'))];
    }
  }

  // ============================================================
  // AÇÕES DE ONG
  // ============================================================

  /**
   * ONG solicita o saque dos fundos de uma campanha.
   * Cria uma proposta de governança que, se aprovada, libera os
   * fundos do Donate para a carteira da ONG.
   *
   * Nota: o campo `description` pode incluir o link IPFS do comprovante PDF,
   * ex: "Compra de alimentos | Comprovante: ipfs://QmXyz..."
   */
  async requestWithdrawal(
    params: RequestWithdrawalParams
  ): Promise<[string | null, Error | null]> {
    try {
      const tx = await this.governorContract.requestWithdrawal(
        BigInt(params.campaignId),
        params.ongWallet,
        params.amount,
        params.description
      );

      const receipt = await tx.wait();
      if (!receipt) {
        return [null, new ContractException('Transação falhou')];
      }

      // Extrai o proposalId do evento WithdrawalRequested
      const iface = new ethers.Interface(CAMPAIGN_GOVERNOR_ABI);
      let proposalId: string | null = null;

      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed?.name === 'WithdrawalRequested' && parsed.args?.proposalId) {
            proposalId = parsed.args.proposalId.toString();
            break;
          }
        } catch {
          continue;
        }
      }

      return [proposalId ?? tx.hash, null];
    } catch (err) {
      return [null, new ContractException(extractReason(err, 'Falha ao criar proposta de saque'))];
    }
  }

  // ============================================================
  // AÇÕES DE DOADOR
  // ============================================================

  /**
   * Doador vota em uma proposta.
   * @param support 0 = Contra | 1 = A Favor | 2 = Abstenção
   */
  async castVote(
    proposalId: string,
    support: 0 | 1 | 2
  ): Promise<[string | null, Error | null]> {
    try {
      const tx = await this.governorContract.castVote(BigInt(proposalId), support);
      const receipt = await tx.wait();
      if (!receipt) {
        return [null, new ContractException('Transação de voto falhou')];
      }
      return [receipt.hash, null];
    } catch (err) {
      return [null, new ContractException(extractReason(err, 'Falha ao votar'))];
    }
  }

  // ============================================================
  // EXECUÇÃO
  // ============================================================

  /**
   * Executa uma proposta aprovada.
   * Reconstrói o calldata de Donate.releaseFunds() usando os dados
   * armazenados na proposta e chama execute() no Governor.
   *
   * IMPORTANTE: os parâmetros devem ser IDÊNTICOS aos usados no requestWithdrawal().
   * O Governor valida o hash internamente.
   */
  async executeProposal(
    campaignId: string,
    ongWallet: string,
    amount: bigint,
    description: string
  ): Promise<[string | null, Error | null]> {
    try {
      // Reconstrói o calldata exatamente como foi codificado no contrato
      const iface = new ethers.Interface(DONATE_ABI);
      const calldata = iface.encodeFunctionData('releaseFunds', [
        BigInt(campaignId),
        ongWallet,
        amount,
      ]);

      const descriptionHash = ethers.id(description);

      const tx = await this.governorContract.execute(
        [this.donateAddress],
        [0n],
        [calldata],
        descriptionHash
      );

      const receipt = await tx.wait();
      if (!receipt) {
        return [null, new ContractException('Transação de execução falhou')];
      }

      return [receipt.hash, null];
    } catch (err) {
      return [null, new ContractException(extractReason(err, 'Falha ao executar proposta'))];
    }
  }

  // ============================================================
  // DELEGAÇÃO
  // ============================================================

  /**
   * Delega o poder de voto do ImpactToken para um endereço.
   * Com o auto-delegate do contrato, isso raramente é necessário,
   * mas está disponível para casos de re-delegação.
   */
  async delegateVotes(delegatee: string): Promise<[string | null, Error | null]> {
    try {
      const tx = await this.tokenContract.delegate(delegatee);
      const receipt = await tx.wait();
      if (!receipt) {
        return [null, new ContractException('Transação de delegação falhou')];
      }
      return [receipt.hash, null];
    } catch (err) {
      return [null, new ContractException(extractReason(err, 'Falha ao delegar votos'))];
    }
  }

  async getCurrentDelegate(address: string): Promise<[string | null, Error | null]> {
    try {
      const delegate = await this.tokenContract.delegates(address);
      return [delegate, null];
    } catch (err) {
      return [null, new ContractException(extractReason(err, 'Falha ao buscar delegado atual'))];
    }
  }
}

// ============================================================
// Utilitário interno
// ============================================================

function extractReason(err: unknown, fallback: string): string {
  if (typeof err === 'object' && err && 'reason' in err && (err as { reason: unknown }).reason) {
    return (err as { reason: string }).reason;
  }
  return fallback;
}