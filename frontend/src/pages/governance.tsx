import { useEffect, useState } from 'react';
import { useWalletStore } from '../stores/useWalletStore';
import {
  GovernanceContract,
  type ProposalData,
  type CreateProposalParams,
  type ProposalState,
} from '../contracts/governance';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { SuccessBox } from '../components/successBox';
import { ErrorBox } from '../components/errorBox';
import { CircleLoadding } from '../components/circleLoadding';

export default function GovernancePage() {
  const { signer, provider, address, connected } = useWalletStore();

  // Contract & UI State
  const [governance, setGovernance] = useState<GovernanceContract | null>(null);
  const [votingPower, setVotingPower] = useState<bigint>(0n);
  const [proposals, setProposals] = useState<ProposalData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    campaignId: '',
    ongWallet: '',
    amount: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Initialize
  useEffect(() => {
    if (signer && provider && connected) {
      setGovernance(new GovernanceContract(signer, provider));
    }
  }, [signer, provider, connected]);

  // Load Data
  useEffect(() => {
    if (!governance || !address) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch voting power
        const [power, powerErr] = await governance.getVotingPower(address);
        if (!powerErr && power !== null) {
          setVotingPower(power);
        }

        // TODO: Fetch proposals from subgraph or contract events
        // For now, we'll use an empty array
        setProposals([]);
      } catch (err) {
        setError('Failed to load governance data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [governance, address]);

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!governance || !address) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const params: CreateProposalParams = {
        campaignId: formData.campaignId,
        ongWallet: formData.ongWallet,
        amount: BigInt(formData.amount),
        description: formData.description,
      };

      const [proposalId, createErr] = await governance.createProposal(params);

      if (createErr) {
        setError(createErr.message);
      } else if (proposalId) {
        setSuccess(`Proposal created with ID: ${proposalId.slice(0, 10)}...`);
        setFormData({ campaignId: '', ongWallet: '', amount: '', description: '' });
        setShowForm(false);
      }
    } catch (err) {
      setError('Unexpected error creating proposal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (proposalId: string, support: 0 | 1 | 2) => {
    if (!governance) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    const [txHash, voteErr] = await governance.castVote(proposalId, support);

    if (voteErr) {
      setError(voteErr.message);
    } else if (txHash) {
      setSuccess(`Vote cast successfully: ${txHash.slice(0, 10)}...`);
    }

    setLoading(false);
  };

  const handleExecute = async (proposal: ProposalData) => {
    if (!governance) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    // Extract params from description or proposal data
    const [txHash, execErr] = await governance.executeProposal(
      proposal.id,
      proposal.ongWallet,
      proposal.amount,
      proposal.description
    );

    if (execErr) {
      setError(execErr.message);
    } else if (txHash) {
      setSuccess(`Proposal executed: ${txHash.slice(0, 10)}...`);
    }

    setLoading(false);
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-4xl mx-auto text-center mt-20">
          <h1 className="text-5xl font-bold text-white mb-4">DAO Governance</h1>
          <p className="text-xl text-slate-300">Connect your wallet to participate</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-6">DAO Governance</h1>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg p-6 border border-slate-600">
              <p className="text-slate-400 text-sm font-medium uppercase">Voting Power</p>
              <p className="text-4xl font-bold text-white mt-2">
                {(Number(votingPower) / 1e18).toFixed(2)}
              </p>
              <p className="text-xs text-slate-400 mt-2">IMPACT Tokens</p>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg p-6 border border-slate-600">
              <p className="text-slate-400 text-sm font-medium uppercase">Active Proposals</p>
              <p className="text-4xl font-bold text-white mt-2">
                {proposals.filter(p => p.state === 'Active').length}
              </p>
              <p className="text-xs text-slate-400 mt-2">of {proposals.length} total</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && <ErrorBox message={error} />}
        {success && <SuccessBox message={success} />}

        {/* Loading */}
        {loading && <CircleLoadding description="A carregar dados da governança..." />}

        {/* Create Proposal */}
        <div className="mb-8">
          <Button
            onClick={() => setShowForm(!showForm)}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            {showForm ? 'Cancel' : 'Create Proposal'}
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-slate-800 border border-slate-600 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">New Withdrawal Proposal</h2>

            <form onSubmit={handleCreateProposal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Campaign ID
                </label>
                <Input
                  type="text"
                  value={formData.campaignId}
                  onChange={e => setFormData({ ...formData, campaignId: e.target.value })}
                  placeholder="Enter campaign ID"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  ONG Wallet Address
                </label>
                <Input
                  type="text"
                  value={formData.ongWallet}
                  onChange={e => setFormData({ ...formData, ongWallet: e.target.value })}
                  placeholder="0x..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Amount (Wei)
                </label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Proposal details and rationale..."
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={submitting || !formData.campaignId || !formData.ongWallet || !formData.amount}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Proposal'}
              </Button>
            </form>
          </div>
        )}

        {/* Proposals List */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Proposals</h2>

          {proposals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg">No proposals yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {proposals.map(proposal => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  onVote={handleVote}
                  onExecute={handleExecute}
                  isLoading={loading}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ProposalCardProps {
  proposal: ProposalData;
  onVote: (id: string, support: 0 | 1 | 2) => Promise<void>;
  onExecute: (proposal: ProposalData) => Promise<void>;
  isLoading: boolean;
}

function ProposalCard({ proposal, onVote, onExecute, isLoading }: ProposalCardProps) {
  const stateColors: Record<ProposalState, string> = {
    Pending: 'bg-yellow-900 text-yellow-200',
    Active: 'bg-blue-900 text-blue-200',
    Canceled: 'bg-gray-900 text-gray-200',
    Defeated: 'bg-red-900 text-red-200',
    Succeeded: 'bg-green-900 text-green-200',
    Queued: 'bg-purple-900 text-purple-200',
    Executed: 'bg-emerald-900 text-emerald-200',
  };

  const total = Number(proposal.forVotes) + Number(proposal.againstVotes);
  const forPercent = total > 0 ? (Number(proposal.forVotes) / total) * 100 : 0;

  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg p-6 hover:border-slate-500 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white">{proposal.description}</h3>
          <p className="text-sm text-slate-400 mt-1">
            Proposer: {proposal.proposer.slice(0, 10)}...
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-4 ${
            stateColors[proposal.state]
          }`}
        >
          {proposal.state}
        </span>
      </div>

      {/* Vote Stats */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-slate-400">
            For: <span className="text-green-400 font-semibold">{proposal.forVotes.toString()}</span>
          </span>
          <span className="text-sm text-slate-400">
            Against: <span className="text-red-400 font-semibold">{proposal.againstVotes.toString()}</span>
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-green-500 to-green-600 h-full transition-all duration-500"
            style={{ width: `${forPercent}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        {proposal.state === 'Active' && (
          <>
            <Button
              onClick={() => onVote(proposal.id, 1)}
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              Support
            </Button>
            <Button
              onClick={() => onVote(proposal.id, 0)}
              disabled={isLoading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              Reject
            </Button>
          </>
        )}

        {proposal.state === 'Succeeded' && (
          <Button
            onClick={() => onExecute(proposal)}
            disabled={isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            Execute Withdrawal
          </Button>
        )}
      </div>
    </div>
  );
}