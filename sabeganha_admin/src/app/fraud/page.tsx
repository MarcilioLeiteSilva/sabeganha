import React from 'react';

export default function FraudPage() {
  const alerts = [
    { id: 'ALT-104', user: 'bot_candidate_88', type: 'Resposta Ulrarrápida (< 400ms)', quiz: 'Matemática e Lógica', score: '10/10', severity: 'Alta', status: 'Bloqueado Automático' },
    { id: 'ALT-103', user: 'multi_acc_71', type: 'Múltiplos logins mesmo Device ID', quiz: 'Conhecimentos Gerais', score: '8/10', severity: 'Média', status: 'Em Análise' },
    { id: 'ALT-102', user: 'rapid_click_33', type: 'Padrão Não-Humano de Toques', quiz: 'Ciência e Tecnologia', score: '9/10', severity: 'Baixa', status: 'Resolvido (Falso Positivo)' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Alertas de Integridade & Antifraude</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitoramento contínuo de mérito intelectual genuíno, detecção de automação e prevenção de conluio.
        </p>
      </div>

      {/* Cartões de Status de Segurança */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Alertas Ativos Hoje</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">1 Alerta</p>
          <p className="text-xs text-slate-400 mt-1">Tempo médio de resposta normal</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Tentativas de Bot Bloqueadas</p>
          <p className="text-2xl font-bold text-red-600 mt-1">14 tentativas</p>
          <p className="text-xs text-slate-400 mt-1">Taxa de assertividade 99.8%</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Índice de Confiabilidade</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">99.4%</p>
          <p className="text-xs text-slate-400 mt-1">Comportamento humano verificado</p>
        </div>
      </div>

      {/* Tabela de Incidentes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Incidentes Recentes de Trapaça / Automação</h2>
          <span className="text-xs text-slate-400">Tempo real</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-100">
              <tr>
                <th className="px-5 py-3 font-semibold">ID Alerta</th>
                <th className="px-5 py-3 font-semibold">Usuário Sinalizado</th>
                <th className="px-5 py-3 font-semibold">Regra Disparada</th>
                <th className="px-5 py-3 font-semibold">Quiz</th>
                <th className="px-5 py-3 font-semibold">Severidade</th>
                <th className="px-5 py-3 font-semibold">Ação do Sistema</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alerts.map((alt) => (
                <tr key={alt.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-5 py-3.5 font-mono text-xs font-bold text-purple-700">{alt.id}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-900">{alt.user}</td>
                  <td className="px-5 py-3.5">{alt.type}</td>
                  <td className="px-5 py-3.5">{alt.quiz}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                      alt.severity === 'Alta' ? 'bg-red-100 text-red-700' :
                      alt.severity === 'Média' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {alt.severity}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-slate-100 text-slate-800">
                      {alt.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

