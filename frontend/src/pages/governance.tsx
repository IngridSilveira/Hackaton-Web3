import { useEffect, useState } from 'react';
import { useWalletStore } from '../stores/useWalletStore';
import { useUserStore } from '../stores/useUserStore';
import {
  GovernanceContract,
  type ProposalData,
  type RequestWithdrawalParams,
  type ProposalState,
} from '../contracts/governance';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { SuccessBox } from '../components/successBox';
import { ErrorBox } from '../components/errorBox';
import { CircleLoadding } from '../components/circleLoadding';
import { ethers } from 'ethers';

export default function GovernancePage() {
  const { signer, provider, address, connected } = useWalletStore();
  const { userType } = useUserStore();

  // userType === 0 → ONG (pode solicitar saque)
  // userType === 1 → Doador (pode votar)
  const isONG = userType === 0;

  // Contract & UI State
  const [governance, setGovernance] = useState<GovernanceContract | null>(null);
  const [votingPower, setVotingPower]   = useState<bigint>(0n);
  const [proposals, setProposals]       = useState<ProposalData[]>([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [success, setSuccess]           = useState<string | null>(null);

  // Form State (visível apenas para ONGs)
  const [showForm, setShowForm]   = useState(false);
  const [formData, setFormData]   = useState({
    campaignId:  '',
    ongWallet:   '',
    amount:      '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // ── Inicializar contrato ──────────────────────────────────────
  useEffect(() => {
    if (signer && provider && connected) {
      try {
        setGovernance(new GovernanceContract(signer, provider));
      } catch (e) {
        setError((e as Error).message);
      }
    }
  }, [signer, provider, connected]);

  // ── Carregar dados on-chain ───────────────────────────────────
  useEffect(() => {
    if (!governance || !address) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      // Poder de voto
      const [power, powerErr] = await governance.getVotingPower(address);
      if (!powerErr && power !== null) setVotingPower(power);

      // Propostas (via eventos WithdrawalRequested)
      const [props, propsErr] = await governance.getProposals();
      if (propsErr) {
        setError(propsErr.message);
      } else if (props) {
        // Ordena: Active primeiro, depois Succeeded, depois restantes
        const order: ProposalState[] = [
          'Active', 'Succeeded', 'Pending', 'Queued',
          'Executed', 'Defeated', 'Canceled',
        ];
        setProposals(
          [...props].sort(
            (a, b) => order.indexOf(a.state) - order.indexOf(b.state)
          )
        );
      }

      setLoading(false);
    };

    load();
    const interval = setInterval(load, 30_000); // recarrega a cada 30s
    return () => clearInterval(interval);
  }, [governance, address]);

  // ── Handlers ─────────────────────────────────────────────────

  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!governance || !address) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const params: RequestWithdrawalParams = {
      campaignId:  formData.campaignId,
      ongWallet:   formData.ongWallet,
      amount:      BigInt(formData.amount),
      description: formData.description,
    };

    const [proposalId, err] = await governance.requestWithdrawal(params);

    if (err) {
      setError(err.message);
    } else if (proposalId) {
      setSuccess(`Proposta de saque criada! ID: ${proposalId.slice(0, 14)}…`);
      setFormData({ campaignId: '', ongWallet: '', amount: '', description: '' });
      setShowForm(false);
    }

    setSubmitting(false);
  };

  const handleVote = async (proposalId: string, support: 0 | 1 | 2) => {
    if (!governance) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    const [txHash, err] = await governance.castVote(proposalId, support);

    if (err) {
      setError(err.message);
    } else if (txHash) {
      setSuccess(`Voto registrado! Tx: ${txHash.slice(0, 14)}…`);
    }

    setLoading(false);
  };

  const handleExecute = async (proposal: ProposalData) => {
    if (!governance) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Usa campaignId (não proposalId) para reconstruir o calldata correto
    const [txHash, err] = await governance.executeProposal(
      proposal.campaignId,
      proposal.ongWallet,
      proposal.amount,
      proposal.description
    );

    if (err) {
      setError(err.message);
    } else if (txHash) {
      setSuccess(`Saque executado! Tx: ${txHash.slice(0, 14)}…`);
    }

    setLoading(false);
  };

  // ── Tela sem carteira ─────────────────────────────────────────
  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-4xl mx-auto text-center mt-20">
          <h1 className="text-5xl font-bold text-white mb-4">Governança DAO</h1>
          <p className="text-xl text-slate-300">Conecte sua carteira para participar</p>
        </div>
      </div>
    );
  }

  // ── Tela principal ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-6">Governança DAO</h1>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg p-6 border border-slate-600">
              <p className="text-slate-400 text-sm font-medium uppercase">Poder de Voto</p>
              <p className="text-4xl font-bold text-white mt-2">
                {(Number(votingPower) / 1e18).toFixed(4)}
              </p>
              <p className="text-xs text-slate-400 mt-2">IMPACT Tokens</p>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg p-6 border border-slate-600">
              <p className="text-slate-400 text-sm font-medium uppercase">Propostas Ativas</p>
              <p className="text-4xl font-bold text-white mt-2">
                {proposals.filter(p => p.state === 'Active').length}
              </p>
              <p className="text-xs text-slate-400 mt-2">de {proposals.length} total</p>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg p-6 border border-slate-600">
              <p className="text-slate-400 text-sm font-medium uppercase">Perfil</p>
              <p className="text-2xl font-bold text-white mt-2">
                {isONG ? '🏢 ONG' : '🧑 Doador'}
              </p>
              <p className="text-xs text-slate-400 mt-2 truncate">{address}</p>
            </div>
          </div>
        </div>

        {/* Mensagens */}
        {error   && <ErrorBox   message={error}   />}
        {success && <SuccessBox message={success} />}

        {/* Loading */}
        {loading && <CircleLoadding description="A carregar dados da governança..." />}

        {/* Botão de saque — apenas para ONGs */}
        {isONG && (
          <div className="mb-8">
            <Button
              id="btn-request-withdrawal"
              onClick={() => setShowForm(!showForm)}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              {showForm ? 'Cancelar' : '+ Solicitar Saque'}
            </Button>
          </div>
        )}

        {/* Formulário de solicitação de saque */}
        {isONG && showForm && (
          <div className="bg-slate-800 border border-slate-600 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              Nova Proposta de Saque
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              Cria uma proposta de governança para liberar os fundos arrecadados
              em uma campanha. Os doadores votarão antes da liberação.
            </p>

            <form onSubmit={handleRequestWithdrawal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  ID da Campanha
                </label>
                <Input
                  id="input-campaign-id"
                  type="number"
                  value={formData.campaignId}
                  onChange={e => setFormData({ ...formData, campaignId: e.target.value })}
                  placeholder="Ex: 0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Carteira da ONG (destino dos fundos)
                </label>
                <Input
                  id="input-ong-wallet"
                  type="text"
                  value={formData.ongWallet}
                  onChange={e => setFormData({ ...formData, ongWallet: e.target.value })}
                  placeholder="0x..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Valor a Sacar (em ETH)
                </label>
                <Input
                  id="input-withdrawal-amount"
                  type="number"
                  step="0.0001"
                  min="0"
                  value={formData.amount}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      // Converte ETH → Wei para o contrato
                      amount: e.target.value
                        ? String(ethers.parseEther(e.target.value))
                        : '',
                    })
                  }
                  placeholder="0.05"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Descrição / Comprovante
                </label>
                <textarea
                  id="input-proposal-description"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o uso dos fundos. Se tiver comprovante no IPFS, cole o link aqui: ipfs://..."
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  required
                />
              </div>

              <Button
                id="btn-submit-withdrawal"
                type="submit"
                disabled={submitting || !formData.campaignId || !formData.ongWallet || !formData.amount}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {submitting ? 'Enviando...' : 'Criar Proposta de Saque'}
              </Button>
            </form>
          </div>
        )}

        {/* Lista de Propostas */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Propostas de Saque</h2>

          {proposals.length === 0 && !loading ? (
            <div className="text-center py-12 bg-slate-800 border border-slate-700 rounded-lg">
              <p className="text-slate-400 text-lg">Nenhuma proposta encontrada</p>
              <p className="text-slate-500 text-sm mt-2">
                {isONG
                  ? 'Solicite um saque para criar a primeira proposta.'
                  : 'As propostas aparecerão aqui quando uma ONG solicitar um saque.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {proposals.map(proposal => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  isONG={isONG}
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

// ============================================================
// ProposalCard
// ============================================================

interface ProposalCardProps {
  proposal:  ProposalData;
  isONG:     boolean;
  onVote:    (id: string, support: 0 | 1 | 2) => Promise<void>;
  onExecute: (proposal: ProposalData) => Promise<void>;
  isLoading: boolean;
}

function ProposalCard({ proposal, isONG, onVote, onExecute, isLoading }: ProposalCardProps) {
  const stateColors: Record<ProposalState, string> = {
    Pending:   'bg-yellow-900 text-yellow-200',
    Active:    'bg-blue-900 text-blue-200',
    Canceled:  'bg-gray-800 text-gray-300',
    Defeated:  'bg-red-900 text-red-200',
    Succeeded: 'bg-green-900 text-green-200',
    Queued:    'bg-purple-900 text-purple-200',
    Executed:  'bg-emerald-900 text-emerald-200',
  };

  const stateLabels: Record<ProposalState, string> = {
    Pending:   'Pendente',
    Active:    'Votação Aberta',
    Canceled:  'Cancelada',
    Defeated:  'Rejeitada',
    Succeeded: 'Aprovada',
    Queued:    'Na Fila',
    Executed:  'Executada',
  };

  const totalVotes  = Number(proposal.forVotes) + Number(proposal.againstVotes);
  const forPercent  = totalVotes > 0 ? (Number(proposal.forVotes)  / totalVotes) * 100 : 0;
  const amountInETH = (Number(proposal.amount) / 1e18).toFixed(4);

  // Verifica se a description contém um link IPFS
  const ipfsMatch   = proposal.description.match(/ipfs:\/\/\S+/i);
  const ipfsCid     = ipfsMatch ? ipfsMatch[0] : null;
  const ipfsGateway = ipfsCid
    ? `https://ipfs.io/ipfs/${ipfsCid.replace('ipfs://', '')}`
    : null;

  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg p-6 hover:border-slate-500 transition-colors">

      {/* Header do card */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-slate-500">
              Campanha #{proposal.campaignId}
            </span>
          </div>
          <p className="text-white leading-snug break-words">{proposal.description}</p>
          <p className="text-xs text-slate-400 mt-1">
            Proposto por: <span className="font-mono">{proposal.proposer.slice(0, 10)}…</span>
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-4 ${
            stateColors[proposal.state]
          }`}
        >
          {stateLabels[proposal.state]}
        </span>
      </div>

      {/* Informações do saque */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div className="bg-slate-700 rounded p-3">
          <p className="text-slate-400 text-xs uppercase mb-1">Valor Solicitado</p>
          <p className="text-white font-bold">{amountInETH} ETH</p>
        </div>
        <div className="bg-slate-700 rounded p-3">
          <p className="text-slate-400 text-xs uppercase mb-1">Destino</p>
          <p className="text-white font-mono text-xs truncate">{proposal.ongWallet}</p>
        </div>
      </div>

      {/* Link IPFS (se presente na descrição) */}
      {ipfsGateway && (
        <div className="mb-4">
          <a
            href={ipfsGateway}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm underline"
          >
            📄 Ver Comprovante (IPFS)
          </a>
        </div>
      )}

      {/* Barra de votos */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">
            A Favor:{' '}
            <span className="text-green-400 font-semibold">
              {(Number(proposal.forVotes) / 1e18).toFixed(4)} IMPACT
            </span>
          </span>
          <span className="text-slate-400">
            Contra:{' '}
            <span className="text-red-400 font-semibold">
              {(Number(proposal.againstVotes) / 1e18).toFixed(4)} IMPACT
            </span>
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-green-500 to-green-600 h-full transition-all duration-500"
            style={{ width: `${forPercent}%` }}
          />
        </div>
        {totalVotes === 0 && (
          <p className="text-xs text-slate-500 mt-1 text-center">Nenhum voto registrado ainda</p>
        )}
      </div>

      {/* Ações */}
      <div className="flex gap-3 flex-wrap">
        {/* Votar — visível para doadores em propostas ativas */}
        {proposal.state === 'Active' && !isONG && (
          <>
            <Button
              id={`btn-vote-for-${proposal.id.slice(0, 8)}`}
              onClick={() => onVote(proposal.id, 1)}
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              ✓ Aprovar
            </Button>
            <Button
              id={`btn-vote-against-${proposal.id.slice(0, 8)}`}
              onClick={() => onVote(proposal.id, 0)}
              disabled={isLoading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              ✗ Rejeitar
            </Button>
          </>
        )}

        {/* Executar — disponível para qualquer um quando aprovada */}
        {proposal.state === 'Succeeded' && (
          <Button
            id={`btn-execute-${proposal.id.slice(0, 8)}`}
            onClick={() => onExecute(proposal)}
            disabled={isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            🚀 Executar Saque
          </Button>
        )}

        {/* Rótulo informativo para estados finais */}
        {(proposal.state === 'Executed' || proposal.state === 'Defeated' || proposal.state === 'Canceled') && (
          <p className="text-sm text-slate-500 w-full text-center">
            {proposal.state === 'Executed'  && '✅ Fundos já transferidos para a ONG'}
            {proposal.state === 'Defeated'  && '❌ Proposta rejeitada pelos doadores'}
            {proposal.state === 'Canceled'  && '⚠️ Proposta cancelada'}
          </p>
        )}
      </div>
    </div>
  );
}