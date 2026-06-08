import { ethers } from 'ethers';
import { ContractException } from '../exceptions/ContractException';

// Tipos de dados para propostas e votos
export interface ProposalState {
  proposalId: string;
  proposer: string;
  description: string;
  startBlock: bigint;
  endBlock: bigint;
  forVotes: bigint;
  againstVotes: bigint;
  abstainVotes: bigint;
  canceled: boolean;
  succeeded: boolean;
  executed: boolean;
  executionTime: bigint;
}

export interface CreateProposalParams {
  targets: string[];
  values: bigint[];
  signatures: string[];
  calldatas: string[];
  description: string;
}

export interface ProposalListItem {
  id: string;
  proposer: string;
  description: string;
  forVotes: bigint;
  againstVotes: bigint;
  abstainVotes: bigint;
  state: 'Pending' | 'Active' | 'Canceled' | 'Defeated' | 'Succeeded' | 'Queued' | 'Executed';
  startBlock: bigint;
  endBlock: bigint;
}

export type GovernanceResult<T> = [T | null, Error | null];

// ABI do contrato de governança
const GOVERNANCE_ABI = [
  "function propose(address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, string description) returns (uint256)",
  "function castVote(uint256 proposalId, uint8 support) returns (uint256)",
  "function countVotes(uint256 proposalId) returns (bool)",
  "function execute(uint256 proposalId) returns (bool)",
  "function cancel(uint256 proposalId) returns (bool)",
  "function getProposal(uint256 proposalId) view returns (tuple(uint256 proposalId, address proposer, string description, uint256 startBlock, uint256 endBlock, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, bool canceled, bool succeeded, bool executed, uint256 executionTime))",
  "function getProposalCount() view returns (uint256)",
  "function proposalCount(address proposer) view returns (uint256)",
  "function proposals(uint256 id) view returns (tuple(uint256 proposalId, address proposer, string description, uint256 startBlock, uint256 endBlock, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, bool canceled, bool succeeded, bool executed, uint256 executionTime))",
  "function VOTING_PERIOD() view returns (uint256)",
  "function VOTING_DELAY() view returns (uint256)",
  "function TIMELOCK_DELAY() view returns (uint256)",
  "function MIN_QUORUM_VOTES() view returns (uint256)",
  "function MIN_REPUTATION_PROPOSER() view returns (uint256)",
  "event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description, uint256 startBlock, uint256 endBlock)",
  "event VoteCast(uint256 indexed proposalId, address indexed voter, uint8 support, string reason)",
  "event ProposalSucceeded(uint256 indexed proposalId)",
  "event ProposalDefeated(uint256 indexed proposalId)",
  "event ProposalExecuted(uint256 indexed proposalId)",
  "event ProposalCanceled(uint256 indexed proposalId)",
];

export class GovernanceContract {
  private contractAddress: string = import.meta.env.VITE_GOVERNANCE_ADDRESS || '';
  protected instance: ethers.Contract;
  private provider: ethers.Provider;

  constructor(signer: ethers.Signer, provider: ethers.Provider) {
    this.provider = provider;
    this.instance = new ethers.Contract(
      this.contractAddress,
      GOVERNANCE_ABI,
      signer
    );
  }

  // ==================== GESTÃO DE PROPOSTAS ====================

  async createProposal(
    params: CreateProposalParams
  ): Promise<GovernanceResult<string>> {
    try {
      const tx = await this.instance.propose(
        params.targets,
        params.values,
        params.signatures,
        params.calldatas,
        params.description
      );

      const receipt = await tx.wait();
      
      if (!receipt) {
        return [null, new ContractException('Transaction failed')];
      }

      // Extract proposalId from event
      const event = receipt.logs
        .map(log => {
          try {
            return this.instance.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find(e => e?.name === 'ProposalCreated');

      if (event?.args?.proposalId) {
        return [event.args.proposalId.toString(), null];
      }

      return [tx.hash, null];
    } catch (err) {
      let message = 'Failed to create proposal';
      if (typeof err === 'object' && err && 'reason' in err && err.reason != null) {
        message = err.reason as string;
      }
      return [null, new ContractException(message)];
    }
  }

  async listProposals(
    count: number = 10
  ): Promise<GovernanceResult<ProposalListItem[]>> {
    try {
      const proposalCount = await this.instance.getProposalCount?.() ?? 0n;
      const start = Math.max(0, Number(proposalCount) - count);
      const proposals: ProposalListItem[] = [];

      for (let i = start; i < Number(proposalCount); i++) {
        try {
          const proposal = await this.instance.proposals(BigInt(i));
          const state = await this.getProposalState(proposal.proposalId.toString());

          proposals.push({
            id: proposal.proposalId.toString(),
            proposer: proposal.proposer,
            description: proposal.description,
            forVotes: proposal.forVotes,
            againstVotes: proposal.againstVotes,
            abstainVotes: proposal.abstainVotes,
            state: state || 'Pending',
            startBlock: proposal.startBlock,
            endBlock: proposal.endBlock,
          });
        } catch {
          continue;
        }
      }

      return [proposals, null];
    } catch (err) {
      let message = 'Failed to fetch proposals';
      if (typeof err === 'object' && err && 'reason' in err && err.reason != null) {
        message = err.reason as string;
      }
      return [null, new ContractException(message)];
    }
  }

  async getProposal(proposalId: string): Promise<GovernanceResult<ProposalState>> {
    try {
      const proposal = await this.instance.proposals(BigInt(proposalId));

      return [
        {
          proposalId: proposal.proposalId.toString(),
          proposer: proposal.proposer,
          description: proposal.description,
          startBlock: proposal.startBlock,
          endBlock: proposal.endBlock,
          forVotes: proposal.forVotes,
          againstVotes: proposal.againstVotes,
          abstainVotes: proposal.abstainVotes,
          canceled: proposal.canceled,
          succeeded: proposal.succeeded,
          executed: proposal.executed,
          executionTime: proposal.executionTime,
        },
        null,
      ];
    } catch (err) {
      let message = 'Failed to fetch proposal';
      if (typeof err === 'object' && err && 'reason' in err && err.reason != null) {
        message = err.reason as string;
      }
      return [null, new ContractException(message)];
    }
  }

  // ==================== VOTAÇÃO ====================

  async castVote(
    proposalId: string,
    support: 0 | 1 | 2,
    reason: string = ''
  ): Promise<GovernanceResult<bigint>> {
    try {
      const tx = await this.instance.castVote(BigInt(proposalId), support);
      const receipt = await tx.wait();

      if (!receipt) {
        return [null, new ContractException('Voting transaction failed')];
      }

      return [BigInt(receipt.transactionHash), null];
    } catch (err) {
      let message = 'Failed to vote';
      if (typeof err === 'object' && err && 'reason' in err && err.reason != null) {
        message = err.reason as string;
      }
      return [null, new ContractException(message)];
    }
  }

  async getVotingPower(address: string): Promise<GovernanceResult<bigint>> {
    try {
      const proposalCount = await this.instance.proposalCount?.(address) ?? 0n;
      return [proposalCount, null];
    } catch (err) {
      let message = 'Failed to fetch voting power';
      if (typeof err === 'object' && err && 'reason' in err && err.reason != null) {
        message = err.reason as string;
      }
      return [null, new ContractException(message)];
    }
  }

  async hasVoted(
    proposalId: string,
    voterAddress: string
  ): Promise<GovernanceResult<boolean>> {
    try {
      const proposal = await this.instance.proposals(BigInt(proposalId));
      const hasVoted = proposal.hasVoted?.[voterAddress] ?? false;
      return [hasVoted, null];
    } catch (err) {
      let message = 'Failed to check voting status';
      if (typeof err === 'object' && err && 'reason' in err && err.reason != null) {
        message = err.reason as string;
      }
      return [null, new ContractException(message)];
    }
  }

  // ==================== EXECUÇÃO DE PROPOSTAS ====================

  async countVotes(proposalId: string): Promise<GovernanceResult<boolean>> {
    try {
      const tx = await this.instance.countVotes(BigInt(proposalId));
      const receipt = await tx.wait();

      if (!receipt) {
        return [null, new ContractException('Vote counting transaction failed')];
      }

      return [true, null];
    } catch (err) {
      let message = 'Failed to count votes';
      if (typeof err === 'object' && err && 'reason' in err && err.reason != null) {
        message = err.reason as string;
      }
      return [null, new ContractException(message)];
    }
  }

  async executeProposal(proposalId: string): Promise<GovernanceResult<string>> {
    try {
      const tx = await this.instance.execute(BigInt(proposalId));
      const receipt = await tx.wait();

      if (!receipt) {
        return [null, new ContractException('Execution transaction failed')];
      }

      return [receipt.transactionHash, null];
    } catch (err) {
      let message = 'Failed to execute proposal';
      if (typeof err === 'object' && err && 'reason' in err && err.reason != null) {
        message = err.reason as string;
      }
      return [null, new ContractException(message)];
    }
  }

  async cancelProposal(proposalId: string): Promise<GovernanceResult<string>> {
    try {
      const tx = await this.instance.cancel(BigInt(proposalId));
      const receipt = await tx.wait();

      if (!receipt) {
        return [null, new ContractException('Cancellation transaction failed')];
      }

      return [receipt.transactionHash, null];
    } catch (err) {
      let message = 'Failed to cancel proposal';
      if (typeof err === 'object' && err && 'reason' in err && err.reason != null) {
        message = err.reason as string;
      }
      return [null, new ContractException(message)];
    }
  }

  // ==================== CONSULTAS DE ESTADO ====================

  async getProposalState(
    proposalId: string
  ): Promise<'Pending' | 'Active' | 'Canceled' | 'Defeated' | 'Succeeded' | 'Queued' | 'Executed' | null> {
    try {
      const proposal = await this.instance.proposals(BigInt(proposalId));
      const currentBlock = await this.provider.getBlockNumber();

      if (proposal.canceled) return 'Canceled';
      if (proposal.executed) return 'Executed';

      const currentTime = Math.floor(Date.now() / 1000);

      if (Number(currentBlock) < Number(proposal.startBlock)) return 'Pending';
      if (Number(currentBlock) <= Number(proposal.endBlock)) return 'Active';

      if (proposal.succeeded) {
        if (currentTime < Number(proposal.executionTime)) return 'Queued';
        return 'Succeeded';
      }

      return 'Defeated';
    } catch {
      return null;
    }
  }

  async getGovernanceParams(): Promise<GovernanceResult<{
    votingPeriod: bigint;
    votingDelay: bigint;
    timelockDelay: bigint;
    minQuorum: bigint;
    minReputation: bigint;
  }>> {
    try {
      const [votingPeriod, votingDelay, timelockDelay, minQuorum, minReputation] =
        await Promise.all([
          this.instance.VOTING_PERIOD?.() ?? 0n,
          this.instance.VOTING_DELAY?.() ?? 0n,
          this.instance.TIMELOCK_DELAY?.() ?? 0n,
          this.instance.MIN_QUORUM_VOTES?.() ?? 0n,
          this.instance.MIN_REPUTATION_PROPOSER?.() ?? 0n,
        ]);

      return [
        {
          votingPeriod: votingPeriod as bigint,
          votingDelay: votingDelay as bigint,
          timelockDelay: timelockDelay as bigint,
          minQuorum: minQuorum as bigint,
          minReputation: minReputation as bigint,
        },
        null,
      ];
    } catch (err) {
      let message = 'Failed to fetch governance parameters';
      if (typeof err === 'object' && err && 'reason' in err && err.reason != null) {
        message = err.reason as string;
      }
      return [null, new ContractException(message)];
    }
  }

  async getProposerActiveProposals(
    proposerAddress: string
  ): Promise<GovernanceResult<bigint>> {
    try {
      const count = await this.instance.proposalCount?.(proposerAddress) ?? 0n;
      return [count, null];
    } catch (err) {
      let message = 'Failed to fetch proposer proposals';
      if (typeof err === 'object' && err && 'reason' in err && err.reason != null) {
        message = err.reason as string;
      }
      return [null, new ContractException(message)];
    }
  }
}