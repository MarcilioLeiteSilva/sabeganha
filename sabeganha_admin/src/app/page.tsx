export default function DashboardHome() {
  const stats = [
    { label: 'Usuários Ativos (DAU)', value: '1.240', change: '+12% esta semana', color: 'text-emerald-600' },
    { label: 'Quizzes Concluídos Hoje', value: '4.890', change: '+24% vs ontem', color: 'text-purple-600' },
    { label: 'Quiz Coins Emitidos (Ledger)', value: '68.500', change: 'Saldo auditado 100%', color: 'text-indigo-600' },
    { label: 'Resgates no Catálogo', value: '38', change: 'Estoque monitorado', color: 'text-amber-600' },
  ];

  const categories = [
    { name: 'Conhecimentos Gerais', count: 18, active: true },
    { name: 'Ciência e Tecnologia', count: 24, active: true },
    { name: 'História', count: 15, active: true },
    { name: 'Geografia', count: 12, active: true },
    { name: 'Esportes', count: 14, active: true },
    { name: 'Entretenimento', count: 20, active: true },
    { name: 'Matemática e Lógica', count: 16, active: true },
    { name: 'Literatura', count: 10, active: true },
    { name: 'Cultura e Curiosidades', count: 12, active: true },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-800 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">Bem-vindo ao SabeGanha Control Center</h1>
        <p className="text-purple-100 text-sm mt-1 max-w-2xl">
          Monitore a saúde do ecossistema educacional, o fluxo contábil de recompensas pelo Ledger
          auditável e a moderação de conteúdo em tempo real.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase">{stat.label}</p>
            <p className={`text-2xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-slate-400 mt-1">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Categorias e Status do Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categorias Ativas */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Categorias Curadas (9 Macro-tópicos)</h3>
            <span className="text-xs text-purple-600 font-medium">100% Ativas</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-sm font-medium text-slate-700">{cat.name}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                  {cat.count} Quizzes
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Status de Auditoria do Ledger */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-slate-800 mb-2">Auditoria do Ledger</h3>
            <p className="text-xs text-slate-500 mb-4">
              Princípio das partidas dobradas (Débitos = Créditos) verificado pelo job diário.
            </p>
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                <p className="text-xs text-emerald-800 font-medium">Reconciliação Matemática</p>
                <p className="text-sm font-bold text-emerald-900 mt-0.5">Saldo 100% Balanceado</p>
              </div>
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                <p className="text-xs text-indigo-800 font-medium">Política Regulamentar</p>
                <p className="text-sm font-bold text-indigo-900 mt-0.5">Modelo A Ativo (Fidelidade)</p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <p className="text-xs text-amber-800 font-medium">Trava de Orçamento</p>
                <p className="text-sm font-bold text-amber-900 mt-0.5">Queima em 31.4% (Teto 35%)</p>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-4 text-center">
            Última reconciliação automática: Hoje às 03:00 UTC-3
          </p>
        </div>
      </div>
    </div>
  );
}

