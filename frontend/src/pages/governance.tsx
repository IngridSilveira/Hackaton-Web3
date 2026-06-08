import { useEffect, useState } from 'react';
import { useWalletStore } from '../stores/useWalletStore';
import { GovernanceContract, type ProposalListItem, type GovernanceResult } from '../contracts/governance';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { SuccessBox } from '../components/successBox';
import { ErrorBox } from '../components/errorBox';

export default function GovernancePage() {
  const { signer, provider, address, connected } = useWalletStore();

  // State
  const [governanceContract, setGovernanceContract] = useState<GovernanceContract | null>(null);
  const [proposals, setProposals] = useState<ProposalListItem[]>([]);
  const [votingPower, setVotingPower] = useState<bigint>(0n);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [proposalForm, setProposalForm] = useState({
    title: '',
    description: '',
    targetAddress: '',
    functionSignature: '',
    calldata: '',
  });

  // Initialize contract
  useEffect(() => {
    if (signer && provider && connected) {
      setGovernanceContract(new GovernanceContract(signer, provider));
    }
  }, [signer, provider, connected]);

  // Load proposals and voting power
  useEffect(() => {
    if (!governanceContract) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Load proposals
        const [proposals, proposalError] = await governanceContract.listProposals(20);
        if (proposalError) {
          setError(proposalError.message);
        } else if (proposals) {
          setProposals(proposals);
        }

        // Load voting power
        if (address) {
          const [power, powerError] = await governanceContract.getVotingPower(address);
          if (!powerError && power !== null) {
            setVotingPower(power);
          }
        }
      } catch (err) {
        setError('Failed to load governance data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [governanceContract, address]);

  const handleVote = async (proposalId: string, support: 0 | 1 | 2) => {
    if (!governanceContract) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    const [result, voteError] = await governanceContract.castVote(proposalId, support);

    if (voteError) {
      setError(voteError.message);
    } else if (result) {
      setSuccess('Vote cast successfully');
      // Refresh proposals
      const [updated, _] = await governanceContract.listProposals(20);
      if (updated) setProposals(updated);
    }

    setLoading(false);
  };

  const handleCreateProposal = async () => {
    if (!governanceContract) return;

    setFormLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const createResult = await governanceContract.createProposal({
        targets: [proposalForm.targetAddress],
        values: [0n],
        signatures: [proposalForm.functionSignature],
        calldatas: [proposalForm.calldata],
        description: proposalForm.description,
      });

      const [result, createError] = createResult as GovernanceResult<string>;

      if (createError) {
        setError(createError.message);
      } else if (result) {
        setSuccess(`Proposal created with ID: ${result}`);
        setProposalForm({ title: '', description: '', targetAddress: '', functionSignature: '', calldata: '' });
        setFormOpen(false);

        // Refresh proposals
        const [updated, _] = await governanceContract.listProposals(20);
        if (updated) setProposals(updated);
      }
    } catch (err) {
      setError('Failed to create proposal');
    } finally {
      setFormLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Governance</h1>
          <p className="text-xl text-slate-300">Please connect your wallet to participate in governance</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Governance</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <p className="text-slate-400 text-sm">Voting Power</p>
              <p className="text-2xl font-bold text-white">{votingPower.toString()}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <p className="text-slate-400 text-sm">Active Proposals</p>
              <p className="text-2xl font-bold text-white">{proposals.filter(p => p.state === 'Active').length}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <p className="text-slate-400 text-sm">Total Proposals</p>
              <p className="text-2xl font-bold text-white">{proposals.length}</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && <ErrorBox message={error} />}
        {success && <SuccessBox message={success} />}

        {/* Create Proposal Button */}
        <div className="mb-8">
          <Button
            onClick={() => setFormOpen(!formOpen)}
            className="w-full md:w-auto"
          >
            {formOpen ? 'Cancel' : 'Create Proposal'}
          </Button>
        </div>

        {/* Create Proposal Form */}
        {formOpen && (
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">New Proposal</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                <Input
                  type="text"
                  value={proposalForm.title}
                  onChange={(e) => setProposalForm({ ...proposalForm, title: e.target.value })}
                  placeholder="Proposal title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  value={proposalForm.description}
                  onChange={(e) => setProposalForm({ ...proposalForm, description: e.target.value })}
                  placeholder="Proposal description and rationale"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Target Address</label>
                  <Input
                    type="text"
                    value={proposalForm.targetAddress}
                    onChange={(e) => setProposalForm({ ...proposalForm, targetAddress: e.target.value })}
                    placeholder="0x..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Function Signature</label>
                  <Input
                    type="text"
                    value={proposalForm.functionSignature}
                    onChange={(e) => setProposalForm({ ...proposalForm, functionSignature: e.target.value })}
                    placeholder="functionName(uint256,string)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Calldata (hex)</label>
                <textarea
                  value={proposalForm.calldata}
                  onChange={(e) => setProposalForm({ ...proposalForm, calldata: e.target.value })}
                  placeholder="0x..."
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  rows={2}
                />
              </div>

              <Button
                onClick={handleCreateProposal}
                disabled={formLoading || !proposalForm.title || !proposalForm.description}
                className="w-full"
              >
                {formLoading ? 'Creating...' : 'Submit Proposal'}
              </Button>
            </div>
          </div>
        )}

        {/* Proposals List */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Proposals</h2>

          {loading ? (
            <div className="text-center text-slate-400">Loading proposals...</div>
          ) : proposals.length === 0 ? (
            <div className="text-center text-slate-400">No proposals yet</div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {proposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{proposal.description}</h3>
                      <p className="text-sm text-slate-400 mt-2">Proposer: {proposal.proposer.slice(0, 10)}...</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded text-xs font-semibold ${
                        proposal.state === 'Active'
                          ? 'bg-blue-900 text-blue-200'
                          : proposal.state === 'Executed'
                            ? 'bg-green-900 text-green-200'
                            : proposal.state === 'Defeated'
                              ? 'bg-red-900 text-red-200'
                              : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {proposal.state}
                    </span>
                  </div>

                  {/* Vote Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-slate-400">For</p>
                      <p className="text-lg font-bold text-green-400">{proposal.forVotes.toString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Against</p>
                      <p className="text-lg font-bold text-red-400">{proposal.againstVotes.toString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Abstain</p>
                      <p className="text-lg font-bold text-slate-400">{proposal.abstainVotes.toString()}</p>
                    </div>
                  </div>

                  {/* Progress Bars */}
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-700 rounded h-2">
                        <div
                          className="bg-green-500 h-2 rounded"
                          style={{
                            width: `${
                              Number(proposal.forVotes) + Number(proposal.againstVotes) > 0
                                ? (Number(proposal.forVotes) /
                                    (Number(proposal.forVotes) + Number(proposal.againstVotes))) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-slate-400">
                        {proposal.forVotes.toString()} / {(proposal.forVotes + proposal.againstVotes).toString()}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {proposal.state === 'Active' && (
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleVote(proposal.id, 1)}
                        disabled={loading}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        Support
                      </Button>
                      <Button
                        onClick={() => handleVote(proposal.id, 0)}
                        disabled={loading}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                      >
                        Reject
                      </Button>
                      <Button
                        onClick={() => handleVote(proposal.id, 2)}
                        disabled={loading}
                        className="flex-1 bg-slate-600 hover:bg-slate-700"
                      >
                        Abstain
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}