import { ethers } from 'ethers';
import { ContractException } from '../exceptions/ContractException';

// Types
export type ProposalState = 'Pending' | 'Active' | 'Canceled' | 'Defeated' | 'Succeeded' | 'Queued' | 'Executed';

export interface ProposalData {
  id: string;
  proposer: string;
  description: string;
  // Campos necessários para reconstituir o calldata no execute()
  ongWallet: string;
  amount: bigint;
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

export interface CreateProposalParams {
  campaignId: string;
  ongWallet: string;
  amount: bigint;
  description: string;
}

// ABIs (Minimal)
const CAMPAIGN_GOVERNOR_ABI = [
  'function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) external returns (uint256)',
  'function castVote(uint256 proposalId, uint8 support) external',
  'function execute(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) external payable',
  'function state(uint256 proposalId) external view returns (uint8)',
  'function proposalDeadline(uint256 proposalId) external view returns (uint256)',
  'function proposalSnapshot(uint256 proposalId) external view returns (uint256)',
  'event ProposalCreated(uint256 indexed proposalId, address indexed proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)',
];

const IMPACT_TOKEN_ABI = [
  'function getVotes(address account) external view returns (uint256)',
  'function getPastVotes(address account, uint256 blockNumber) external view returns (uint256)',
  'function delegates(address account) external view returns (address)',
  'function delegate(address delegatee) external',
];

const DONATE_ABI = [
  'function releaseFunds(uint256 campaignId, address ongWallet, uint256 amount) external',
];

export class GovernanceContract {
  private governorAddress: string = import.meta.env.VITE_GOVERNANCE_ADDRESS || '';
  private tokenAddress: string = import.meta.env.VITE_IMPACT_TOKEN_ADDRESS || '';
  private donateAddress: string = import.meta.env.VITE_DONATE_ADDRESS || '';

  private governorContract: ethers.Contract;
  private tokenContract: ethers.Contract;
  private donateContract: ethers.Contract;
  private provider: ethers.Provider;

  constructor(signer: ethers.Signer, provider: ethers.Provider) {
    this.provider = provider;
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
    this.donateContract = new ethers.Contract(
      this.donateAddress,
      DONATE_ABI,
      signer
    );
  }

  async getVotingPower(address: string): Promise<[bigint | null, Error | null]> {
    try {
      const votes = await this.tokenContract.getVotes(address);
      return [votes as bigint, null];
    } catch (err) {
      let message = 'Failed to fetch voting power';
      if (typeof err === 'object' && err && 'reason' in err && err.reason != null) {
        message = err.reason as string;
      }
      return [null, new ContractException(message)];
    }
  }

  async createProposal(
    params: CreateProposalParams
  ): Promise<[string | null, Error | null]> {
    try {
      // Encode releaseFunds calldata
      const iface = new ethers.Interface(DONATE_ABI);
      const calldata = iface.encodeFunctionData('releaseFunds', [
        BigInt(params.campaignId),
        params.ongWallet,
        params.amount,
      ]);

      // Propose with OZ Governor v5
      const tx = await this.governorContract.propose(
        [this.donateAddress],
        [0n],
        [calldata],
        params.description
      );

      const receipt = await tx.wait();
      if (!receipt) {
        return [null, new ContractException('Transaction failed')];
      }

      // Extract proposalId from event
      const iface2 = new ethers.Interface(CAMPAIGN_GOVERNOR_ABI);
      let proposalId: string | null = null;

      for (const log of receipt.logs) {
        try {
          const parsed = iface2.parseLog(log);
          if (parsed?.name === 'ProposalCreated' && parsed.args?.proposalId) {
            proposalId = parsed.args.proposalId.toString();
            break;
          }
        } catch {
          continue;
        }
      }

      return [proposalId || tx.hash, null];
    } catch (err) {
      let message = 'Failed to create proposal';
      if (typeof err === 'object' && err && 'reason' in err && err.reason != null) {
        message = err.reason as string;
      }
      return [null, new ContractException(message)];
    }
  }

  async castVote(
    proposalId: string,
    support: 0 | 1 | 2
  ): Promise<[string | null, Error | null]> {
    try {
      const tx = await this.governorContract.castVote(BigInt(proposalId), support);
      const receipt = await tx.wait();

      if (!receipt) {
        return [null, new ContractException('Voting transaction failed')];
      }

      return [receipt.hash, null];
    } catch (err) {
      let message = 'Failed to vote';
      if (typeof err === 'object' && err && 'reason' in err && err.reason != null) {
        message = err.reason as string;
      }
      return [null, new ContractException(message)];
    }
  }

  async getProposalState(proposalId: string): Promise<[ProposalState | null, Error | null]> {
    try {
      const stateValue = await this.governorContract.state(BigInt(proposalId));
      const states: ProposalState[] = [
        'Pending',
        'Active',
        'Canceled',
        'Defeated',
        'Succeeded',
        'Queued',
        'Executed',
      ];
      return [states[stateValue] || 'Pending', null];
    } catch (err) {
      let message = 'Failed to fetch proposal state';
      if (typeof err === 'object' && err && 'reason' in err && err.reason != null) {
        message = err.reason as string;
      }
      return [null, new ContractException(message)];
    }
  }

  async executeProposal(
    campaignId: string,
    ongWallet: string,
    amount: bigint,
    description: string
  ): Promise<[string | null, Error | null]> {
    try {
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
        return [null, new ContractException('Execution transaction failed')];
      }

      return [receipt.hash, null];
    } catch (err) {
      let message = 'Failed to execute proposal';
      if (typeof err === 'object' && err && 'reason' in err && err.reason != null) {
        message = err.reason as string;
      }
      return [null, new ContractException(message)];
    }
  }

  async delegateVotes(delegatee: string): Promise<[string | null, Error | null]> {
    try {
      const tx = await this.tokenContract.delegate(delegatee);
      const receipt = await tx.wait();

      if (!receipt) {
        return [null, new ContractException('Delegation transaction failed')];
      }

      return [receipt.hash, null];
    } catch (err) {
      let message = 'Failed to delegate votes';
      if (typeof err === 'object' && err && 'reason' in err && err.reason != null) {
        message = err.reason as string;
      }
      return [null, new ContractException(message)];
    }
  }

  async getCurrentDelegate(address: string): Promise<[string | null, Error | null]> {
    try {
      const delegate = await this.tokenContract.delegates(address);
      return [delegate, null];
    } catch (err) {
      let message = 'Failed to fetch current delegate';
      if (typeof err === 'object' && err && 'reason' in err && err.reason != null) {
        message = err.reason as string;
      }
      return [null, new ContractException(message)];
    }
  }
}