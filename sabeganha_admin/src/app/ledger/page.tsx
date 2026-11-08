import React from 'react';

export default function LedgerPage() {
  const accounts = [
    { type: 'SYSTEM_LIABILITY', currency: 'QUIZ_COINS', label: 'Passivo Sistêmico (Emissão Total)', balance: '-32.450 QC', status: 'Balanceado' },
    { type: 'USER_WALLET', currency: 'QUIZ_COINS', label: 'Carteiras de Usuários Ativos', balance: '+31.850 QC', status: 'Auditado' },
    { type: 'RESERVE_ESCROW', currency: 'QUIZ_COINS', label: 'Reserva para Resgates em Andamento', balance: '+600 QC', status: 'Auditado' },
  ];

  const recentTransactions = [
    { id: 'tx_981a', date: 'Hoje às 10:55', user: 'teste (ID: 3b1a...)', type: 'REWARD_REDEMPTION', delta: '-100 QC', desc: 'Resgate Voucher Livros e Cursos' },
    { id: 'tx_980c', date: 'Hoje às 10:48', user: 'teste (ID: 3b1a...)', type: 'QUIZ_COMPLETION', delta: '+20 QC', desc: 'Quiz Conhecimentos Gerais' },
    { id: 'tx_979b', date: 'Hoje às 09:12', user: 'usuario_1793', type: 'DAILY_REWARD', delta: '+10 QC', desc: 'Recompensa Diária (Dia 1)' },
    { id: 'tx_978f', date: 'Ontem às 22:30', user: 'usuario_8821', type: 'STREAK_BONUS', delta: '+25 QC', desc: 'Bônus Streak 5 dias' },
    { id: 'tx_977e', date: 'Ontem às 19:15', user: 'usuario_4402', type: 'REWARD_REDEMPTION', delta: '-500 QC', desc: 'Resgate Vale-Presente R$ 10' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Ledger Contábil & Auditoria</h1>
        <p className="text-sm text-slate-500 mt-1">
          Registro imutável em partidas dobradas (Double-Entry Ledger). A soma de débitos e créditos é rigorosamente zero.
        </p>
      </div>

      {/* Visão de Contas do Ledger */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {accounts.map((acc, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">{acc.type}</span>
            <p className="text-sm font-semibold text-slate-800 mt-1">{acc.label}</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-3">{acc.balance}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-semibold text-emerald-700">{acc.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Regra de Equilíbrio Contábil */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
            ✓
          </div>
          <div>
            <h3 className="text-sm font-bold text-emerald-950">Princípio das Partidas Dobradas: 100% Reconciliado</h3>
            <p className="text-xs text-emerald-800 mt-0.5">
              Passivo Sistêmico (-32.450) + Carteiras (+31.850) + Reserva (+600) = <strong>0 QC</strong> (Diferença zero).
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-emerald-800 bg-emerald-200/60 px-3 py-1 rounded-full">
          Auditado em Tempo Real
        </span>
      </div>

      {/* Tabela de Transações Recentes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Trilha de Auditoria Recente</h2>
          <span className="text-xs text-slate-400">Últimos lançamentos contábeis</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-100">
              <tr>
                <th className="px-5 py-3 font-semibold">ID Transação</th>
                <th className="px-5 py-3 font-semibold">Data / Hora</th>
                <th className="px-5 py-3 font-semibold">Usuário</th>
                <th className="px-5 py-3 font-semibold">Operação</th>
                <th className="px-5 py-3 font-semibold">Variação</th>
                <th className="px-5 py-3 font-semibold">Descrição</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/60 transition font-mono text-xs">
                  <td className="px-5 py-3.5 font-bold text-purple-700">{tx.id}</td>
                  <td className="px-5 py-3.5 font-sans">{tx.date}</td>
                  <td className="px-5 py-3.5 font-sans font-medium text-slate-900">{tx.user}</td>
                  <td className="px-5 py-3.5 font-sans">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-semibold">
                      {tx.type}
                    </span>
                  </td>
                  <td className={`px-5 py-3.5 font-sans font-bold text-sm ${
                    tx.delta.startsWith('-') ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {tx.delta}
                  </td>
                  <td className="px-5 py-3.5 font-sans text-slate-600">{tx.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

