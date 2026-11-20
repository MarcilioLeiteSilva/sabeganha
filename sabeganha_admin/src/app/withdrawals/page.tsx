'use client';

import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Copy, 
  Search, 
  Filter, 
  ShieldCheck, 
  ExternalLink,
  AlertTriangle
} from 'lucide-react';

interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  pixType: 'CPF' | 'E-mail' | 'Telefone' | 'Chave Aleatória' | 'Voucher Parceiro';
  pixKey: string;
  cpfHolder: string;
  coinAmount: number;
  brlAmount: number;
  status: 'PENDING' | 'PAID' | 'REJECTED';
  requestedAt: string;
  notes?: string;
}

const INITIAL_REQUESTS: WithdrawalRequest[] = [
  {
    id: 'REQ-2026-0891',
    userId: 'usr_8921a',
    userName: 'Marcilio Silveira',
    userEmail: 'marcilio@exemplo.com.br',
    pixType: 'CPF',
    pixKey: '123.456.789-00',
    cpfHolder: '123.456.789-00',
    coinAmount: 1000,
    brlAmount: 10.00,
    status: 'PENDING',
    requestedAt: '2026-11-20 16:30',
    notes: 'Meta R$ 10,00 atingida via Desafio Diário e Quiz Tradicional.',
  },
  {
    id: 'REQ-2026-0890',
    userId: 'usr_4412c',
    userName: 'Ana Paula Souza',
    userEmail: 'anapaula.souza@gmail.com',
    pixType: 'Telefone',
    pixKey: '+55 11 98765-4321',
    cpfHolder: '234.567.890-11',
    coinAmount: 2000,
    brlAmount: 20.00,
    status: 'PAID',
    requestedAt: '2026-11-20 14:15',
    notes: 'Pix liquidado via Stone OpenBanking. ID: E0003816620261120141500',
  },
  {
    id: 'REQ-2026-0889',
    userId: 'usr_1092e',
    userName: 'Carlos Eduardo Mendes',
    userEmail: 'carlos.eduardo@outlook.com',
    pixType: 'E-mail',
    pixKey: 'carlos.eduardo@outlook.com',
    cpfHolder: '345.678.901-22',
    coinAmount: 1000,
    brlAmount: 10.00,
    status: 'PAID',
    requestedAt: '2026-11-20 11:05',
    notes: 'Pix liquidado via Stone OpenBanking. ID: E0003816620261120110512',
  },
  {
    id: 'REQ-2026-0888',
    userId: 'usr_9934x',
    userName: 'Usuário Suspeito AutoBot',
    userEmail: 'bot_farm_88@tempmail.com',
    pixType: 'Chave Aleatória',
    pixKey: '4a1b8c9d-0011-2233-4455-66778899aabb',
    cpfHolder: '000.000.000-00',
    coinAmount: 5000,
    brlAmount: 50.00,
    status: 'REJECTED',
    requestedAt: '2026-11-19 23:45',
    notes: 'Bloqueado por Antifraude: Anomalia de velocidade de resposta (<500ms por questão repetida). Moedas estornadas.',
  },
];

export default function WithdrawalsPage() {
  const [requests, setRequests] = useState<WithdrawalRequest[]>(INITIAL_REQUESTS);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'PAID' | 'REJECTED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    showToast(`Chave Pix copiada: ${key}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleApprove = (id: string) => {
    setRequests(prev => prev.map(req => {
      if (req.id === id) {
        return {
          ...req,
          status: 'PAID',
          notes: `Aprovado e liquidado pelo administrador em ${new Date().toLocaleTimeString('pt-BR')}`
        };
      }
      return req;
    }));
    showToast(`Solicitação ${id} marcada como PAGA! Notificação enviada ao usuário.`);
  };

  const handleReject = (id: string) => {
    const reason = prompt('Informe o motivo da recusa para estorno no Ledger:', 'Inconsistência cadastral ou auditoria antifraude');
    if (reason === null) return;

    setRequests(prev => prev.map(req => {
      if (req.id === id) {
        return {
          ...req,
          status: 'REJECTED',
          notes: `Recusado: ${reason}. Saldo de ${req.coinAmount} QC estornado no Ledger.`
        };
      }
      return req;
    }));
    showToast(`Solicitação ${id} recusada. ${reason}`);
  };

  const filteredRequests = requests.filter(req => {
    const matchesFilter = filter === 'ALL' ? true : req.status === filter;
    const matchesSearch = 
      req.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.pixKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalPendingBrl = requests
    .filter(r => r.status === 'PENDING')
    .reduce((acc, r) => acc + r.brlAmount, 0);

  const totalPaidBrl = requests
    .filter(r => r.status === 'PAID')
    .reduce((acc, r) => acc + r.brlAmount, 0);

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 animate-fade-in text-sm font-medium">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Solicitações de Resgate & Pix</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestão operacional de liquidação financeira do <strong>Modelo A</strong> (Prêmios e Benefícios por Mérito Intelectual).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Ledger Reconciliado
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pendente de Envio</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-extrabold text-amber-600 mt-2">
            R$ {totalPendingBrl.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-xs text-slate-500 mt-1">{pendingCount} resgate(s) aguardando liberação</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Liquidado (Mês)</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-2">
            R$ {totalPaidBrl.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-xs text-slate-500 mt-1">100% transferido via Pix</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tempo Médio SLA</span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-extrabold text-purple-600 mt-2">42 min</p>
          <p className="text-xs text-slate-500 mt-1">Meta operacional &lt; 24h úteis</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Taxa de Aprovação</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-extrabold text-indigo-600 mt-2">97.4%</p>
          <p className="text-xs text-slate-500 mt-1">2.6% bloqueados por antifraude</p>
        </div>
      </div>

      {/* Compliance / Security Warning Banner */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-purple-900 leading-relaxed">
          <strong>Diretriz de Segurança Modelo A (Pix & Titularidade):</strong>
          <span className="block mt-0.5">
            Para prevenção de fraude e conformidade fiscal, sempre verifique se a chave Pix informada pertence ao mesmo CPF cadastrado no perfil do jogador. Resgates suspeitos ou com respostas em menos de 1 segundo devem ser auditados no menu de <em>Alertas Antifraude</em> antes da liquidação bancária.
          </span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por usuário, e-mail, chave Pix ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              filter === 'ALL'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({requests.length})
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
              filter === 'PENDING'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-300"></span>
            Pendentes ({requests.filter(r => r.status === 'PENDING').length})
          </button>
          <button
            onClick={() => setFilter('PAID')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              filter === 'PAID'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pagos ({requests.filter(r => r.status === 'PAID').length})
          </button>
          <button
            onClick={() => setFilter('REJECTED')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              filter === 'REJECTED'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Recusados ({requests.filter(r => r.status === 'REJECTED').length})
          </button>
        </div>
      </div>

      {/* Table of Withdrawals */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Fila de Liquidação</h2>
          <span className="text-xs text-slate-400">
            Exibindo {filteredRequests.length} de {requests.length} registros
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-100">
              <tr>
                <th className="px-5 py-3 font-semibold">ID / Data</th>
                <th className="px-5 py-3 font-semibold">Usuário Titular</th>
                <th className="px-5 py-3 font-semibold">Chave Pix & Destino</th>
                <th className="px-5 py-3 font-semibold">Valor Resgatado</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Ações Operacionais</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    Nenhuma solicitação encontrada para o filtro selecionado.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/60 transition">
                    {/* ID e Data */}
                    <td className="px-5 py-4">
                      <p className="font-mono text-xs font-bold text-purple-700">{req.id}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{req.requestedAt}</p>
                    </td>

                    {/* Usuário Titular */}
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{req.userName}</p>
                      <p className="text-xs text-slate-400">{req.userEmail}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">CPF: {req.cpfHolder}</p>
                    </td>

                    {/* Chave Pix */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {req.pixType}
                        </span>
                        <button
                          onClick={() => copyToClipboard(req.pixKey)}
                          title="Copiar Chave Pix"
                          className="p-1 text-slate-400 hover:text-purple-600 rounded transition"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="font-mono text-xs text-slate-800 font-medium mt-1 select-all">
                        {req.pixKey}
                      </p>
                    </td>

                    {/* Valor */}
                    <td className="px-5 py-4">
                      <p className="text-sm font-extrabold text-slate-900">
                        R$ {req.brlAmount.toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-xs text-purple-700 font-semibold">{req.coinAmount} QC</p>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      {req.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Aguardando Envio
                        </span>
                      )}
                      {req.status === 'PAID' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Pago / Liquidado
                        </span>
                      )}
                      {req.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          Recusado / Estornado
                        </span>
                      )}
                      {req.notes && (
                        <p className="text-[11px] text-slate-400 mt-1 max-w-xs truncate" title={req.notes}>
                          {req.notes}
                        </p>
                      )}
                    </td>

                    {/* Ações */}
                    <td className="px-5 py-4 text-right">
                      {req.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(req.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Confirmar Pix
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition flex items-center gap-1 border border-rose-200"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Recusar
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Finalizado</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
